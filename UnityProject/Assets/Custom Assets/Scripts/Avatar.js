
@script RequireComponent( CharacterController )

public var atlas : CharacterAtlas;
public var walkSpeed : float = 6.0;
public var jumpHeight : float = 2.0;
public var sound : AudioClip[];
public var expectedSounds : CharacterSound; // just for exposing expected order of sounds in inspector
public var statsTexture : Texture2D;
public var statsAtlas : TextAsset;
public var shadowPrefab : GameObject;
public var shadowOffset : Vector3;

// STATIC
protected var boundController : ControllerEnum;
private var shadow : GameObject;
protected var gravity : float = 50.0;
protected var groundedAcceleration : float = 6.0;
protected var inAirAcceleration : float = 3.0;
protected var characterController : CharacterController;
protected var taRenderer : TextureAtlasRenderer;

// STATE
protected var facing : int = 1; // 1 = right, -1 = left
protected var canJump : boolean = true;
protected var canMove : boolean = true;
public var isControllable : boolean = true;
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
protected var origCenter : Vector3;
protected var shadowProjector : Projector;
protected var shadowOffsetExtra : Vector3;
protected var origShadowAspectRatio : float;
protected var shadowAspectRatioExtra : float;
protected var knockbackForce : Vector3;

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
	origCenter = characterController.center;
	taRenderer = GetComponent( TextureAtlasRenderer );
	shadow = GameObject.Instantiate( shadowPrefab );
	shadowProjector = shadow.GetComponent( Projector );
	origShadowAspectRatio = shadowProjector.aspectRatio;
}

function Update() {
	if( isControllable ) {
		if (Global.getAxis( 'Vertical', boundController ) >= 0.2) lastJumpButtonTime = Time.time; // jump
		
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
		actUponState();
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
		if( facing == -1 ) { // if facing left
			facing = 1; // face right
			transform.localScale.x *= -1.0;
		}
	} else { // closest is on left
		if( facing == 1 ) { // if facing right
			facing = -1; // face left
			transform.localScale.x *= -1.0;
		}
	}
}

// utility function to cause this avatar to face the direction it is moving
function faceMoveDirection() {
	if( moveDirection.x > 0.0 ) { // moving right
		if( facing == -1 ) { // if facing left
			facing = 1; // face right
			transform.localScale.x *= -1.0;
		}
	} else if( moveDirection.x < 0.0 ) { // moving left
		if( facing == 1 ) { // if facing right
			facing = -1; // face left
			transform.localScale.x *= -1.0;
		}
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
		((moveDirection * moveSpeed) + Vector3( 0, verticalSpeed, 0 ) + inAirVelocity + knockbackForce) );
	
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
	var radius : float = Mathf.Abs( transform.localScale.x * characterController.radius );
	var halfHeight : float = Mathf.Abs( transform.localScale.y * characterController.height * 0.5 );
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
	var newPos : Vector3 = (getCenterInWorld() + shadowOffset + Global.multiplyVectorBySigns( shadowOffsetExtra, transform.localScale ));
	shadow.transform.position = Vector3.Lerp( shadow.transform.position, newPos, (Time.deltaTime * 20) );
	shadowProjector.aspectRatio = (origShadowAspectRatio + shadowAspectRatioExtra);
}

// determine the state of this avatar and apply it to the texture atlas renderer
function determineState() {	
	var blocking : boolean = (!isMoving && (Global.getAxis( 'Vertical', boundController ) <= -0.2)) ? true : false; // block
	
	// set dynamic variables to default state
	previousState = state;
	staticFrame = -1;
	reverse = false;
	canJump = true;
	canMove = true;
	shadowOffsetExtra = Vector3.zero;
	shadowAspectRatioExtra = 0.0;
	
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
	
	// environment-activated states (overrides all)
	switch( true ) {
		case (knockbackForce.magnitude > 0.1):			
			state = CharacterState.Fall;
			break;
		case (previousState == CharacterState.Fall):
			if (getName() == 'BlackMagic') break;
			transform.position += Vector3( 0.0, 1.0, 0.0 ); // compensate for 0.0, 0.2, 0.0
			characterController.center = origCenter;
			break;
	}
	
	// set dynamic variable to default state if state changed
	if (state != previousState) attackStarted = false;
}

