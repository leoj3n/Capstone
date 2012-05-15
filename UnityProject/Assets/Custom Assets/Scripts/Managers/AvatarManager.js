
public var avatarPrefab : GameObject;
public var characterPrefabs : GameObject[];
public var expectedOrder : CharacterEnum; // just to expose the expected order in the Inspector
public var rotator : GameObject;
public var selectHudPrefab : GameObject;
public var chooseYourFighter : AudioClip;
public var swoosh : AudioClip;

static var avatars : GameObject[];

private var current : int = 0;
private var degreesOfSeparation : float;
private var readyControllers : ControllerEnum[];
private var selectingControllers : Array;
private var selectingController : int;
private var audioWaitFinish : boolean = false;
private var rotations : Array;
private var selectHUDs : Array;
private var waitingForTurn : boolean;
private var selectedIndex : int;

function Awake() {
	readyControllers = GameManager.getControllerEnumsWithState( ControllerState.Ready );
	
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

function OnGUI() {
	switch( Application.loadedLevel ) {
		case 1:
			selectGUI();
			break;
	}
}

function setupSelect() {
	selectingControllers = new Array( GameManager.getControllerEnumsWithState( ControllerState.Ready ) );

	degreesOfSeparation = (360 / characterPrefabs.Length);
	
	rotations = new Array();
	selectHUDs = new Array();
	var i : int = 0;
	for( var character : GameObject in characterPrefabs ) {
		var rot : Quaternion = Quaternion.Euler( 0.0, (degreesOfSeparation * i++), 0.0 );
		var clone : GameObject = Instantiate( selectHudPrefab, Vector3.zero, rot );
		clone.GetComponent( SelectHUD ).characterPrefab = character;
		clone.transform.parent = rotator.transform;
		
		rotations.Push( rot );
		selectHUDs.Push( clone );
	}
	
	audioPlay( chooseYourFighter, true );
}

function updateSelect() {
	if (!audio.isPlaying) audioWaitFinish = false;
	
	// capture input if not playing a selection animation or intro audio
	var playingSelected = selectHUDs[selectedIndex].GetComponent( SelectHUD ).playSelected;	
	
	var left : boolean;
	var right : boolean;
	
	if( playingSelected || audioWaitFinish ) {
		left = false;
		right = false;
	} else {
		left = Input.GetKeyDown( KeyCode.LeftArrow );
		right = Input.GetKeyDown( KeyCode.RightArrow );
		
		var h : float = Global.getAxis( 'Horizontal', selectingController );
		
		if (!left) left = (h < -0.1);
		if (!right) right = (h > 0.1);
	}
	
	// set the current select HUD
	if( left ) {
		current = ((current + 1) % characterPrefabs.Length);
	} else if( right ) {
		current = ((current - 1) % characterPrefabs.Length);
		if (current < 0) current = (characterPrefabs.Length - 1);
	}
	
	// play audio effects
	if( left || right ) {
		audioPlay( characterPrefabs[current].GetComponent( 
			CharacterTemplate ).sound[CharacterSound.AnnouncerName] );
		audio.PlayOneShot( swoosh);
	}
	
	// do the rotation to the current select HUD
	rotator.transform.rotation = Quaternion.Slerp( rotator.transform.rotation, 
		Quaternion.Inverse( rotations[current] ), (Time.deltaTime * 6) );
	
	// if not playing a selection animation and a selection has been made...
	if( !playingSelected && 
		(Input.GetKeyDown( KeyCode.Space ) || Global.isButtonDown( 'Start', selectingController )) ) {		
		
		audio.PlayOneShot( characterPrefabs[current].GetComponent( 
			CharacterTemplate ).sound[CharacterSound.Selected] );
		selectHUDs[current].GetComponent( SelectHUD ).playSelected = true;
		selectedIndex = current;
		waitingForTurn = true;
		playingSelected = true;
	} 
	
	// upon selection animation end
	if( waitingForTurn && !playingSelected ) {
		// move the currently selecting controller off the array of selecting controllers
		selectingController = selectingControllers.Pop();
		
		// set the character variable for the controller
		GameManager.controllers[selectingController].character = current;
	
		// continue to the level if no more controllers need to select a character
		if (selectingControllers.Count == 0) Application.LoadLevel( 2 );
		
		// let the next controller select a character
		current = 0;
		waitingForTurn = false;
		audioPlay( chooseYourFighter, true );
	}
}

function selectGUI() {
	var halfScreenWidth : float = (Screen.width / 2);
	var halfScreenHeight : float = (Screen.height / 2);
	var width : float = 200.0;
	var height : float = 100.0;
	var halfWidth : float = (width / 2);
	var halfHeight : float = (height / 2);
	
	GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (Screen.height - halfHeight), width, height ) );
	
		GUILayout.BeginHorizontal();
		
			for( var controller : ControllerEnum in readyControllers ) {
				if (controller == selectingController)
					text = 'SELECTING';
				else if (controller > selectingController)
					text = 'Waiting';
				else
					text = 'Selected';
					
				GUILayout.Box( 'Controller ' + parseInt( controller ) + '\n[' + text + ']' );
			}
		
		GUILayout.EndHorizontal();
		
	GUILayout.EndArea();

	if( audioWaitFinish ) {
		width = 300.0;
		height = 50.0;
	
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
			GUILayout.Box( 'Use the Left Joystick to select your character' );
		GUILayout.EndArea();
	}
}

function instantiateAvatars() {
	var avatarsTemp : Array = new Array(); // expandable arrays are easy to work with (but slow)
	
	var i : int = 0;
	for( var ce : ControllerEnum in readyControllers ) {		
		var avatar : GameObject = Instantiate( avatarPrefab, Vector3( (2.0 * i++), 4.0, 0.0 ), Quaternion.LookRotation( Vector3.back ) );
		
		var avatarChild : GameObject = Instantiate( characterPrefabs[GameManager.controllers[ce].character], 
			avatar.transform.position, avatar.transform.rotation );
		avatarChild.transform.parent = avatar.transform;
		
		Global.bindAvatarToController( avatar, ce ); // set a reference to the Controller in Avatar
		avatarsTemp.Push( avatar );
	}
	
	avatars = avatarsTemp.ToBuiltin( GameObject ); // convert to builtin for speed
}

// UTILITY FUNCTIONS

function audioPlay( clip : AudioClip, waitFinish : boolean ) {
	if( !audioWaitFinish ) {
		audio.clip = clip;
		audio.Play();
		audioWaitFinish = waitFinish;
	}
}
function audioPlay( clip : AudioClip ) {
	audioPlay( clip, false );
}