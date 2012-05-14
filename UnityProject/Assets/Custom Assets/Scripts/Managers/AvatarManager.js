
public var avatarPrefab : GameObject;
public var characterPrefabs : GameObject[];
public var expectedOrder : AvatarEnum; // just to expose the expected order in the Inspector
public var rotator : GameObject;
public var selectHudPrefab : GameObject;

static var avatars : GameObject[];

private var current : float = 0;
private var degreesOfSeparation : float;

function Awake() {
	switch( Application.loadedLevel ) {
		case 1:
			setupSelect();
			break;
		default:
			instantiateAvatars();
			break;
	}
}

function Update() {
	switch( Application.loadedLevel ) {
		case 1:
			updateSelect();
			break;
	}
}

function setupSelect() {
	degreesOfSeparation = (360 / characterPrefabs.Length);
	
	var i : int = 0;
	for( var character : GameObject in characterPrefabs ) {
		var clone : GameObject = Instantiate( selectHudPrefab, Vector3.zero, Quaternion.Euler( 0.0, (degreesOfSeparation * i++), 0.0 ) );
		clone.GetComponent( CharacterSelectHUD ).characterPrefab = character;
		clone.transform.parent = rotator.transform;
	}
}

function updateSelect() {
	var leftArrow : boolean = Input.GetKeyDown( KeyCode.LeftArrow );
	var rightArrow : boolean = Input.GetKeyDown( KeyCode.RightArrow );
	
	if( leftArrow ) {
		current = ((current + 1) % characterPrefabs.Length);
		
		rotator.SendMessage( 'AddRotation', degreesOfSeparation );
	} else if( rightArrow ) {
		current = ((current - 1) % characterPrefabs.Length);
		if (current < 0) current = (characterPrefabs.Length - 1);
		
		rotator.SendMessage( 'AddRotation', -degreesOfSeparation );
	}
	
	if( leftArrow || rightArrow ) {
		//audioPlay( templates[current].sound[AvatarSound.AnnouncerName] );
		//audio.PlayOneShot( swoosh, 1.0 );
	}
	
	/*if( Input.GetKeyDown( KeyCode.Space ) ) {
		GameManager.controllers[activeControllers.Pop()].avatar = current;
		selectHUDs[current].selected = true;
	}*/
}

function instantiateAvatars() {
	var avatarsTemp : Array = new Array(); // expandable arrays are easy to work with (but slow)
	
	// only instantiate for active controllers
	var activeControllers : ControllerEnum[] = GameManager.getControllerEnumsWithState( ControllerState.Ready );
	
	var i : int = 0;
	for( var ce : ControllerEnum in activeControllers ) {		
		var avatar : GameObject = Instantiate( avatarPrefab, Vector3( (2.0 * i++), 4.0, 0.0 ), Quaternion.LookRotation( Vector3.back ) );
		
		var avatarChild : GameObject = Instantiate( characterPrefabs[GameManager.controllers[ce].avatar], 
			avatar.transform.position, avatar.transform.rotation );
		avatarChild.transform.parent = avatar.transform;
		
		Global.bindAvatarToController( avatar, ce ); // set a reference to the Controller in Avatar
		avatarsTemp.Push( avatar );
	}
	
	avatars = avatarsTemp.ToBuiltin( GameObject ); // convert to builtin for speed
}