
import System;
import System.Reflection;

public var gameManager : GameObject;
public var muteAllSound : boolean = false;

function OnEnable() {
	if( GameManager.instance == null ) {
		Instantiate( gameManager );
		
		GameManager.instance.controllers[0].state = ControllerState.Ready;
		GameManager.instance.controllers[1].state = ControllerState.Ready;
		
		GameManager.instance.controllers[0].character = CharacterEnum.ZipperFace;
		GameManager.instance.controllers[1].character = CharacterEnum.BlackMagic;
		GameManager.instance.controllers[1].team = ControllerTeam.Red;
		
		GameManager.instance.updateReadyControllers();
	}
}

function FixedUpdate() {
	var listener : AudioListener = GameObject.FindObjectOfType( AudioListener );
	if( muteAllSound ) {
		listener.pause = true;
		listener.volume = 0.0;
	} else {
		listener.pause = false;
		listener.volume = 1.0;
	}
}

function clearConsole() {
	var assembly : Assembly = Assembly.GetAssembly( typeof( SceneView ) );
	var type : Type = assembly.GetType( 'UnityEditorInternal.LogEntries' );
	var method : MethodInfo = type.GetMethod( 'Clear' );
	var object = new Object();
	method.Invoke( object, null );
}
