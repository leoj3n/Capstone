
@script RequireComponent( CharacterController ) // require a "character controller"
@script RequireComponent( AudioSource ) // require an "audio source"

public var walkSpeed = 2.0;
public var trotSpeed = 4.0; // after trotAfterSeconds of walking we trot with trotSpeed
public var runSpeed = 6.0; // when pressing "Fire3" button (cmd) we start running
public var inAirControlAcceleration = 3.0;
public var jumpHeight = 0.5; // how high do we jump when pressing jump and letting go immediately
public var gravity = 20.0; // the gravity for the character
public var speedSmoothing = 10.0; // the gravity in controlled descent mode
public var trotAfterSeconds = 3.0;
public var canJump = true;
public var jumpSound : AudioClip;
public var orbPrefab : Rigidbody;

private enum states {
	intro,
	idle,
	jump,
	jumpBackward,
	jumpForward,
	walkBackward,
	walkForward,
	fire1,
	fire2,
	block
}
private var state = states.intro;

// STATIC
private var playerLetter;
private var initialZ;
private var collisionFlags : CollisionFlags; // the last collision flags returned from controller.Move
private var facing = 1;

// ATTACKING
private var attackNum = 0;
private var attacking = false;
private var attackTimeout = 0.15;
private var attackRepeatTime = 0.05;
private var lastAttackButtonTime = -10.0;
private var lastAttackTime = -1.0;

// BLOCKING
private var blocking = false;

// JUMPING
private var jumping = false;
private var jumpTimeout = 0.15;
private var jumpRepeatTime = 0.05;
private var groundedTimeout = 0.25;
private var lastJumpButtonTime = -10.0;
private var lastJumpTime = -1.0;
private var lastGroundedTime = 0.0;
private var lastJumpStartHeight = 0.0; // the height we jumped from
private var jumpingReachedApex = false;
private var verticalSpeed = 0.0; // the current vertical speed
private var inAirVelocity = Vector3.zero;

// MOVEMENT
private var moveDirection = Vector3.zero; // the current move direction in x-z
private var moveSpeed = 0.0; // the current x-z move speed
private var isControllable = true;
private var movingBack = false; // are we moving backwards?
private var isMoving = false; // is the user pressing any keys?
private var walkTimeStart = 0.0; // when did the user start walking (used for going into trot after a while)

function Awake() {
	moveDirection = transform.TransformDirection( Vector3.forward );
	
	playerLetter = this.name.Substring( (this.name.Length - 3), 3 ); // grab last 3 characters of name string
	
	initialZ = transform.position.z; // set initial z-axis value, for use  later in Update()
}

function UpdateSmoothedMovementDirection() {
	var cameraTransform = Camera.main.transform;
	var grounded = IsGrounded();
	
	// forward vector relative to the camera along the x-z plane	
	var forward = cameraTransform.TransformDirection( Vector3.forward );
	forward.y = 0;
	forward = forward.normalized;

	// right vector relative to the camera
	// always orthogonal to the forward vector
	var right = Vector3( forward.z, 0, -forward.x );

	var v = GetAxis( 'Vertical' );
	var h = GetAxis( 'Horizontal' );

	// are we moving backwards or looking backwards
	if (v < -0.2)
		movingBack = true;
	else
		movingBack = false;
	
	var wasMoving = isMoving;
	isMoving = Mathf.Abs( h ) > 0.1;// || Mathf.Abs( v ) > 0.1; // only need to track horizontal movement
	
	//var targetDirection = h * right + v * forward; // target direction relative to the camera
	var targetDirection = h * right; // only need to move left & right
	
	// grounded controls
	if( grounded ) {
		// we store speed and direction seperately,
		// so that when the character stands still we still have a valid forward direction
		// moveDirection is always normalized, and we only update it if there is user input
		if (targetDirection != Vector3.zero) moveDirection = targetDirection.normalized;
		
		// smooth the speed based on the current target direction
		var curSmooth = speedSmoothing * Time.deltaTime;
		
		// choose target speed
		// - we want to support analog input but make sure you cant walk faster diagonally than just forward or sideways
		var targetSpeed = Mathf.Min( targetDirection.magnitude, 1.0 );
		
		// pick speed modifier
		if( Input.GetKey( KeyCode.LeftShift ) | Input.GetKey( KeyCode.RightShift ) ) {
			targetSpeed *= runSpeed;
		} else if( Time.time - trotAfterSeconds > walkTimeStart ) {
			targetSpeed *= trotSpeed;
		} else {
			targetSpeed *= walkSpeed;
		}
		
		moveSpeed = Mathf.Lerp( moveSpeed, targetSpeed, curSmooth ); // interpolate moveSpeed -> targetSpeed
		
		if (moveSpeed < walkSpeed * 0.3) walkTimeStart = Time.time; // reset walk time start when we slow down
	} else { // in air controls
		if (isMoving)
			inAirVelocity += targetDirection.normalized * Time.deltaTime * inAirControlAcceleration;
	}
}

