
class CharacterSelectScene extends SceneManager {
	public var hudPrefab : GameObject;
	public var buttonTimeout : float = 1.0;
	
	private var currentCharacter : int = 0;
	private var rotator : GameObject;
	private var degreesOfSeparation : float;
	private var selectingController : int;
	private var rotations : Array;
	private var hUDs : Array;
	private var waitingForTurn : boolean;
	private var lastSelectTime : float;
	
	function SceneLoaded() {
		rotator = GameObject.Find( 'Rotator' );
		degreesOfSeparation = (360 / GameManager.instance.characterPrefabs.Length);
		
		rotations = new Array();
		hUDs = new Array();
		var i : int = 0;
		for( var character : GameObject in GameManager.instance.characterPrefabs ) {
			var rot : Quaternion = Quaternion.Euler( 0.0, (degreesOfSeparation * i++), 0.0 );
			var clone : GameObject = GameObject.Instantiate( hudPrefab, Vector3.zero, rot );
			clone.GetComponent( SelectHUD ).characterPrefab = character;
			clone.transform.parent = rotator.transform;
			
			rotations.Push( rot ); // TODO: convert to built-in arrays for speed increase
			hUDs.Push( clone );
		}
		
		selectingController = 0;
		newSelect();
	}
	
	function Update() {
		// capture input if not playing a selection animation or intro audio
		var playingSelected : boolean = hUDs[currentCharacter].GetComponent( SelectHUD ).playSelected;	
		
		var left : boolean;
		var right : boolean;
		
		if( playingSelected || GameManager.instance.audioIsPlaying( 'ChooseYourFighter' ) || ((Time.time - lastSelectTime) < buttonTimeout) ) {
			left = right = false;
		} else {
			var h : float = Global.getAxis( 'Horizontal', GameManager.instance.readyControllers[selectingController] );
			left = (h < -0.1);
			right = (h > 0.1);
		}
		
		// set the currentCharacter select HUD
		switch( true ) {
			case left:
				currentCharacter = ((currentCharacter + 1) % GameManager.instance.characterPrefabs.Length);
				break;
			case right:
				currentCharacter = ((currentCharacter - 1) % GameManager.instance.characterPrefabs.Length);
				if (currentCharacter < 0) currentCharacter = (GameManager.instance.characterPrefabs.Length - 1);
				break;
		}
		
		// do this AFTER setting the currentCharacter select HUD
		if( left || right ) {
			lastSelectTime = Time.time;
			
			// play audio effects
			GameManager.instance.audioBind( 'announcerName',
				GameManager.instance.characterPrefabs[currentCharacter].GetComponent( Avatar ).sound[CharacterSound.AnnouncerName] );
			GameManager.instance.audioPlay( 'announcerName', true );
			GameManager.instance.audioPlay( 'Swoosh', true );
		}
		
		// do the rotation to the currentCharacter select HUD
		rotator.transform.rotation = Quaternion.Slerp( rotator.transform.rotation, 
			Quaternion.Inverse( rotations[currentCharacter] ), (Time.deltaTime * 6) );
		
		// if not playing a selection animation and a selection has been made...
		if( !playingSelected && !GameManager.instance.audioIsPlaying( 'ChooseYourFighter' ) ) {
			switch( true ) {
				case Global.isButtonDown( 'A', GameManager.instance.readyControllers[selectingController] ):
					GameManager.instance.audioBind( 'selected',
						GameManager.instance.characterPrefabs[currentCharacter].GetComponent( Avatar ).sound[CharacterSound.Selected] );
					GameManager.instance.audioPlay( 'selected' );
					hUDs[currentCharacter].GetComponent( SelectHUD ).playSelected = true;
					waitingForTurn = true;
					playingSelected = true;
					break;
				case Global.isButtonDown( 'B', GameManager.instance.readyControllers ):
					if( selectingController == 0 ) {
						Application.LoadLevel( SceneEnum.Start );
					} else {
						selectingController--;
						newSelect();
						break;
					}
			}
		} 
		
		// upon selection animation end
		if( waitingForTurn && !playingSelected ) {
			// set the character variable for the controller
			GameManager.instance.controllers[selectingController++].character = currentCharacter;
			
			// continue to level select if no more controllers need to select a character
			if ( selectingController == GameManager.instance.readyControllers.Length ) {
				Application.LoadLevel( SceneEnum.LevelSelect );
			} else { // otherwise let the next controller select a character
				newSelect();
			}
		}
	}
	
	function OnGUI() {
		GUI.skin = GameManager.instance.customSkin;
		
		var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		var width : float = 300.0;
		var height : float = 50.0;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (Screen.height - (Screen.height * 0.05) - height), width, height ) );
		
			GUILayout.BeginHorizontal();
			
				for( var controller : ControllerEnum in GameManager.instance.readyControllers ) {
					if (controller == selectingController)
						text = 'SELECTING';
					else if (controller > selectingController)
						text = 'Waiting';
					else
						text = 'Selected!';
						
					GUILayout.Box( 'Controller ' + parseInt( controller ) + '\n' + text + '' );
				}
			
			GUILayout.EndHorizontal();
			
		GUILayout.EndArea();
	
		if( GameManager.instance.audioIsPlaying( 'ChooseYourFighter' ) ) {
			width = 300.0;
			height = 50.0;
		
			GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
				GUILayout.Box( 'Use the Left Joystick to select your character' );
			GUILayout.EndArea();
		}
	}
	
	private function newSelect() {
		currentCharacter = GameManager.instance.controllers[selectingController].character;
		waitingForTurn = false;
		GameManager.instance.audioPlay( 'ChooseYourFighter', true );
	}
}