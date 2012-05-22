
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
		var width : float = 300.0;
		var height : float = 200.0;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		//GUILayout.BeginArea( Rect( 20.0, 20.0, width, height ) );
		
			GUILayout.BeginVertical( 'box' );
				
				//GUILayout.Box( 'Red Team' );
				
				GUILayout.BeginHorizontal();
				
					GUILayout.Box( 'Player 1' );
					GUILayout.Box( 'Player 2' );
				
				GUILayout.BeginHorizontal();
				
			GUILayout.EndVertical();
		
		//GUILayout.EndArea();
		
		if (!GameManager.instance.paused) return;
		
		width = 300.0;
		height = 200.0;
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
		
			GUILayout.Box( 'Game Paused', GUILayout.Width( 150 ) );
			GUILayout.Box( 'Press "Start" to unpause the game.' );
			GUILayout.Box( 'Press "B" to return to Level Select.' );
			GUILayout.Box( 'Press "Back" to return to the Main Menu.' );
						
		GUILayout.EndArea();
	}
}