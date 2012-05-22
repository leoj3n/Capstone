
import System;
import System.Reflection;

public var muteAllSound : boolean = false;
public var clearConsoleOnLoad : boolean = false;

function OnEnable() {
	if( GameManager.instance == null ) {
		Global.debugScene = Application.loadedLevel;
		Application.LoadLevel( 0 );
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

function OnLevelWasLoaded( loadedLevel : int ) {
	if( loadedLevel == Global.debugScene ) {
		Global.debugScene = 0;
		
		if( clearConsoleOnLoad ) {
			var assembly : Assembly = Assembly.GetAssembly( typeof( SceneView ) );
			var type : Type = assembly.GetType( 'UnityEditorInternal.LogEntries' );
			var method : MethodInfo = type.GetMethod( 'Clear' );
			var object = new Object();
			method.Invoke( object, null );
		}
		
		Debug.Log( 'Debug Helper: Scene ' + loadedLevel + ' has been fully loaded.' );
	}
}