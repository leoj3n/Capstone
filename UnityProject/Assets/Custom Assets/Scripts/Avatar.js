
@script RequireComponent( CharacterController )

public var atlas : CharacterAtlas;
public var walkSpeed : float = 6.0;
public var jumpHeight : float = 2.0;
public var sound : AudioClip[];
public var expectedSounds : CharacterSound; // just for exposing expected order of sounds in inspector
public var statsTexture : Texture2D;
public var statsAtlas : TextAsset;
public var baseOffset : Vector3 = Vector3.zero;
public var isControllable : boolean = true;

// STATIC
protected var boundController : ControllerEnum;
private var shadow : Transform;
private var shadowProjector : Projector;
protected var shadowUseTAC : boolean = false;
protected var gravity : float = 50.0;
protected var groundedAcceleration : float = 6.0;
protected var inAirAcceleration : float = 3.0;
protected var characterController : CharacterController;
protected var taRenderer : TextureAtlasRenderer;
protected var textureAtlasCube : Transform;

// STATE
protected var facing : int = 1; // 1 = right, -1 = left
protected var canJump : boolean = true;
protected var canMove : boolean = true;
protected var state : CharacterState;
protected var previousState : CharacterState;
protected var isNearlyGrounded : boolean = true;
protected var staticFrame : int = -1;
protected var reverse : boolean = false;
private var attackStarted : boolean = false;
private var attackWaiting : boolean = false;
private var lastAttackTime : float = 0.0;
private var attackCount : int = 0;

// OTHER
protected var origShadowAspectRatio : float;
protected var hitForce : Vector3;
protected var explosionForce : Vector3;
protected var loop : boolean = true;
protected var offset : Vector3 = Vector3.zero;

// HEALTH
protected var health : float = 100.0;

// JUMPING
protected var jumping : boolean = false;
private var jumpTimeout : float = 0.15;
private var jumpRepeatTime : float = 0.05;
private var groundedTimeout : float = 0.25;
private var lastJumpButtonTime : float = -10.0;
private var lastJumpTime : float = -1.0;
private var lastGroundedTime : float = 0.0;
protected var lastJumpStartHeight : float = 0.0;
protected var verticalSpeed : float = 0.0;
protected var inAirVelocity : Vector3 = Vector3.zero;

// MOVEMENT
protected var moveDirection : Vector3 = Vector3.zero;
protected var moveSpeed : float = 0.0;
protected var movingBack : boolean = false;
protected var isMoving : boolean = false;

function Start() {
	characterController = GetComponent( CharacterController );
	taRenderer = GetComponentInChildren( TextureAtlasRenderer );
	textureAtlasCube = transform.Find( 'TextureAtlasCube' );
	
	shadow = transform.Find( 'Shadow' );
	shadowProjector = shadow.GetComponent( Projector );
	origShadowAspectRatio = shadowProjector.aspectRatio;
}

function Update() {
	if( isControllable ) {
		if (Global.getAxis( 'Vertical', boundController ) >= 0.2) lastJumpButtonTime = Time.time; // jump
		
		// force correct sign of z-scale
		if (Mathf.Sign( textureAtlasCube.transform.localScale.z ) == 1.0)
			textureAtlasCube.transform.localScale.z *= -1.0;
		
		setHorizontalMovement();
		setVerticalMovement();
		doMovement();
		enforceBounds();
		
		if (GameManager.instance.avatars.Length == 2)
			faceNearestEnemy();
		else
			faceMoveDirection();
		
		checkIfMovingBack();
		checkIfNearlyGrounded();
		
		updateShadow();
		
		determineState();
		determineAtlas();
	}
	
	shadowProjector.enabled = isControllable;
}

