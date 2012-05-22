
class LevelManager implements ISceneManager {
	function SimulateScene() {
		// nothing needs to be simulated
	}

	function OnEnable() {
		GameManager.instance.instantiateAvatars();
	}
	
	function Update() {
		if (Global.isButtonDown( 'Start', GameManager.instance.readyControllers ))
			GameManager.instance.togglePause();
		
		if( GameManager.instance.paused ) {
			switch( true ) {
				case Global.isButtonDown( 'B', GameManager.instance.readyControllers ):
					GameManager.instance.togglePause();
					Application.LoadLevel( SceneEnum.LevelSelect );
					break;
				case Global.isButtonDown( 'Back', GameManager.instance.readyControllers ):
					GameManager.instance.togglePause();
					Application.LoadLevel( SceneEnum.Start );
					break;
			}
		}
	}
	
	function OnGUI() {		
		var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		
		/*GUILayout.BeginArea( Rect( 20.0, 20.0, (halfScreenWidth - 20.0), (halfScreenHeight - 20.0) ) );
					
			GUILayout.BeginHorizontal();
			
				GUILayout.Box( 'Red Team' );
				GUILayout.Box( 'Player 1' );
				GUILayout.Box( 'Player 2' );
			
			GUILayout.EndHorizontal();
		
		GUILayout.EndArea();*/
		
		GUI.BeginGroup( Rect( 20.0, 20.0, (Screen.width - 40.0), (Screen.height - 40.0) ) );
			
			GUILayout.BeginVertical();
				
				var initialized;
				for( var i = 0; i < ControllerTeam.Count; i++ ) {
					initialized = false;
					
					for( var controller : ControllerEnum in GameManager.instance.readyControllers ) {
						if( GameManager.instance.controllers[controller].team == i ) {
							if( !initialized ) {
								if (i != 0) GUILayout.Space( 20.0 );
								GUILayout.Box( 'Team ' + i );
								initialized = true;
							}
							
							GUILayout.Box( 'Controller ' + controller );
						}
					}
				}
				
			GUILayout.EndVertical();
		
		GUI.EndGroup();
		
		if (!GameManager.instance.paused) return;
		
		var width : float = 300.0;
		var height : float = 200.0;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
		
			GUILayout.Box( 'Game Paused', GUILayout.Width( 150 ) );
			GUILayout.Box( 'Press "Start" to unpause the game.' );
			GUILayout.Box( 'Press "B" to return to Level Select.' );
			GUILayout.Box( 'Press "Back" to return to the Main Menu.' );
						
		GUILayout.EndArea();
	}
}