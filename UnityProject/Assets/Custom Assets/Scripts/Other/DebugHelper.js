
import System;
import System.Reflection;

public var muteAllSound : boolean = false;
public var clearConsole : boolean = false;

function Awake() {
	if( GameManager.instance == null ) {
		Global.debugScene = Application.loadedLevel;
		Application.LoadLevel( 0 );
	}
}

function Update() {
	var listeners : AudioListener[] = GameObject.FindObjectsOfType( AudioListener );
	
	for( var listener : AudioListener in listeners ) {
		listener.pause = muteAllSound;
	}
}

function OnLevelWasLoaded( loadedLevel : int ) {
	if( loadedLevel == Global.debugScene ) {
		if( clearConsole ) {
			var assembly : Assembly = Assembly.GetAssembly( typeof( SceneView ) );
			var type : Type = assembly.GetType( 'UnityEditorInternal.LogEntries' );
			var method : MethodInfo = type.GetMethod( 'Clear' );
			var object = new Object();
			method.Invoke( object, null );
		}
		
		Debug.Log( '* * * Debug Scene Loaded * * *' );
	}
}