/////////////////// LOGIC ////////////////////////////////////////////////////////
/*function ApplyAttacking() {
	// prevent attacking too fast after each other
	if (lastAttackTime + attackRepeatTime > Time.time) return;

	if( IsGrounded() ) {
		// attack
		// - only when pressing the button down
		// - with a timeout so you can press the button slightly before...	
		if( canJump && Time.time < lastJumpButtonTime + attackTimeout ) {
			audio.PlayOneShot( jumpSound ); // @TODO: change to attackSound
			SendMessage( 'AttackBegin', SendMessageOptions.DontRequireReceiver );
		}
	}
}*/

function ApplyJumping() {
	// prevent jumping too fast after each other
	if (lastJumpTime + jumpRepeatTime > Time.time) return;

	if( IsGrounded() ) {
		// jump
		// - only when pressing the button down
		// - with a timeout so you can press the button slightly before landing		
		if( canJump && Time.time < lastJumpButtonTime + jumpTimeout ) {
			audio.PlayOneShot( jumpSound );
			verticalSpeed = CalculateJumpVerticalSpeed( jumpHeight );
			SendMessage( 'DidJump', SendMessageOptions.DontRequireReceiver );
		}
	}
}

function ApplyGravity() {
	if (isControllable) { // don't move player at all if not controllable
		var jumpButton = Input.GetButton( 'Jump ' + playerLetter ); // apply gravity
		
		// when we reach the apex of the jump we send out a message
		if( jumping && !jumpingReachedApex && verticalSpeed <= 0.0 ) {
			jumpingReachedApex = true;
			SendMessage( 'DidJumpReachApex', SendMessageOptions.DontRequireReceiver );
		}
	
		if (IsGrounded())
			verticalSpeed = 0.0;
		else
			verticalSpeed -= gravity * Time.deltaTime;
	}
}
/////////////////// END LOGIC ////////////////////////////////////////////////////


/////////////////// HELPERS ////////////////////////////////////////////////////////
function CalculateJumpVerticalSpeed( targetJumpHeight : float ) {
	// from the jump height and gravity we deduce the upwards speed 
	// for the character to reach at the apex
	return Mathf.Sqrt( 2 * targetJumpHeight * gravity );
}

/*function AttackBegin() {
	attacking = true;
	lastAttackTime = Time.time;
	lastAttackButtonTime = -10;
}*/

function DidJump() {
	jumping = true;
	jumpingReachedApex = false;
	lastJumpTime = Time.time;
	lastJumpStartHeight = transform.position.y;
	lastJumpButtonTime = -10;
}
/////////////////// END HELPERS ////////////////////////////////////////////////////

