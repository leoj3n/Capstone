
//@script RequireComponent( CharacterController )

public var atlas : CharacterAtlas;
public var walkSpeed : float = 6.0;
public var jumpHeight : float = 2.0;
public var attackOneForce : float = 40.0;
public var attackOneDamping : float = 2.0;
public var attackTwoForce : float = 80.0;
public var attackTwoDamping : float = 5.0;
public var sound : AudioClip[];
public var expectedSounds : CharacterSound; // just for exposing expected order of sounds in inspector
public var statsTexture : Texture2D;
public var statsAtlas : TextAsset;
public var impactEffectPrefab : GameObject;
public var baseOffset : Vector3 = Vector3.zero;
public var isControllable : boolean = true;

// STATIC
protected var boundController : ControllerEnum;
private var shadow : Transform;
private var shadowProjector : Projector;
protected var shadowUseTAC : boolean = false;
protected var gravity : float = 50.0;
protected var groundedAcceleration : float = 10.0;
protected var inAirAcceleration : float = 10.0;
protected var characterController : CharacterController;
protected var taRenderer : TextureAtlasRenderer;
protected var textureAtlasCube : Transform;
protected var origShadowAspectRatio : float;
protected var origFps : float;
protected var ccOrigHeight : float;
protected var startPos : Vector3;

// STATE
protected var facing : int = 1; // 1 = right, -1 = left
protected var canJump : boolean = true;
protected var canMove : boolean = true;
protected var state : CharacterState;
protected var previousState : CharacterState;
protected var previousAtlas : CharacterAtlas;
protected var previousLoopCount : int = 0;
protected var attackedThisLoop : boolean = false;
protected var isNearlyGrounded : boolean = true;
protected var staticFrame : int = -1;
protected var reverse : boolean = false;
private var lastAttackTime : float = 0.0;
protected var cutScenePlaying = false;
protected var activeCutScene : CutScene;
protected var eliminated = false;

// OTHER
protected var hitForce : Vector3; // force from a hit from another avatar
protected var explosionForce : Vector3; // force from a meteor explosion or similar
protected var loop : boolean = true;
protected var offset : Vector3 = Vector3.zero;
protected var fps : float = 16.0;
protected var ccHeight : float = 4.0;
private var modifiedDeltaTime : float = 0.0;
protected var timeWarpFactor : float = 1.0;

// HEALTH AND GUAGE
protected var health : float = 100.0;
protected var power : float = 0.0;

// JUMPING
protected var jumping : boolean = false;
private var jumpTimeout : float = 0.15;
private var jumpRepeatTime : float = 0.05;
private var lastJumpButtonTime : float = -10.0;
private var lastJumpTime : float = -1.0;
protected var verticalSpeed : float = 0.0;
protected var inAirVelocity : Vector3 = Vector3.zero;

// MOVEMENT
protected var moveDirection : Vector3 = Vector3.zero;
protected var moveSpeed : float = 0.0;
protected var movingBack : boolean = false;
protected var isMoving : boolean = false;

function Awake() {
	characterController = GetComponent( CharacterController );
	taRenderer = GetComponentInChildren( TextureAtlasRenderer );
	textureAtlasCube = transform.Find( 'Texture Atlas Cube' );
	
	shadow = transform.Find( 'Shadow' );
	shadowProjector = shadow.GetComponent( Projector );
}

function Start() {
	origShadowAspectRatio = shadowProjector.aspectRatio;
	origFps = taRenderer.fps;
	ccOrigHeight = characterController.height;
	startPos = transform.position;
}

function OnGUI() {
	var point = Camera.main.WorldToScreenPoint( getCenterInWorld() + Vector2( 0.0, (getScaledHeight() * 0.80) ) );
	
	var rect : Rect = Rect( (point.x - 30.0), (Screen.height - point.y), 100.0, 60.0 );
	GUI.Label( rect, ('Controller ' + parseInt( getController() )) );
	
	rect = Rect( (point.x - 30.0), (Screen.height - point.y + 20.0), 50.0, 10.0 );
	GUI.DrawTexture( rect, GameManager.instance.healthTexture );
}

