
@script RequireComponent( CharacterController )
@script RequireComponent( AudioSource )

// STATIC
private var template : AvatarTemplate;
private var playerLetter : String = 'A';
private var collisionFlags : CollisionFlags;
protected var gravity : float = 50.0;
protected var groundedAcceleration : float = 6.0;
protected var inAirAcceleration : float = 3.0;

// STATE
protected var facing : int = 1;
protected var canJump : boolean = true;
protected var isControllable : boolean = true;
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
public var state : states;

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
protected var lastJumpStartHeight : float = 0.0; // the height we jumped from
protected var verticalSpeed : float = 0.0; // the current vertical speed
protected var inAirVelocity : Vector3 = Vector3.zero;

// MOVEMENT
protected var moveDirection : Vector3 = Vector3.zero; // the current move direction in x-z
protected var moveSpeed : float = 0.0; // the current x-z move speed
protected var movingBack : boolean = false; // are we moving backwards?
protected var isMoving : boolean = false; // is the user pressing any keys?

function Start() {
	moveDirection = transform.TransformDirection( Vector3.forward );
	
	template = GetComponentInChildren( AvatarTemplate );
}

function Update() {
	if (!isControllable) Input.ResetInputAxes(); // kill all inputs if not controllable
	
	if (GetAxis( 'Vertical' ) >= 0.2) lastJumpButtonTime = Time.time; // jump

	updateSmoothedMovementDirection();
	
	// apply gravity
	verticalSpeed = (IsGrounded() ? 0.0 : (verticalSpeed - (gravity * Time.deltaTime)));

	applyJumping();
	
	// move the controller
	collisionFlags = GetComponent( CharacterController ).Move( 
		((moveDirection * moveSpeed + Vector3( 0, verticalSpeed, 0 ) + inAirVelocity) * Time.deltaTime) );
	
	// we are in jump mode but just became grounded
	if( IsGrounded() ) {
		lastGroundedTime = Time.time;
		inAirVelocity = Vector3.zero;
		if( jumping ) {
			jumping = false;
			SendMessage( 'DidLand', SendMessageOptions.DontRequireReceiver );
		}
	}
	
	faceNearestEnemy();
	
	stateSetup();
	
	enforceBounds();
} // Update()

function updateSmoothedMovementDirection() {
	// forward vector relative to the camera along the x-z plane	
	var forward = Camera.main.transform.TransformDirection( Vector3.forward );
	forward.y = 0;
	forward = forward.normalized;

	// right vector relative to the camera, always orthogonal to the forward vector
	var right = Vector3( forward.z, 0, -forward.x );

	var v = GetAxis( 'Vertical' );
	var h = GetAxis( 'Horizontal' );

	movingBack = ((v < -0.2) ? true : false);
	
	var wasMoving = isMoving;
	isMoving = (Mathf.Abs( h ) > 0.1);
	
	var targetDirection = (h * right); // x-axis user input
	
	// grounded controls
	if( IsGrounded() ) {
		// moveDirection is always normalized, and we only update it if there is user input
		if (targetDirection != Vector3.zero) moveDirection = targetDirection.normalized;
				
		// choose target speed
		// - we want to support analog input but make sure you cant walk faster diagonally than just forward or sideways
		var targetSpeed = Mathf.Min( targetDirection.magnitude, 1.0 ) * template.walkSpeed;
		
		moveSpeed = Mathf.Lerp( moveSpeed, targetSpeed, (groundedAcceleration * Time.deltaTime) ); // interpolate moveSpeed -> targetSpeed
	} else { // in air controls
		if (isMoving)
			inAirVelocity += (targetDirection.normalized * Time.deltaTime * inAirAcceleration);
	}
} // updateSmoothedMovementDirection()

function applyJumping() {
	// prevent jumping too fast after each other
	if (lastJumpTime + jumpRepeatTime > Time.time) return;

	if( IsGrounded() ) {
		// jump
		// - only when pressing the button down
		// - with a timeout so you can press the button slightly before landing		
		if( canJump && (Time.time < (lastJumpButtonTime + jumpTimeout)) ) {
			audio.PlayOneShot( template.jumpSound );
			verticalSpeed = Mathf.Sqrt( 2 * template.jumpHeight * gravity );
			SendMessage( 'DidJump', SendMessageOptions.DontRequireReceiver );
		}
	}
}