function Update() {
	if (!isControllable) Input.ResetInputAxes(); // kill all inputs if not controllable
	
	if (GetAxis( 'Vertical' ) >= 0.2) lastJumpButtonTime = Time.time; // jump
	if (IsButtonDown( 'Fire1' )) attackNum = 1;
	if (IsButtonDown( 'Fire2' )) attackNum = 2;
	if (attackNum != 0) lastAttackButtonTime = Time.time;
	blocking = (!isMoving && GetAxis( 'Vertical' ) <= -0.2) ? true : false; // block

	UpdateSmoothedMovementDirection();
	
	// apply gravity
	// - extra power jump modifies gravity
	// - controlledDescent mode modifies gravity
	ApplyGravity();

	// apply logic
	//ApplyAttacking();
	ApplyJumping();
	
	// calculate actual motion
	var movement = moveDirection * moveSpeed + Vector3( 0, verticalSpeed, 0 ) + inAirVelocity;
	movement *= Time.deltaTime;
	
	// move the controller
	var controller : CharacterController = GetComponent( CharacterController );
	collisionFlags = controller.Move( movement );
	
	var dist : float = 0.0;
	var closestDist : float = 999.0;
	var gofwt = GameObject.FindGameObjectsWithTag( 'Player' );
	for( var gO : GameObject in gofwt ) {
		if (this.collider == gO.collider) continue; // continue if self
		
		// ignore collision between player objects
		Physics.IgnoreCollision( this.collider, gO.collider, (jumping ? true : false) );
		
		// update closest dist
		dist = transform.localPosition.x - gO.transform.localPosition.x;
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
	
	// set movingBack variable
	movingBack = (moveDirection.x + facing == 0 ? true : false); // Warning: would be subtraction if x-axis were not flipped...
	
	/////////////////////////////////////////////////////////////////////
	// we are in jump mode but just became grounded
	if( IsGrounded() ) {
		lastGroundedTime = Time.time;
		inAirVelocity = Vector3.zero;
		if( jumping ) {
			jumping = false;
			SendMessage( 'DidLand', SendMessageOptions.DontRequireReceiver );
		}
		if( attacking ) {
			attacking = false;
			SendMessage( 'AttackEnd', SendMessageOptions.DontRequireReceiver );
		}		
	} else {
		attacking = false;
	}
	////////////////////////////////////////////////////////////////////
	
	// orb test
	if( Input.GetButtonDown( 'Fire2 ' + playerLetter ) ) {
		var orbClone : Rigidbody = Instantiate( orbPrefab, transform.position + Vector3( 0, 1, 0 ), transform.rotation );
		orbClone.rigidbody.AddForce( Vector3( facing, 0, 0 ) * 1000.0 );
		Physics.IgnoreCollision( orbClone.collider, collider );
	}
	
	switch( true ) {
		case blocking:
			state = states.block;
			break;
		default:
			state = states.idle;
			break;
	}
	
	// lock avatar movement along the z-axis (should always be at bottom of Update())
	transform.position.z = initialZ;
}

////////
function OnControllerColliderHit( hit : ControllerColliderHit ) {
	// Debug.DrawRay( hit.point, hit.normal );
	if (hit.moveDirection.y > 0.01) return;
}

function OutOfBounds() {
	Debug.Log( 'Player out of bounds!' );
}

function GetPlayerLetter() {
	return playerLetter;
}

function IsButtonDown( button ) {
	return Input.GetButtonDown( button + ' ' + playerLetter );
}

function GetAxis( axis ) {
	return Input.GetAxisRaw( axis + ' ' + playerLetter );
}

function GetSpeed() {
	return moveSpeed;
}

function IsJumping() {
	return jumping;
}

function IsBlocking() {
	return blocking;
}

function IsAttacking() {
	return attacking;
}

function GetAttack() {
	return attackNum;
}

function IsGrounded() {
	return ((collisionFlags & CollisionFlags.CollidedBelow) != 0);
}

function GetDirection() {
	return moveDirection;
}

function IsMovingBackwards() {
	return movingBack;
}

function IsMoving() {
	return isMoving;
}

function HasJumpReachedApex() {
	return jumpingReachedApex;
}

function IsGroundedWithTimeout() {
	return lastGroundedTime + groundedTimeout > Time.time;
}

function Reset() {
	gameObject.tag = 'Player';
}