@script RequireComponent( CharacterController ) // require a "character controller"
@script RequireComponent( AudioSource ) // require an "audio source"

public var health : int = 100;
public var death : boolean = false;
public var walkSpeed = 20.0;
public var trotSpeed = 40.0; // after trotAfterSeconds of walking we trot with trotSpeed
public var runSpeed = 60.0; // when pressing "Fire3" button (cmd) we start running
public var inAirControlAcceleration = 3.0;
public var jumpHeight = 1; // how high do we jump when pressing jump and letting go immediately
public var gravity = 40.0; // the gravity for the character
public var speedSmoothing = 40.0; // the gravity in controlled descent mode
public var rotateSpeed = 500.0;
public var hitForceX : float = 0.0; //the current "horizontal speed" 
public var trotAfterSeconds = 3.0;
public var canJump = true;
public var facing = 'left';
public var jumpSound : AudioClip;
public var orbPrefab : Rigidbody;
//Avatar 
	//attack
	public var attackType: String; //tells the attack script what attack is being executed
	public var attackBuffer : float; //how much time it takes to start this move (time before the attackBox appears)
	public var attackRecovery : float; //how much time it takes to finish this move (time after the attackBox disappears)
	//misc
	public var hitType :String;
	public var hit = false;
	

enum CharacterState {
	Idle = 0,
	Walking = 1,
	Trotting = 2,
	Running = 3,
	Jumping = 4,
}


private var initialZ;
private var _characterState : CharacterState;
private var jumpRepeatTime = 0.05;
private var jumpTimeout = 0.15;
private var groundedTimeout = 0.25;
private var moveDirection = Vector3.zero; // the current move direction in x-z
private var verticalSpeed = 0.0; // the current vertical speed
private var moveSpeed = 0.0; // the current x-z move speed
private var collisionFlags : CollisionFlags; // the last collision flags returned from controller.Move
private var jumping = false; // are we jumping? (initiated with jump button and not grounded yet)
private var jumpingReachedApex = false;
private var movingBack = false; // are we moving backwards?
private var isMoving = false; // is the user pressing any keys?
private var walkTimeStart = 0.0; // when did the user start walking (used for going into trot after a while)
private var lastJumpButtonTime = -10.0; // last time the jump button was clicked down
private var lastJumpTime = -1.0; // last time we performed a jump
private var lastJumpStartHeight = 0.0; // the height we jumped from (used to determine for how long to apply extra jump power after jumping.)
private var inAirVelocity = Vector3.zero;
private var lastGroundedTime = 0.0;
private var isControllable = true;
private var attackScript : Attack;

//public vars that should not show up in inspector so they stay consistent

@System.NonSerialized 
public var playerLetter; //tells us what player this is on screen

@System.NonSerialized 
public var playerName; //tells us what character this player is playing as


//individual player values
@System.NonSerialized public static var punchBuff : float; //to be set to the attackBuffer: amount of time it takes to start the move
@System.NonSerialized public static var punchRec : float; //set to attackRecovery: amount of time it takes to recover from punch
@System.NonSerialized public static var punch2Buff : float; //to be set to the attackBuffer: amount of time it takes to start the move
@System.NonSerialized public static var punch2Rec : float; //set to attackRecovery: amount of time it takes to recover from punch

function Awake() {
	playerLetter = this.name.Substring( (this.name.Length - 3), 3 ); // grab last 3 characters of name string
	
	//set which way is facing forward
	moveDirection = transform.TransformDirection(Vector3.forward);
	
	playerName = "zipper face"; //TEMP: this should be set to whatever character the player selected from the menu
									//for now everyone is Zipper Face 
	//set default values for this character
	//would probably eventuall have a switch statement here asking what player this is by looking at playerName
	if (playerName == "zipper face")
	{
		punchBuff = .25;
		punchRec = .2; 
		punch2Buff = .05;
		punch2Rec = .1;
		//...
	}
	
	initialZ = transform.position.z; // set initial z-axis value, for use later in Update()
	
	attackType = ""; //tells attack script what attack we are doing, must be set to "" when not attacking
	hitType = ""; //tells this script what kind of attack just landed on its player
	
	health = 100;
	
	attackScript = transform.FindChild("Attack").GetComponent(Attack);
	attackScript.gameObject.active = false; //turn off attack right away
	attackBuffer = -1;
	attackRecovery = -1; 
}