function DidJump() {
	jumping = true;
	lastJumpTime = Time.time;
	lastJumpButtonTime = -10;
	lastJumpStartHeight = transform.position.y;
}

function IsGrounded() {
	return ((collisionFlags & CollisionFlags.CollidedBelow) != 0);
}

function faceNearestEnemy() {
	var dist : float = 0.0;
	var closestDist : float = 999.0;
	for( var avatar : GameObject in Manager.avatars ) {
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
	
	// set movingBack variable TODO: does this really need to be set twice?
	movingBack = (((moveDirection.x - facing) == 0) ? true : false);
}

function stateSetup() {	
	var blocking : boolean = (!isMoving && (GetAxis( 'Vertical' ) <= -0.2)) ? true : false; // block
	var knockback : boolean = false;
	var fire1 : boolean = IsButton( 'Fire1' );
	
	switch( true ) {
		case blocking:
			state = states.block;
			break;
		case jumping:
			state = states.jump; // forward/backwards
			break;
		case knockback:
			state = states.jump; // forward/backwards
			break;
		case fire1:
			template.Special2();
			state = states.fire1;
			break;
		default:
			state = states.idle;
			break;
	}
	
	state = states.idle; // Debug.
	
	BroadcastMessage( 'TextureAtlasIndex', parseInt( state ), SendMessageOptions.DontRequireReceiver );
}

function enforceBounds() {
	transform.position.z = Global.sharedZ;
	if (transform.position.x > Global.sharedMaxX) transform.position.x = Global.sharedMaxX;
	if (transform.position.x < Global.sharedMinX) transform.position.x = Global.sharedMinX;
}

function addExplosionForce( pos : Vector3, force : float, damping : float ) {	
	var dist : float = Mathf.Max( Vector3.Distance( pos, transform.position ), 1.0 );
	
	var dir : Vector3 = (transform.position - pos).normalized;
	
	var explosionForce : Vector3 = ((dir * force) / (dist));
	if (explosionForce.y < 0.0) explosionForce.y = 0.0;
	explosionForce.y += 0.1; // add upward bias
	
	var damage : float = ((force * damping) / dist);
	health -= (damage * damage);
	
	// apply explosion force via co-routine
	while( explosionForce != Vector3.zero ) {
		explosionForce = Vector3.Slerp( explosionForce, Vector3.zero, (Time.deltaTime * damping) );
		transform.GetComponent( CharacterController ).Move( explosionForce );
		yield;
	}
}

function SetPlayerLetter( letter : String ) {
	playerLetter = letter;
	gameObject.name = 'Avatar (' + letter + ')';
}

function IsButtonDown( button ) {
	return Input.GetButtonDown( button + ' (' + playerLetter + ')' );
}

function IsButton( button ) {
	return Input.GetButton( button + ' (' + playerLetter + ')' );
}

function GetAxis( axis ) {
	return Input.GetAxisRaw( axis + ' (' + playerLetter + ')' );
}

function OutOfBounds() {
	Debug.Log( 'Player out of bounds!' );
}

function Reset() {
	gameObject.tag = 'Player';
	gameObject.layer = 8;
	transform.position = Vector3.zero;
	transform.rotation = Quaternion.identity;
	transform.localScale = Vector3( 1.0, 1.0, -1.0 );
}

// push props away
function OnControllerColliderHit( hit : ControllerColliderHit ) {
	if (!hit.gameObject.CompareTag( 'Prop' )) return; // only do so for props
	var body : Rigidbody = hit.collider.attachedRigidbody;
	if ((body == null) || body.isKinematic) return;
	if (hit.moveDirection.y < -0.3) return; // dont push objects down
	
	var pushDir : Vector3 = Vector3( hit.moveDirection.x, 0, hit.moveDirection.z );
	
	body.velocity = pushDir; // possibility: incorporate body.mass
}