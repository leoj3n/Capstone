
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
public var isControllable : boolean = true;
protected var state : CharacterState;
protected var stateForced : boolean = false;

// OTHER
protected var shadowOffsetExtra : Vector3;
protected var isGrounded : boolean;

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
	shadow = GameObject.Instantiate( shadowPrefab );	
	moveDirection = transform.TransformDirection( Vector3.forward );
	characterController = GetComponent( CharacterController );
	taRenderer = GetComponent( TextureAtlasRenderer );
}

function Update() {
	if( isControllable ) {
		if (Global.getAxis( 'Vertical', boundController ) >= 0.2) lastJumpButtonTime = Time.time; // jump
	
		setHorizontalMovement();
		setVerticalMovement();
		doMovement();
		
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
	isMoving = (Mathf.Abs( h ) > 0.1); // check for any lateral joystick movement
	
	var targetDirection = (h * right); // x-axis user input
	
	// grounded controls
	if( isGrounded ) {
		// moveDirection is always normalized, and we only update it if there is user input
		if (targetDirection != Vector3.zero) moveDirection = targetDirection.normalized;
				
		// choose target speed
		var targetSpeed = Mathf.Min( targetDirection.magnitude, 1.0 ) * walkSpeed;
		
		// interpolate moveSpeed -> targetSpeed
		moveSpeed = Mathf.Lerp( moveSpeed, targetSpeed, (groundedAcceleration * Time.deltaTime) );
	} else if (isMoving) { // in air controls
		inAirVelocity += (targetDirection.normalized * Time.deltaTime * inAirAcceleration);
	}
}

// sets verticalSpeed, jumping, lastJumpTime, lastJumpButtonTime and lastJumpStartHeight
function setVerticalMovement() {
	// apply gravity
	verticalSpeed = (isGrounded ? -0.1 : (verticalSpeed - (gravity * Time.deltaTime)));
	
	// prevent jumping too fast after each other
	if (lastJumpTime + jumpRepeatTime > Time.time) return;

	if( isGrounded ) {
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
	characterController.Move( 
		((moveDirection * moveSpeed + Vector3( 0, verticalSpeed, 0 ) + inAirVelocity) * Time.deltaTime) );
	
	isGrounded = characterController.isGrounded;
	
	if( isGrounded ) {
		lastGroundedTime = Time.time;
		inAirVelocity = Vector3.zero;
		jumping = false;
	}
}

function updateShadow() {
	var newPos : Vector3 = (transform.position + shadowOffset + shadowOffsetExtra);
	newPos.x += characterController.center.x;
	shadow.transform.position = Vector3.Lerp( shadow.transform.position, newPos, (Time.deltaTime * 20) );
}

// determine the state of this avatar and apply it to the texture atlas renderer
function stateDelegation() {	
	var blocking : boolean = (!isMoving && (Global.getAxis( 'Vertical', boundController ) <= -0.2)) ? true : false; // block
	var knockback : boolean = false;
	
	// set dynamic variables to default state
	var staticFrame : int = -1;
	shadowOffsetExtra = Vector3.zero;
	
	// joystick-activated states
	switch( true ) {
		case jumping:
			state = CharacterState.Jump; // forward/backwards
			break;
		case blocking:
			state = CharacterState.Block;
			break;
		case isMoving:
			state = CharacterState.Walk;
			break;
		default:
			state = CharacterState.Idle;
			break;
	}
	
	// button-activated states (overrides joystick)
	StateUpdate();
	
	// environment-activated states (overrides all)
	switch( true ) {
		case knockback:
			state = CharacterState.Jump;
			break;
	}
	
	StateFinal();
	
	if (getName() == 'ZipperFace') Debug.Log( isGrounded );
	
	// apply all changes to the texture atlas renderer
	taRenderer.setTextureAtlasIndex( parseInt( state ) );
	taRenderer.reverse = (movingBack && (state == CharacterState.Walk));
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
function addExplosionForce( pos : Vector3, force : float, damping : float ) {	
	var dist : float = Mathf.Max( Vector3.Distance( pos, transform.position ), 1.0 );
	
	var dir : Vector3 = (transform.position - pos).normalized;
	
	var explosionForce : Vector3 = ((dir * force) / (dist));
	if (explosionForce.y < 0.0) explosionForce.y = 0.0;
	explosionForce.y *= 1.5;//+= 0.2; // add upward bias
	
	var damage : float = ((force * damping) / dist);
	health -= (damage * damage);
	
	// apply explosion force via co-routine
	while( explosionForce != Vector3.zero ) {
		explosionForce = Vector3.Slerp( explosionForce, Vector3.zero, (Time.deltaTime * damping) );
		characterController.Move( explosionForce );
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