function Update() {
	
	if (!isControllable) Input.ResetInputAxes(); // kill all inputs if not controllable
	if (Input.GetButtonDown( 'Jump ' + playerLetter )) lastJumpButtonTime = Time.time;
	
	//begin distance to closest player calculation
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
		if (transform.localScale.x < 0.0) transform.localScale.x *= -1; // face left
		facing = 'left';
	} else {
		if (transform.localScale.x > 0.0) transform.localScale.x *= -1; // face right
		facing = 'right';
	}
	
	// we are in jump mode but just became grounded
	if( IsGrounded() ) {
		lastGroundedTime = Time.time;
		inAirVelocity = Vector3.zero;
		if( jumping ) {
			jumping = false;
			SendMessage( 'DidLand', SendMessageOptions.DontRequireReceiver );
		}
	}
	
	//PUNCH
	if(Input.GetButtonDown('Fire1 ' + playerLetter) && (attackType == "")) // if this zipper face and attack it done
	{ 
		attackType = "punch"; //this is set back to "recover" in the attack script at the end of the attack
		attackBuffer = punchBuff; //transfer the punch buffer over to the temp variable
		attackRecovery = punchRec;
	}
	
	//PUNCH2
	if(Input.GetButtonDown('Fire2 ' + playerLetter) && (attackType == "")) // if this zipper face and attack it done
	{ 
		attackType = "punch2"; //this is set back to "recover" in the attack script at the end of the attack
		attackBuffer = punch2Buff; //transfer the punch buffer over to the temp variable
		attackRecovery = punch2Rec;
	}
	
	//attack
	if (attackBuffer <= 0 && attackType != "" && attackType != "recover") //if the attack buffer time has run out 
	{
		attackScript.gameObject.active = true; //then activate the attackBox
		attackBuffer = -1; //set back to default
	}else if (attackType != "" && attackBuffer >= 0) //attacking and have an attackBuffer and attackBuffer isnt its defaut
	{
		attackBuffer -= Time.deltaTime;
	}
	
	if (attackType == "recover")
	{
		attackRecovery -= Time.deltaTime;
		
		if (attackRecovery <= 0)
			attackType = ""; //set back to default, so that we can get input from the keyboard again
	}
		
	// lock avatar movement along the z-axis
	transform.position.z = initialZ;

	//DEATH
	if (health <=0 || transform.position.y < -50)
		Death();
	
} //end update

function FixedUpdate(){

	UpdateSmoothedMovementDirection();
	
	// apply gravity
	// - extra power jump modifies gravity
	// - controlledDescent mode modifies gravity
	ApplyGravity();

	// apply jumping logic
	ApplyJumping();
	
	
	if (Mathf.Abs(hitForceX) < .2 ) //this is for slowing the players x velocity after they have been hit so they dont float away
		hitForceX = 0;
	else
		hitForceX = hitForceX*.85;
	
	
	// calculate actual motion
	var movement = moveDirection * moveSpeed + Vector3(hitForceX, verticalSpeed, 0) + inAirVelocity;
	movement *= Time.deltaTime;
	
	// move the controller
	var controller : CharacterController = GetComponent( CharacterController );
	collisionFlags = controller.Move( movement );

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

	var v : float = 0.0;
	var h : float = 0.0;
	
	if (attackType == "" && hitForceX == 0){ //only allowed to move if you are not attacking and not being affected by a hit
	 	v = Input.GetAxisRaw( 'Vertical ' + playerLetter );
	 	h = Input.GetAxisRaw( 'Horizontal ' + playerLetter );
	}
	
	// are we moving backwards or looking backwards
	if (v < -0.2)
		movingBack = true;
	else
		movingBack = false;
	
	//var wasMoving = isMoving;
	isMoving = Mathf.Abs( h ) > 0.1 || Mathf.Abs( v ) > 0.1;
	
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
	
		_characterState = CharacterState.Idle;
		
		// pick speed modifier
		if( Input.GetKey( KeyCode.LeftShift ) | Input.GetKey( KeyCode.RightShift ) ) {
			targetSpeed *= runSpeed;
			_characterState = CharacterState.Running;
		} else if( Time.time - trotAfterSeconds > walkTimeStart ) {
			targetSpeed *= trotSpeed;
			_characterState = CharacterState.Trotting;
		} else {
			targetSpeed *= walkSpeed;
			_characterState = CharacterState.Walking;
		}
		
		moveSpeed = Mathf.Lerp( moveSpeed, targetSpeed, curSmooth ); // interpolate moveSpeed -> targetSpeed
		
		if (moveSpeed < walkSpeed * 0.3) walkTimeStart = Time.time; // reset walk time start when we slow down
	} else { // in air controls
		if (isMoving)
			inAirVelocity += targetDirection.normalized * Time.deltaTime * inAirControlAcceleration;
	}
}

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
		//var jumpButton = Input.GetButton( 'Jump ' + playerLetter ); // apply gravity
		
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

function CalculateJumpVerticalSpeed( targetJumpHeight : float ) {
	// from the jump height and gravity we deduce the upwards speed 
	// for the character to reach at the apex
	return Mathf.Sqrt( 2 * targetJumpHeight * gravity );
}

function DidJump() {
	jumping = true;
	jumpingReachedApex = false;
	lastJumpTime = Time.time;
	lastJumpStartHeight = transform.position.y;
	lastJumpButtonTime = -10;
	
	_characterState = CharacterState.Jumping;
}

function Death(){
	Application.LoadLevel ("TheGame");
}
 
function GetPlayerLetter() {
	return playerLetter;
}

function GetSpeed() {
	return moveSpeed;
}

function IsJumping() {
	return jumping;
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

function IsMoving() : boolean {
	if (attackType == "") //if not attacking
	{
		return (Mathf.Abs( Input.GetAxisRaw( 'Vertical ' + playerLetter ) ) + Mathf.Abs( Input.GetAxisRaw( 'Horizontal ' + playerLetter ) ) > 0.5);
	}
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