// utility function to cause this avatar to face the nearest avatar
// IMPORTANT: the game expects all avatars to be facing right at the start
function faceNearestEnemy() {
	var dist : float = 0.0;
	var closestDist : float = 9999.0;
	var side : int = 1; // 1 = right, -1 = left
	var p1 : Vector3 = getCenterInWorld();
	for( var avatar : GameObject in GameManager.instance.avatars ) {
		if (gameObject == avatar) continue; // continue if self
		
		var p2 : Vector3 = avatar.GetComponent( Avatar ).getCenterInWorld();
		
		dist = Vector3.Distance( p1, p2 );
		if( dist < closestDist ) {
			closestDist = dist;
			side = ((p1.x < p2.x) ? 1 : -1); // if p2 is greater, it is on right
		}
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
			moveSpeed = Mathf.Lerp( moveSpeed, targetSpeed, (groundedAcceleration * Time.deltaTime) );
		} else if (isMoving) { // in air controls
			inAirVelocity += (targetDirection.normalized * Time.deltaTime * inAirAcceleration);
		}
	} else {
		isMoving = false;
		moveSpeed = 0.0;
		moveDirection = Vector3.zero;
	}
}

// sets verticalSpeed, jumping, lastJumpTime, lastJumpButtonTime and lastJumpStartHeight
function setVerticalMovement() {
	// apply gravity (-0.05 fixes jittering isGrounded problem)
	verticalSpeed = (characterController.isGrounded ? -0.05 : (verticalSpeed - (gravity * Time.deltaTime)));
	
	// prevent jumping too fast after each other
	if (lastJumpTime + jumpRepeatTime > Time.time) return;

	if( characterController.isGrounded ) {
		// jump only when pressing the button down with a timeout so you can press the button slightly before landing		
		if( canJump && (Time.time < (lastJumpButtonTime + jumpTimeout)) ) {
			AudioPlay( CharacterSound.Jump );
			verticalSpeed = Mathf.Sqrt( 2 * jumpHeight * gravity );
			jumping = true;
			lastJumpTime = Time.time;
			lastJumpButtonTime = -10;
			lastJumpStartHeight = transform.position.y;
		}
	}
}

// move the character controller
function doMovement() {	
	characterController.Move( Time.deltaTime * 
		((moveDirection * moveSpeed) + Vector3( 0, verticalSpeed, 0 ) + inAirVelocity + hitForce + explosionForce) );
	
	if( characterController.isGrounded ) {
		lastGroundedTime = Time.time;
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
	var p1 : Vector3;
	var p2 : Vector3;
	var dist : float = 1.0; // change this as needed
	var dir : Vector3 = Vector3.down;
	var radius : float = getScaledRadius();
	var halfHeight : float = (getScaledHeight() * 0.5);
	p1 = p2 = (getCenterInWorld() + Vector3( 0.0, dist, 0.0 ));
	p1.y += halfHeight;
	p2.y -= halfHeight;
	
	var radiusVector : Vector3 = Vector3( radius, 0.0, 0.0 );
		
	Debug.DrawLine( p1, p1 + radiusVector );
	Debug.DrawLine( p1, p1 - radiusVector );
	Debug.DrawLine( p1, p2 );
	Debug.DrawLine( p2, p2 + radiusVector );
	Debug.DrawLine( p2, p2 - radiusVector );
	
	var distReal : float = (dist * 2.0);
	var p2Real : Vector3 = (p2 + (distReal * dir));
	
	Debug.DrawLine( p2, p2Real, Color.red );
	Debug.DrawLine( p2Real, p2Real + radiusVector, Color.red );
	Debug.DrawLine( p2Real, p2Real - radiusVector, Color.red );
	
	var hits : RaycastHit[] = Physics.CapsuleCastAll( p1, p2, radius, dir, distReal, GameManager.instance.nearlyGroundedLayerMask );
	
	isNearlyGrounded = false;
	for( var hit : RaycastHit in hits ) {
		if (hit.transform != transform) isNearlyGrounded = true;
	}
}

// move the shadow with the character controller
function updateShadow() {
	var newPos : Vector3 = getCenterInWorld();
	if (shadowUseTAC) newPos.x = textureAtlasCube.position.x;
	
	shadow.position = Vector3.Lerp( shadow.position, newPos, (Time.deltaTime * 20) );
	
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
	canJump = true;
	canMove = true;
	shadowUseTAC = false;
	
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
		case (hitForce.magnitude > 0.1):			
			//state = CharacterState.Hit;
			break;
		case (explosionForce.magnitude > 0.1):			
			state = CharacterState.Fall;
			break;
	}
	
	// set dynamic variable to default state if state changed
	if (state != previousState) attackStarted = false;
}