function Update() {
	if( isControllable ) {
		if (Global.getAxis( 'Vertical', boundController ) >= 0.2) lastJumpButtonTime = Time.time; // jump
		
		// force correct sign of z-scale
		if (Mathf.Sign( textureAtlasCube.transform.localScale.z ) == 1.0)
			textureAtlasCube.transform.localScale.z *= -1.0;
		
		// modify delta time
		modifiedDeltaTime = (Time.deltaTime * timeWarpFactor);
		
		setHorizontalMovement();
		setVerticalMovement();
		doMovement();
		Global.enforceBounds( transform );
		
		if( isAlive() ) {
			if (GameManager.instance.avatars.Length == 2)
				faceNearestEnemy();
			else
				faceMoveDirection();
		}
		
		checkIfMovingBack();
		checkIfNearlyGrounded();
		
		updateShadow();
		
		determineState();
		determineAtlas();
		
		checkHealth();
	}
	
	shadowProjector.enabled = isControllable;
}

// utility function to safely decrement health
function decrementHealth( hp : float ) {
	// don't decrement if on last alive team
	var aliveTeamEnums : ControllerTeam[] = GameManager.instance.getAliveControllerTeamEnums();
	if ((aliveTeamEnums.Length == 1) && (aliveTeamEnums[0] == getTeam())) return;
	
	health = Mathf.Max( (health - hp), 0.0 );
}

// utility function to check if health is greater than zero
function isAlive() : boolean {
	return (health > 0.0);
}

// utility function to get health
function getHealth() : float {
	return Mathf.Max( health, 0.0 );
}

// utility function to get power
function getPower() : float {
	return Mathf.Max( power, 0.0 );
}

// utility function to check if power is greater than passed amount
function hasPower( amount : float ) : boolean {
	return (power > amount);
}
function hasPower() : boolean {
	return hasPower( 0.0 ); // check if power is greater than zero
}

// utility function to add or remove from power
function changePower( amount : int ) {
	power = Mathf.Max( (power + amount), 0.0 );
}

// utility function to do things based on character health
function checkHealth() {	
	if( !isAlive() ) {
		if( !eliminated && !audioIsPlaying( CharacterSound.AnnouncerName ) ) {
			GameManager.instance.audioPlay( 'Eliminated' );
			eliminated = true;
		}
	} else {
		eliminated = false;
		
		if (health < 10.0) GameManager.instance.audioPlay( 'Heartbeat' );
	}
}

// utility function to cause this avatar to face the nearest avatar
// IMPORTANT: the game expects all avatars to be facing right at the start
function faceNearestEnemy() {
	var dist : float = 0.0;
	var closestDist : float = 9999.0;
	var side : int = 1; // 1 = right, -1 = left
	var p1 : Vector3 = getCenterInWorld();
	for( var avatar : GameObject in GameManager.instance.avatars ) {
		if (onSameTeam( avatar )) continue; // continue if on same team (includes self)
		
		var p2 : Vector3 = avatar.GetComponent( Avatar ).getCenterInWorld();
		
		dist = Vector3.Distance( p1, p2 );
		if( dist < closestDist ) {
			closestDist = dist;
			side = ((p1.x < p2.x) ? 1 : -1); // if p2 is greater, it is on right
		}
	}
	
	// handle the rare case (should never happen in real gameplay)
	if( closestDist == 9999.0 ) {
		faceMoveDirection();
		Debug.LogWarning( 'Cannot face nearest enemy; No enemies found!' );
		return;
	}
	
	// face left or right (to face closest enemy)
	if( side == 1 ) { // closest is on right
		faceRight();
	} else { // closest is on left
		faceLeft();
	}
}

// utility function to cause this avatar to face the direction it is moving
function faceMoveDirection() {
	if( moveDirection.x > 0.0 ) { // moving right
		faceRight();
	} else if( moveDirection.x < 0.0 ) { // moving left
		faceLeft();
	}
}

// utility function for facing right
function faceRight() {
	if( facing == -1 ) { // if facing left
		facing = 1; // face right
		transform.localScale.x *= -1.0;
	}
}

// utility function for facing left
function faceLeft() {
	if( facing == 1 ) { // if facing right
		facing = -1; // face left
		transform.localScale.x *= -1.0;
	}
}

