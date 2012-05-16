
class SelectManager implements ISceneManager  {
	private var currentCharacter : int = 0;
	private var rotator : GameObject;
	private var degreesOfSeparation : float;
	private var selectingController : int;
	private var rotations : Array;
	private var selectHUDs : Array;
	private var waitingForTurn : boolean;
	private var selectedIndex : int;
	private var lastSelectTime : float;
	
	function SimulateScene() {
		GameManager.instance.controllers[0].character = CharacterEnum.ZipperFace;
		GameManager.instance.controllers[1].character = CharacterEnum.BlackMagic;
	}
	
	function OnLevelWasLoaded() {
		rotator = GameObject.Find( 'Rotator' );
	
		degreesOfSeparation = (360 / GameManager.instance.characterPrefabs.Length);
		
		selectingController = 0;
		
		rotations = new Array();
		selectHUDs = new Array();
		var i : int = 0;
		for( var character : GameObject in GameManager.instance.characterPrefabs ) {
			var rot : Quaternion = Quaternion.Euler( 0.0, (degreesOfSeparation * i++), 0.0 );
			var clone : GameObject = GameObject.Instantiate( GameManager.instance.selectHudPrefab, Vector3.zero, rot );
			clone.GetComponent( SelectHUD ).characterPrefab = character;
			clone.transform.parent = rotator.transform;
			
			rotations.Push( rot );
			selectHUDs.Push( clone );
		}		
		
		GameManager.instance.audioPlay( GameManager.instance.chooseYourFighter, true );
	}
	
	function Update() {
		// capture input if not playing a selection animation or intro audio
		var playingSelected : boolean = selectHUDs[selectedIndex].GetComponent( SelectHUD ).playSelected;	
		
		var left : boolean;
		var right : boolean;
		
		if( playingSelected || GameManager.instance.audioWaitFinish || ((Time.time - lastSelectTime) < GameManager.instance.selectTimeout) ) {
			left = false;
			right = false;
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
			GameManager.instance.audioPlay( GameManager.instance.characterPrefabs[currentCharacter].GetComponent( 
				CharacterTemplate ).sound[CharacterSound.AnnouncerName] );
			GameManager.instance.audio.PlayOneShot( GameManager.instance.swoosh );
		}
		
		// do the rotation to the currentCharacter select HUD
		rotator.transform.rotation = Quaternion.Slerp( rotator.transform.rotation, 
			Quaternion.Inverse( rotations[currentCharacter] ), (Time.deltaTime * 6) );
		
		// if not playing a selection animation and a selection has been made...
		if( !playingSelected && !GameManager.instance.audioWaitFinish ) {
			switch( true ) {
				case Global.isButtonDown( 'A', GameManager.instance.readyControllers[selectingController] ):
					GameManager.instance.audio.PlayOneShot( GameManager.instance.characterPrefabs[currentCharacter].GetComponent( 
						CharacterTemplate ).sound[CharacterSound.Selected] );
					selectHUDs[currentCharacter].GetComponent( SelectHUD ).playSelected = true;
					selectedIndex = currentCharacter;
					waitingForTurn = true;
					playingSelected = true;
					break;
				case Global.isButtonDown( 'B' ):
					if( selectingController == 0 ) {
						Debug.Log( 'Load previous level' );
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
			
			// continue to the level if no more controllers need to select a character
			if ( selectingController == GameManager.instance.readyControllers.Length ) {
				Application.LoadLevel( 2 );
			} else { // otherwise let the next controller select a character
				newSelect();
			}
		}
	}
	
	function OnGUI() {
		var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		var width : float = 200.0;
		var height : float = 100.0;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (Screen.height - halfHeight), width, height ) );
		
			GUILayout.BeginHorizontal();
			
				for( var controller : ControllerEnum in GameManager.instance.readyControllers ) {
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
	
		if( GameManager.instance.audioWaitFinish ) {
			width = 300.0;
			height = 50.0;
		
			GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
				GUILayout.Box( 'Use the Left Joystick to select your character' );
			GUILayout.EndArea();
		}
	}
	
	private function newSelect() {
		currentCharacter = 0;
		waitingForTurn = false;
		GameManager.instance.audioPlay( GameManager.instance.chooseYourFighter, true );
	}
}