// set atlas (and do anything else necessary) based on state
function determineAtlas() {
	switch( state ) {
		case CharacterState.Jump:
			if (movingBack)
				atlas = CharacterAtlas.Jump; // JumpBackward
			else
				atlas = CharacterAtlas.Jump; // JumpForward
			break;
		case CharacterState.Drop:
			if (previousState == CharacterState.Drop) staticFrame = (taRenderer.getFrameCount() / 2);
			
			if (movingBack)
				atlas = CharacterAtlas.Jump; // JumpBackward
			else
				atlas = CharacterAtlas.Jump; // JumpForward
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
			canJump = canMove = false; // Input.ResetInputAxes(); ???
			break;
		/*case CharacterState.Hit:
			atlas = CharacterAtlas.Hit;
			break;*/
		case CharacterState.Block:
			atlas = CharacterAtlas.Block;
			break;
		case CharacterState.Attack1:
			atlas = CharacterAtlas.Attack1;
			offset = Vector3( -0.5, 0.0, 0.0 );
			canMove = false;
			
			var hit : RaycastHit = tryAttack();
			if( hit.transform ) {
				hitOtherAvatar( hit, 50, 10 );
			}
			break;
		case CharacterState.Attack2:
			atlas = CharacterAtlas.Attack2;
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
	
	StateFinal();
	
	// apply all changes to the texture atlas renderer
	var finalOffset : Vector3 = Vector3( baseOffset.x, (baseOffset.y - (characterController.height / 2.0)), baseOffset.z );
	taRenderer.setTextureAtlas( parseInt( atlas ), (offset + finalOffset), loop );
	taRenderer.reverse = reverse;
	if( staticFrame > -1) {
		taRenderer.isStatic = true;
		taRenderer.staticFrame = staticFrame;
	} else {
		taRenderer.isStatic = false;
	}
}

// override this function in any character script to do any custom work such as
// switch over state in order to implement Special1, Special2 or Ultimate
function StateFinal() { /* override this function */ }

// utility function to try an attack (utilizes timeToAttack())
function tryAttack() : RaycastHit {
	var sizeOfGeometry : Vector3 = Global.getSize( textureAtlasCube.gameObject );
	var dist : float = (Mathf.Abs( getScaledCenter().x ) + sizeOfGeometry.x + baseOffset.x + offset.x);
	var dir : Vector3 = Vector3( (facing * 1.0), 0.0, 0.0 );
	
	if( timeToAttack() ) {
		var hits : RaycastHit[] = Physics.RaycastAll( getCenterInWorld(), dir, dist, GameManager.instance.avatarOnlyLayerMask );
		if( hits ) {
			var didHit : boolean = false;
			for( var hit : RaycastHit in hits ) {
				if (hit.transform == transform) continue;
				
				Debug.DrawRay( getCenterInWorld(), (dir * dist), Color.red, 1.0 );
				return hit;
			}
			
			Debug.DrawRay( getCenterInWorld(), (dir * dist), Color.blue, 1.0 );
		}
	}
	
	Debug.DrawRay( getCenterInWorld(), (dir * dist) );
}

// utility function to determine if it is time to attack
function timeToAttack() : boolean {
	if( attackStarted ) {
		if( attackWaiting && ((Time.time - lastAttackTime) > 3.0) && (taRenderer.getFrameIndex() > (taRenderer.getFrameCount() / 2)) ) {
			attackWaiting = false;
			lastAttackTime = Time.time;
			return true;
		} else if( taRenderer.getLoopCount() > attackCount ) {
			attackWaiting = true;
			attackCount++;
		}
	} else {
		attackStarted = true;
		attackWaiting = true;
		attackCount = 0;
	}
	
	return false;
}

// utility function to apply hit force to another avatar using a passed RaycastHit
function hitOtherAvatar( hit : RaycastHit, force : float, damping : float ) {
	if (Global.isAvatar( hit.transform ))
		hit.transform.gameObject.GetComponent( Avatar ).addHitForce( getCenterInWorld(), force, damping );
}

// utility function to get the avatar center in world coordinates
function getCenterInWorld() : Vector3 {
	return (transform.position + getScaledCenter());
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

// utility function to enforce the bounds set in Global
function enforceBounds() {
	transform.position.z = Global.sharedZ;
	if (transform.position.x > Global.sharedMaxX) transform.position.x = Global.sharedMaxX;
	if (transform.position.x < Global.sharedMinX) transform.position.x = Global.sharedMinX;
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
	health -= modifier;
	
	// apply explosion force via co-routine
	var initial : boolean = true;
	while( explForce != Vector3.zero ) {
		if (!initial) explosionForce -= explForce;
		initial = false;
		
		explForce = Vector3.Slerp( explForce, Vector3.zero, (Time.deltaTime * damping) );
		explosionForce += explForce;
		yield;
	}
}

// utility function to add hit force to this avatar
function addHitForce( pos : Vector3, force : float, damping : float, hp : float ) {	
	var dir : Vector3 = (transform.position - pos).normalized;
	dir.z = 0.0;
	
	var hForce : Vector3 = (force * dir);
	health -= hp;
	
	// apply explosion force via co-routine
	var initial : boolean = true;
	while( hForce != Vector3.zero ) {
		if (!initial) hitForce -= hForce;
		initial = false;
		
		hForce = Vector3.Slerp( hForce, Vector3.zero, (Time.deltaTime * damping) );
		hitForce += hForce;
		yield;
	}
}
function addHitForce( pos : Vector3, force : float, damping : float ) {
	addHitForce( pos, force, damping, (force / damping) );
}

// push props away
function OnControllerColliderHit( hit : ControllerColliderHit ) {
	if (!hit.gameObject.CompareTag( 'Prop' )) return; // only do so for props
	var body : Rigidbody = hit.collider.attachedRigidbody;
	if ((body == null) || body.isKinematic) return;
	if (hit.moveDirection.y < -0.3) return; // dont push objects down
	
	var pushDir : Vector3 = Vector3( hit.moveDirection.x, 0, hit.moveDirection.z );
	
	body.velocity = (2 * (pushDir + (pushDir / body.mass)));
}

// use SendMessage to call this
function SetController( ce : ControllerEnum ) {
	boundController = ce;
}

function getController() : ControllerEnum {
	return boundController;
}

function getName() : String {
	return typeof( this ).ToString();
}

// use SendMessage to call this
function OutOfBounds() {
	transform.position = Vector3( 0.0, 4.0, Global.sharedZ );
	Debug.Log( 'Avatar has been returned from out of bounds.' );
}

function AudioPlay( cs : int ) {
	var uid : int = (GetInstanceID() + cs);
	GameManager.instance.audioBind( uid, sound[cs] );
	GameManager.instance.audioPlay( uid, true );
}

// this is called when using the Reset command in the inspector
function Reset() {
	gameObject.tag = 'Player';
	gameObject.layer = 8; // Avatar layer
	transform.position = Vector3.zero;
	transform.rotation = Quaternion.identity;
	transform.localScale = Vector3( 1.0, 1.0, 1.0 );
}