// sets movingBack, isMoving, moveDirection, moveSpeed and inAirVelocity
function setHorizontalMovement() {	
	var right : Vector3 = Vector3.right;
	
	var h : float = Global.getAxis( 'Horizontal', boundController );
	
	var wasMoving : boolean = isMoving;
	
	if( canMove ) {
		isMoving = (Mathf.Abs( h ) > 0.1); // check for any lateral joystick movement
		
		var targetDirection : Vector3 = (h * right); // x-axis user input
		
		// grounded controls
		if( characterController.isGrounded ) {
			// moveDirection is always normalized, and we only update it if there is user input
			if (targetDirection != Vector3.zero) moveDirection = targetDirection.normalized;
					
			// choose target speed
			var targetSpeed : float = Mathf.Min( targetDirection.magnitude, 1.0 ) * walkSpeed;
			
			// interpolate moveSpeed -> targetSpeed
			moveSpeed = Mathf.Lerp( moveSpeed, targetSpeed, (groundedAcceleration * modifiedDeltaTime) );
		} else if (isMoving) { // in air controls
			inAirVelocity += (targetDirection.normalized * modifiedDeltaTime * inAirAcceleration);
		}
	} else {
		isMoving = false;
		moveSpeed = 0.0;
		moveDirection = Vector3.zero;
	}
}

// sets verticalSpeed, jumping, lastJumpTime, lastJumpButtonTime
function setVerticalMovement() {
	// apply gravity (-0.05 fixes jittering isGrounded problem)
	verticalSpeed = (characterController.isGrounded ? -0.05 : (verticalSpeed - (gravity * modifiedDeltaTime)));
	
	// prevent jumping too fast after each other
	if (lastJumpTime + jumpRepeatTime > Time.time) return;

	if( characterController.isGrounded ) {
		// jump only when pressing the button down with a timeout so you can press the button slightly before landing		
		if( canJump && (Time.time < (lastJumpButtonTime + jumpTimeout)) ) {
			audioPlay( CharacterSound.Jump );
			Instantiate( GameManager.instance.jumpEffectPrefab ).transform.position = (getFootPosInWorld() + Vector3( 0.0, 1.0, 0.0 ));
			verticalSpeed = Mathf.Sqrt( 2 * jumpHeight * gravity );
			jumping = true;
			lastJumpTime = Time.time;
			lastJumpButtonTime = -10;
		}
	}
}

// move the character controller
function doMovement() {
	if( GameManager.instance.cutScenePlaying() ) {
		characterController.Move( modifiedDeltaTime * (Vector3( 0, verticalSpeed, 0 ) + inAirVelocity) );
		return; // only do gravity during cutscenes
	}
	
	characterController.Move( modifiedDeltaTime * 
		((moveDirection * moveSpeed) + Vector3( 0, verticalSpeed, 0 ) + inAirVelocity + hitForce + explosionForce) );
	
	if( characterController.isGrounded ) {
		inAirVelocity = Vector3.zero;
		jumping = false;
	}
}

// set movingBack variable
function checkIfMovingBack() {
	movingBack = (moveDirection.x != facing);
}

// set isNearlyGrounded variable
function checkIfNearlyGrounded() {
	var hits : RaycastHit[] = capsuleCast( Vector3.down, 2.0, GameManager.instance.nearlyGroundedLayerMask, Vector3( 0.0, 1.0, 0.0 ) );
	
	isNearlyGrounded = false;
	for( var hit : RaycastHit in hits ) {
		if (hit.transform != transform) isNearlyGrounded = true;
	}
}

// move the shadow with the character controller
function updateShadow() {
	var newPos : Vector3 = getCenterInWorld();
	if (shadowUseTAC) newPos.x = textureAtlasCube.position.x;
	
	shadow.position = Vector3.Lerp( shadow.position, newPos, (modifiedDeltaTime * 20) );
	
	shadowProjector.aspectRatio = (shadowUseTAC ? Mathf.Abs( textureAtlasCube.localScale.x ) : origShadowAspectRatio);
}

