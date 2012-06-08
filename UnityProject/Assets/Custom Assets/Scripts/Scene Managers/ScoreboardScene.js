
class ScoreboardScene extends SceneManager {	
	function SceneLoaded() {}
	
	function Update() {
		switch( true ) {
			case Global.isButtonDown( 'A', GameManager.instance.readyControllers ):
				GameManager.instance.loadLevel( GameManager.instance.level, true ); // replay
				break;
			case Global.isButtonDown( 'B', GameManager.instance.readyControllers ):
				GameManager.instance.loadScene( SceneEnum.LevelSelect ); // choose a new level
				break;
			case Global.isButtonDown( 'Back', GameManager.instance.readyControllers ):
				GameManager.instance.loadScene( SceneEnum.Start ); // go back to start
				break;
		}
	}
	
	function OnGUI() {
		GUI.skin = GameManager.instance.customSkin;
		
		var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		var width : float = (Screen.width * 0.90);
		var height : float = (Screen.height * 0.90);
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
			
			var winningTeams : ControllerTeam[] = GameManager.instance.getWinningTeamOrTeams();
			
			switch( winningTeams.Length ) {
				case 1:
					GUILayout.Box( winningTeams[0] + ' Team Wins!' );
					break;
				case 2:
					GUILayout.Box( 'It was a tie between the ' + winningTeams[0] + ' Team and ' + winningTeams[1] + ' Team.' );
					break;
				case 3:
					GUILayout.Box( ' It was a three-way tie between the ' + winningTeams[0] + ' Team, ' + winningTeams[1] + ' Team and ' + winningTeams[1] + ' Team.' );
					break;
			}
			
			for( var i = 0; i < ControllerTeam.Count; i++ ) {
				var controllers : ControllerEnum[] = GameManager.instance.getControllerEnumsOnTeam( i );
				
				if( controllers.Length > 0 ) {
					GUILayout.Space( 20.0 );
					
					GUILayout.Box( ControllerTeam.GetName( ControllerTeam, i ) + ' Team' );
					
					GUILayout.BeginHorizontal();
						
						for( var controller : ControllerEnum in controllers ) {
							GUILayout.Box( GameManager.instance.controllers[controller].character + '\n(Controller ' + parseInt( controller ) + ')' );
						}
					
					GUILayout.EndHorizontal();
				}
			}
			
		GUILayout.EndArea();
		
		width = 300.0;
		height = 90.0;
		halfWidth = (width / 2);
		halfHeight = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (Screen.height - (Screen.height * 0.05) - height), width, height ) );
						
			GUILayout.Box( 'Press [A] to replay ' + GameManager.instance.level + '.' );
			GUILayout.Box( 'Press [B] to return to Level Select.' );
			GUILayout.Box( 'Press [Back] to return to the Main Menu.' );
			
		GUILayout.EndArea();
	}
}