// set atlas and do anything else based on state
function actUponState() {
	switch( state ) {
		case CharacterState.Jump:
			atlas = CharacterAtlas.Jump; // forward/backwards
			break;
		case CharacterState.Block:
			atlas = CharacterAtlas.Block;
			break;
		case CharacterState.Drop:
			atlas = CharacterAtlas.Jump; // forward/backwards
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
			canJump = canMove = false;
			shadowAspectRatioExtra = Mathf.Max( (3.0 - knockbackForce.magnitude), origShadowAspectRatio );
			shadowOffsetExtra = Vector3( 0.8, 0.0, 0.0 );
			if (getName() == 'BlackMagic') break;
			var newCenter : Vector3 = (origCenter + Vector3( 0.0, 0.2, 0.0 ));
			if (characterController.center != newCenter) characterController.center = newCenter;
			if ((previousState == CharacterState.Fall) && (taRenderer.getLoopCount() == 1)) staticFrame = 14;
			break;
		case CharacterState.Attack1:
			atlas = CharacterAtlas.Attack1;
			canMove = false;
			
			var hit : RaycastHit = tryAttack();
			
			if( hit.transform ) {
				Global.avatarExplosion( transform.gameObject, hit.transform.position, 3.0, 400, 4.0 );
			}
			break;
		case CharacterState.Attack2:
			atlas = CharacterAtlas.Attack2;
			canMove = false;
			break;
		case CharacterState.Special1:
			atlas = CharacterAtlas.Special1;
			canMove = false;
			break;
		case CharacterState.Special2:
			atlas = CharacterAtlas.Special2;
			canMove = false;
			break;
		case CharacterState.Ultimate:
			atlas = CharacterAtlas.Ultimate;
			canMove = false;
			break;
	}
	
	StateFinal();
	
	// apply all changes to the texture atlas renderer
	taRenderer.setTextureAtlasIndex( parseInt( atlas ) );
	taRenderer.reverse = reverse;
	if( staticFrame > -1) {
		taRenderer.isStatic = true;
		taRenderer.staticFrame = staticFrame;
	} else {
		taRenderer.isStatic = false;
	}
}

function StateFinal() { /* override this function */ }



// utility function to try an attack (utilizes timeToAttack())
function tryAttack() : RaycastHit {
	var sizeOfGeometry : Vector3 = Global.getSize( gameObject );
	var dirctn : Vector3 = Vector3( (facing * 1.0), 0.0, 0.0 );
	var distnce : float = (Mathf.Abs( transform.localScale.x * characterController.center.x ) + (sizeOfGeometry.x / 2));
	
	if( timeToAttack() ) {
		var hits : RaycastHit[] = Physics.RaycastAll( getCenterInWorld(), dirctn, distnce, GameManager.instance.avatarOnlyLayerMask );
		if( hits ) {
			var didHit : boolean = false;
			for( var hit : RaycastHit in hits ) {
				if (hit.transform == transform) continue;
				
				Debug.DrawRay( getCenterInWorld(), (dirctn * distnce), Color.red, 1.0 );
				return hit;
			}
			
			Debug.DrawRay( getCenterInWorld(), (dirctn * distnce), Color.blue, 1.0 );
		}
	}
	
	Debug.DrawRay( getCenterInWorld(), (dirctn * distnce) );
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

// utility function to get the avatar center in world coordinates
function getCenterInWorld() : Vector3 {
	return (transform.position + Vector3.Scale( characterController.center, transform.localScale ));
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
	
	var explosionForce : Vector3 = (force * dir * percentage);
	var modifier : float = (force * percentage / damping);
	if (characterController.isGrounded) explosionForce.y = Mathf.Max( explosionForce.y, (modifier / 2) );
	health -= modifier;
	
	// apply explosion force via co-routine
	var initial : boolean = true;
	while( explosionForce != Vector3.zero ) {
		if (!initial) knockbackForce -= explosionForce;
		initial = false;
		
		explosionForce = Vector3.Slerp( explosionForce, Vector3.zero, (Time.deltaTime * damping) );
		knockbackForce += explosionForce;
		yield;
	}
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
	transform.localScale = Vector3( 8.0, 4.8, -0.0001 );
}