// determine the state of this avatar and apply it to the texture atlas renderer
function determineState() {	
	var blocking : boolean = (!isMoving && (Global.getAxis( 'Vertical', boundController ) <= -0.2)) ? true : false; // block
	
	// set dynamic variables to default state
	previousState = state;
	staticFrame = -1;
	loop = true;
	offset = Vector3.zero;
	reverse = false;
	fps = 16.0;
	canJump = true;
	canMove = true;
	shadowUseTAC = false;
	ccHeight = ccOrigHeight;
	
	// joystick-activated states
	switch( true ) {
		case jumping:
			state = CharacterState.Jump;
			break;
		case blocking:
			state = CharacterState.Block;
			break;
		case !isNearlyGrounded: // not joystick-activated but needs to be here
			state = CharacterState.Drop;
			break;
		case isMoving:
			state = CharacterState.Walk;
			break;
		default:
			state = CharacterState.Idle;
			break;
	}
	
	// grounded button-activated states (overrides joystick)
	if( isNearlyGrounded ) {
		switch( true ) {
			case Global.isButton( 'A', boundController ):
				state = CharacterState.Attack1;
				break;
			case Global.isButton( 'B', boundController ):
				state = CharacterState.Attack2;
				break;
			case Global.isButton( 'X', boundController ):
				state = CharacterState.Special1;
				break;
			case Global.isButton( 'Y', boundController ):
				state = CharacterState.Special2;
				break;
		}
	}
	
	// game-activated states (overrides all)
	switch( true ) {
		case (cutScenePlaying || (activeCutScene == CutScene.Victory)):
			state = CharacterState.CutScene;
			break;
		case (!isAlive()):
			state = CharacterState.Dead;
			break;
		case (explosionForce.magnitude > 0.1):			
			state = CharacterState.Fall;
			break;
		case (hitForce.magnitude > 3.0):			
			state = CharacterState.Hit;
			break;
	}
}

// set atlas (and do anything else necessary) based on state
function determineAtlas() {
	switch( state ) {
		case CharacterState.Dead:
			atlas = CharacterAtlas.Fall;
			if (previousState == state) staticFrame = (taRenderer.getFrameCount() - 1);
			offset = Vector3( -1.0, -0.2, 0.0 );
			shadowUseTAC = true;
			ccHeight = 1.5;
			canMove = canJump = false;
			break;
		case CharacterState.CutScene:
			switch( activeCutScene ) {
				case CutScene.Intro:
					atlas = CharacterAtlas.Intro;
					break;
				case CutScene.Victory:
					atlas = CharacterAtlas.Victory;
					break;
			}
			
			loop = false;
			shadowUseTAC = true;
			canMove = canJump = false;
			
			if ((previousState == state) && (taRenderer.getLoopCount() == 1))
				cutScenePlaying = false;
			break;
		case CharacterState.Jump:
			if (movingBack)
				atlas = CharacterAtlas.JumpBackward;
			else
				atlas = CharacterAtlas.JumpForward;
			break;
		case CharacterState.Drop:
			if (previousState == CharacterState.Drop) staticFrame = (taRenderer.getFrameCount() / 2);
			
			if (movingBack)
				atlas = CharacterAtlas.JumpBackward;
			else
				atlas = CharacterAtlas.JumpForward;
			break;
		case CharacterState.Walk:
			atlas = CharacterAtlas.Walk;
			if (movingBack) reverse = true;
			break;
		case CharacterState.Idle:
			atlas = CharacterAtlas.Idle;
			break;
		case CharacterState.Fall:
			atlas = CharacterAtlas.Fall;
			offset = Vector3( -1.0, -0.2, 0.0 );
			loop = false;
			shadowUseTAC = true;
			ccHeight = 1.5;
			canJump = canMove = false; // Input.ResetInputAxes(); ???
			break;
		case CharacterState.Hit:
			atlas = CharacterAtlas.Hit;
			loop = false;
			break;
		case CharacterState.Block:
			atlas = CharacterAtlas.Block;
			break;
		case CharacterState.Attack1:
			atlas = CharacterAtlas.Attack1;
			offset = Vector3( -0.5, 0.0, 0.0 );
			canMove = false;
			break;
		case CharacterState.Attack2:
			atlas = CharacterAtlas.Attack2;
			offset = Vector3( -0.5, 0.0, 0.0 );
			canMove = false;
			break;
		case CharacterState.Special1:
			atlas = CharacterAtlas.Special1;
			break;
		case CharacterState.Special2:
			atlas = CharacterAtlas.Special2;
			break;
		case CharacterState.Ultimate:
			atlas = CharacterAtlas.Ultimate;
			break;
	}
	
	CharacterStateSwitch();
	
	// resize character controller height
	resizeCharacterControllerHeight( ccHeight );
	
	// have we attacked this loop?
	if ((taRenderer.getLoopCount() != previousLoopCount) || (previousAtlas != atlas)) attackedThisLoop = false;
	previousAtlas = atlas;
	previousLoopCount = taRenderer.getLoopCount();
	
	// apply all changes to the texture atlas renderer
	var finalOffset : Vector3 = Vector3( baseOffset.x, (baseOffset.y - (characterController.height / 2.0)), baseOffset.z );
	taRenderer.setTextureAtlas( parseInt( atlas ), scaleAnchorFix( offset + finalOffset), loop );
	taRenderer.reverse = reverse;
	taRenderer.fps = (fps * timeWarpFactor);
	if( staticFrame > -1) {
		taRenderer.isStatic = true;
		taRenderer.staticFrame = staticFrame;
	} else {
		taRenderer.isStatic = false;
	}
}

