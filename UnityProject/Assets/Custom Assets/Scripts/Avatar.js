
@script RequireComponent( CharacterController )

public var expectedTextureAtlases : CharacterState;
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
protected var facing : int = 1;
protected var canJump : boolean = true;
protected var canMove : boolean = true;
public var isControllable : boolean = true;
protected var state : CharacterState;
protected var stateForced : boolean = false;
protected var isNearlyGrounded : boolean = true;

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
	moveDirection = transform.TransformDirection( Vector3.forward );
}

function Update() {
	if( isControllable ) {
		if (Global.getAxis( 'Vertical', boundController ) >= 0.2) lastJumpButtonTime = Time.time; // jump
		
		setHorizontalMovement();
		setVerticalMovement();
		doMovement();
		
		checkIfNearlyGrounded();
		updateShadow();
		
		//faceNearestEnemy();
		stateDelegation();
		enforceBounds();
	}
}

// sets movingBack, isMoving, moveDirection, moveSpeed and inAirVelocity
function setHorizontalMovement() {
	// forward vector relative to the camera along the x-z plane	
	var forward = Camera.main.transform.TransformDirection( Vector3.forward );
	forward.y = 0;
	forward = forward.normalized;

	// right vector relative to the camera, always orthogonal to the forward vector
	var right = Vector3( forward.z, 0, -forward.x );

	var h = Global.getAxis( 'Horizontal', boundController );
	
	var wasMoving = isMoving;
	
	if( canMove ) {
		isMoving = (Mathf.Abs( h ) > 0.1); // check for any lateral joystick movement
		
		var targetDirection = (h * right); // x-axis user input
		
		// grounded controls
		if( characterController.isGrounded ) {
			// moveDirection is always normalized, and we only update it if there is user input
			if (targetDirection != Vector3.zero) moveDirection = targetDirection.normalized;
					
			// choose target speed
			var targetSpeed = Mathf.Min( targetDirection.magnitude, 1.0 ) * walkSpeed;
			
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

// set isNearlyGrounded variable
function checkIfNearlyGrounded() {
	var hit : RaycastHit;
	var p1 : Vector3;
	var p2 : Vector3;
	p1 = p2 = characterController.bounds.center;
	p1.y = characterController.bounds.max.y;
	p2.y = characterController.bounds.min.y;
	var dist : float = 1.0;
	var dir : Vector3 = Vector3.down;
	var radius : float = Mathf.Abs( transform.localScale.x * characterController.radius );
	
	Debug.DrawLine( p1+dist*dir, p2+dist*dir );
	Debug.DrawLine( p2+dist*dir, p2+dist*dir + Vector3( radius, 0.0, 0.0 ) );
	
	isNearlyGrounded = Physics.CapsuleCast( p1, p2, radius, Vector3.down, hit, dist, (~(1 << 8) | ~(1 << 11) | ~(1 << 31)) );
	if (jumping || (isNearlyGrounded && hit.transform.tag == 'Player')) isNearlyGrounded = false;
}

function updateShadow() {
	var newPos : Vector3 = (transform.position + shadowOffset + shadowOffsetExtra);
	newPos.x += characterController.center.x;
	shadow.transform.position = Vector3.Lerp( shadow.transform.position, newPos, (Time.deltaTime * 20) );
	shadowProjector.aspectRatio = (origShadowAspectRatio + shadowAspectRatioExtra);
}

// determine the state of this avatar and apply it to the texture atlas renderer
function stateDelegation() {	
	var blocking : boolean = (!isMoving && (Global.getAxis( 'Vertical', boundController ) <= -0.2)) ? true : false; // block
	
	// set dynamic variables to default state
	var stateBefore : CharacterState = state;
	var staticFrame : int = -1;
	var reverse : boolean = false;
	canJump = true;
	canMove = true;
	shadowOffsetExtra = Vector3.zero;
	shadowAspectRatioExtra = 0.0;
	
	// joystick-activated states
	switch( true ) {
		case jumping:
			state = CharacterState.Jump; // forward/backwards
			break;
		case blocking:
			state = CharacterState.Block;
			break;
		case !isNearlyGrounded:
			state = CharacterState.Jump; // forward/backwards
			staticFrame = 8;
			break;
		case isMoving:
			state = CharacterState.Walk;
			if (movingBack) reverse = true;
			break;
		default:
			state = CharacterState.Idle;
			break;
	}
	
	// button-activated states (overrides joystick)
	StateUpdate();
	
	// environment-activated states (overrides all)
	switch( true ) {
		case (knockbackForce.magnitude > 0.1):			
			state = CharacterState.Fall;
			
			canJump = canMove = false;
			
			shadowAspectRatioExtra = Mathf.Max( (3.0 - knockbackForce.magnitude), origShadowAspectRatio );
			
			shadowOffsetExtra = Vector3( 0.8, 0.0, 0.0 );
			
			if (getName() == 'BlackMagic') break;
			
			var newCenter : Vector3 = (origCenter + Vector3( 0.0, 0.2, 0.0 ));
			if (characterController.center != newCenter) characterController.center = newCenter;
			
			if (taRenderer.loopCount == 1) staticFrame = 14;
			break;
		case (stateBefore == CharacterState.Fall):
			if (getName() == 'BlackMagic') break;
			
			transform.position += Vector3( 0.0, 1.0, 0.0 ); // compensate for 0.0, 0.2, 0.0
			
			characterController.center = origCenter;
			break;
	}
	
	StateFinal();
	
	// apply all changes to the texture atlas renderer
	taRenderer.setTextureAtlasIndex( parseInt( state ) );
	taRenderer.reverse = reverse;
	if( staticFrame > -1) {
		taRenderer.isStatic = true;
		taRenderer.staticFrame = staticFrame;
	} else {
		taRenderer.isStatic = false;
	}
}

function StateUpdate() { /* override this function */ }
function StateFinal() { /* override this function */ }

// utility function to cause this avatar to face the nearest avatar
function faceNearestEnemy() {
	var dist : float = 0.0;
	var closestDist : float = 999.0;
	for( var avatar : GameObject in GameManager.instance.avatars ) {
		if (collider == avatar.collider) continue; // continue if self
		
		// update closest dist
		dist = transform.localPosition.x - avatar.transform.localPosition.x;
		if (Mathf.Abs( dist ) < Mathf.Abs( closestDist )) closestDist = dist;
	}
	
	// face left or right (to face closest enemy)
	if( closestDist > 0.0 ) {
		if (transform.localScale.x > 0.0) transform.localScale.x *= -1; // face left
		facing = -1;
	} else {
		if (transform.localScale.x < 0.0) transform.localScale.x *= -1; // face right
		facing = 1;
	}
	
	movingBack = (((moveDirection.x - facing) == 0) ? true : false);
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

function Attack1() {
	Debug.LogWarning( 'You must override the default template function "Attack1()"' );
}

function Special1() {
	Debug.LogWarning( 'You must override the default template function "Special1()"' );
}

function Special2() {
	Debug.LogWarning( 'You must override the default template function "Special2()"' );
}

function Ultimate() {
	Debug.LogWarning( 'You must override the default template function "Ultimate()"' );
}

// this is called when using the Reset command in the inspector
function Reset() {
	gameObject.tag = 'Player';
	gameObject.layer = 8;
	transform.position = Vector3.zero;
	transform.rotation = Quaternion.identity;
	transform.localScale = Vector3( 1.0, 1.0, -1.0 );
}