
class DefaultScene extends SceneManager {
	function SceneLoaded() {
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
		
		GUILayout.BeginArea( Rect( 20.0, 20.0, 120.0, (Screen.height - 40.0) ) );
			
			GUILayout.BeginVertical();
				
				for( var i = 0; i < ControllerTeam.Count; i++ ) {					
					var avatars : GameObject[] = GameManager.instance.getAvatarsOnTeam( i );
					
					if( avatars.Length > 0 ) {
						if (i != 0) GUILayout.Space( 20.0 );
						GUILayout.Box( 'Team ' + ControllerTeam.GetName( ControllerTeam, i ) );
						
						for( var avatar : GameObject in avatars ) {
							var component : Component = avatar.GetComponent( Avatar );
							GUILayout.Box( component.getName() + '\n(Controller ' + parseInt( component.getController() ) + ')\nHP [' + parseInt( component.health ) + '] PM [0%]' );
						}
					}
				}
				
			GUILayout.EndVertical();
		
		GUILayout.EndArea();
		
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