// override this function in any character script to do any custom work such as
// switch over state in order to implement Special1, Special2 or Ultimate
function CharacterStateSwitch() { /* override this function */ }

// a hack to make footage facing the wrong way (to the right) work
function scaleAnchorFix( v : Vector3 ) : Vector3 {
	if (taRenderer.scaleAnchorHoriz == ScaleAnchorH.Right)
		return Vector3( (v.x * -1.0), v.y, v.z );
	else
		return v;
}

// utility function to resize character controller height (from bottom)
function resizeCharacterControllerHeight( newHeight : float ) {
	if( characterController.height != newHeight ) {
		transform.position.y += Mathf.Max( ((newHeight - characterController.height) / 2.0), 0.0 );
		characterController.height = newHeight;
	}
}

// utility function for doing capsule casts
function capsuleCast( dir : Vector3, dist : float, layerMask : LayerMask, offset : Vector3 ) : RaycastHit[] {	
	var p1 : Vector3;
	var p2 : Vector3;
	var center : Vector3;
	var radius : float = getScaledRadius();
	var halfHeight : float = (getScaledHeight() * 0.5);
	p1 = p2 = (getCenterInWorld() + offset);
	p1.y += halfHeight;
	p2.y -= halfHeight;
	
	var p1Real : Vector3 = (p1 + (dist * dir));
	var p2Real : Vector3 = (p2 + (dist * dir));
	var duration : float = 0.05;
	
	// draw the casting path
	Debug.DrawLine( p1, p1Real, Color.blue, duration );
	Debug.DrawLine( p2, p2Real, Color.blue, duration );
	debugDrawCapsule( p1Real, p2Real, radius, Color.red, duration ); // draw capsule in final place
	debugDrawCapsule( p1, p2, radius, Color.green, duration ); // draw capsule in initial place
	
	return Physics.CapsuleCastAll( p1, p2, radius, dir, dist, layerMask );
}

// helper function
function debugDrawCapsule( p1 : Vector3, p2 : Vector3, radius : float, color : Color, duration : float ) {
	var radiusVector : Vector3 = Vector3( radius, 0.0, 0.0 );
	Debug.DrawLine( p1, (p1 + radiusVector), color, duration );
	Debug.DrawLine( p1, (p1 - radiusVector), color, duration );
	Debug.DrawLine( p1, p2, color, duration );
	Debug.DrawLine( p2, (p2 + radiusVector), color, duration );
	Debug.DrawLine( p2, (p2 - radiusVector), color, duration );
}
function capsuleCast( dir : Vector3, dist : float, layerMask : LayerMask ) : RaycastHit[] {
	return capsuleCast( dir, dist, layerMask, Vector3.zero );
}

// utility function to try an attack (utilizes timeToAttack())
function tryAttack( attackType : AttackType, passedVar, castType : CastType ) : RaycastHit {	
	if (!timeToAttack( attackType, passedVar )) return;
	
	var sizeOfGeometry : Vector3 = Global.getSize( textureAtlasCube.gameObject );
	var dist : float = (Mathf.Abs( getScaledCenter().x ) + sizeOfGeometry.x + baseOffset.x + offset.x);
	var dir : Vector3 = Vector3( (facing * 1.0), 0.0, 0.0 );
	
	var hits : RaycastHit[];
	switch( castType ) {
		case CastType.Raycast:
			hits = Physics.RaycastAll( getCenterInWorld(), dir, dist, GameManager.instance.avatarOnlyLayerMask );
			break;
		case CastType.Capsule:
			hits = capsuleCast( dir, dist, GameManager.instance.avatarOnlyLayerMask );
			break;
	}
	
	if( hits ) {
		for( var hit : RaycastHit in hits ) {
			if (onSameTeam( hit.transform.gameObject )) continue; // skip if on same team (includes self)
			
			Debug.DrawRay( getCenterInWorld(), (dir * dist), Color.red, 0.05 );
			return hit; // return first non-self hit
		}
		
		audioPlay( Random.Range( 0, 2 ) ? CharacterSound.AttackMissA : CharacterSound.AttackMissB );
		
		Debug.DrawRay( getCenterInWorld(), (dir * dist), Color.blue, 0.05 );
	}
}

// helper functions
function raycastAttack( type : AttackType, passedVar ) : RaycastHit {
	return tryAttack( type, passedVar, CastType.Raycast );
}
function raycastAttack( type : AttackType ) : RaycastHit {
	return tryAttack( type, false, CastType.Raycast );
}
function capsuleAttack( type : AttackType, passedVar ) : RaycastHit {
	return tryAttack( type, passedVar, CastType.Capsule );
}
function capsuleAttack( type : AttackType ) : RaycastHit {
	return tryAttack( type, false, CastType.Capsule );
}

// utility function to determine if it is time to attack
function timeToAttack( type : AttackType, passedVar ) : boolean {	
	var isTime : boolean = false;
	
	if (previousState != state) return isTime; // texture atlas has not been set yet
	
	switch( type ) {
		case AttackType.SpecificFrame:
			if (!attackedThisLoop) isTime = (taRenderer.getFrameIndex() == passedVar);
			break;
		case AttackType.WidestFrame:
			if (!attackedThisLoop) isTime = (taRenderer.getFrameIndex() == taRenderer.getWidestFrameIndex());
			break;
		case AttackType.Timed:
			isTime = ((Time.time - lastAttackTime) > passedVar);
			break;
		case AttackType.Constant:
			isTime = true;
			break;
	}
	
	if( isTime ) {
		lastAttackTime = Time.time;
		attackedThisLoop = true;
	}
	
	return isTime;
}

// utility function to apply hit force to another avatar using a passed RaycastHit
function hitOtherAvatar( hit : RaycastHit, force : float, damping : float ) {
	if( !Global.isAvatar( hit.transform.gameObject ) ) {
		Debug.LogWarning( 'Cannot apply hit. This function only deals with avatars.' );
		return;
	}
	
	var other : Avatar = hit.transform.GetComponent( Avatar );
	var myCenter : Vector3 = getCenterInWorld();
	var otherCenter : Vector3 = other.getCenterInWorld();
	var hitPoint : Vector3 = hit.point;
	
	// move hit point up if below the belts of both avatars
	if ((hit.point.y < otherCenter.y) && (hit.point.y < myCenter.y))
		 hitPoint = Vector3( hit.point.x, (myCenter.y + Random.Range( -0.5, 1.0 )), hit.point.z );
	
	// impact effect	 
	var effect : GameObject = Instantiate( impactEffectPrefab, hitPoint, Quaternion.identity );
	var effectEmitter : ParticleEmitter = effect.GetComponent( ParticleEmitter );
	effectEmitter.localVelocity = Vector3.Scale( effectEmitter.localVelocity, -hit.normal );
	
	other.addHitForce( hitPoint, force, damping );
	
	audioPlay( Random.Range( 0, 2 ) ? CharacterSound.AttackImpactA : CharacterSound.AttackImpactB );
}

// utility function to get the avatar center in world coordinates
function getCenterInWorld() : Vector3 {
	return (transform.position + getScaledCenter());
}

function getFootPosInWorld() : Vector3 {
	return Vector3( getCenterInWorld().x, (getCenterInWorld().y - (getScaledHeight() / 2.0)), getCenterInWorld().z );
}

// utility function to get the scaled center of the character controller
function getScaledCenter() : Vector3 {
	return Vector3.Scale( characterController.center, transform.localScale );
}

// utility function to get the absolute scaled radius of the character controller
function getScaledRadius() : float {
	return Mathf.Abs( transform.localScale.x * characterController.radius );
}

// utility function to get the absolute scaled height of the character controller
function getScaledHeight() : float {
	return Mathf.Abs( transform.localScale.y * characterController.height );
}

// utility function to add an explosion force to this avatar
function addExplosionForce( pos : Vector3, radius : float, force : float, damping : float ) {
	var percentage : float = (1.0 - Mathf.Clamp01( 
		Vector3.Distance( pos, characterController.collider.ClosestPointOnBounds( pos ) ) / radius ));
	
	var dir : Vector3 = (transform.position - pos).normalized;
	dir.z = 0.0;
	
	var explForce : Vector3 = (force * dir * percentage);
	var modifier : float = (force * percentage / damping);
	if (characterController.isGrounded) explForce.y = Mathf.Max( explForce.y, (modifier / 2) );
	decrementHealth( modifier );
	
	// apply explosion force via co-routine
	var initial : boolean = true;
	while( explForce != Vector3.zero ) {
		if (!initial) explosionForce -= explForce;
		initial = false;
		
		explForce = Vector3.Slerp( explForce, Vector3.zero, (modifiedDeltaTime * damping) );
		explosionForce += explForce;
		yield;
	}
}

// utility function to add hit force to this avatar
function addHitForce( pos : Vector3, force : float, damping : float, hp : float ) {	
	var dir : Vector3 = (transform.position - pos).normalized;
	dir.z = 0.0;
	
	var hForce : Vector3 = (force * dir);
	decrementHealth( hp );
	
	audioPlay( Random.Range( 0, 2 ) ? CharacterSound.HitA : CharacterSound.HitB );
	
	// apply explosion force via co-routine
	var initial : boolean = true;
	while( hForce != Vector3.zero ) {
		if (!initial) hitForce -= hForce;
		initial = false;
		
		hForce = Vector3.Slerp( hForce, Vector3.zero, (modifiedDeltaTime * damping) );
		hitForce += hForce;
		yield;
	}
}
function addHitForce( pos : Vector3, force : float, damping : float ) {
	addHitForce( pos, force, damping, (force / damping) );
}

// push props away
function OnControllerColliderHit( hit : ControllerColliderHit ) {
	if( hit.gameObject.CompareTag( 'PowerModify' ) && (isAlive()) ) {
		var modifier : Modifier = hit.transform.GetComponentInChildren( Modifier );
		if (modifier) modifier.pickup( this );
		Destroy( hit.transform.gameObject );
		return;
	}
	
	if (hit.moveDirection.y < -0.3) return; // dont push objects down
	if( hit.gameObject.CompareTag( 'Prop' ) ) {
		var body : Rigidbody = hit.collider.attachedRigidbody;
		
		if ((body == null) || body.isKinematic) return;
		
		body.velocity = (Mathf.Max( 2.5, ((hitForce.magnitude + explosionForce.magnitude) / 2.0) ) * 
			(hit.moveDirection + (hit.moveDirection / body.mass)));
	}
}

// utility function for setting the time warp factor
function setTimeWarpFactor( factor : float ) {
	timeWarpFactor = Mathf.Clamp01( factor );
}

// retun whether or not this avatar is playing a cutscene
function isPlayingCutScene() : boolean {
	return cutScenePlaying;
}

// utility function to play a passed cutscene
function playCutScene( scene : CutScene ) {
	activeCutScene = scene;
	cutScenePlaying = true;
}

// use SendMessage to call this
function SetController( ce : ControllerEnum ) {
	boundController = ce;
}

// returns bound controller
function getController() : ControllerEnum {
	return boundController;
}

// returns team of bound controller
function getTeam() : ControllerTeam {
	return GameManager.instance.controllers[boundController].team;
}

// returns true if passed avatar game object is on same team
function onSameTeam( avatar : GameObject ) : boolean {
	if (!Global.isAvatar( avatar )) return false;
	
	return Global.avatarsOnSameTeam( avatar, gameObject );
}

// returns literal name of character
function getName() : String {
	return GameManager.instance.controllers[boundController].character.ToString();
}

// use SendMessage to call this
function OutOfBounds() {
	transform.position = Vector3( 0.0, 4.0, Global.sharedZ );
	Debug.Log( 'Avatar has been returned from out of bounds.' );
}

// utility function to make playing character audio easier
function audioPlay( sid : int ) {
	var uid : int = (GetInstanceID() + sid);
	GameManager.instance.audioBind( uid, sound[sid] );
	GameManager.instance.audioPlay( uid, true );
}

// utility function to check if a character sound is playing
function audioIsPlaying( sid : int ) : boolean {
	return GameManager.instance.audioIsPlaying( GetInstanceID() + sid );
}

// this is called when using the Reset command in the inspector
function Reset() {
	gameObject.tag = 'Player';
	gameObject.layer = 8; // Avatar layer
	transform.position = Vector3.zero;
	transform.rotation = Quaternion.identity;
	transform.localScale = Vector3( 1.0, 1.0, 1.0 );
}