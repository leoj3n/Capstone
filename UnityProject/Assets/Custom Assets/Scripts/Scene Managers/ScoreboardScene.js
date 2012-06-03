
class ScoreboardScene extends SceneManager {	
	function SceneLoaded() {}
	
	function Update() {
		switch( true ) {
			case Global.isButtonDown( 'A', GameManager.instance.readyControllers ):
				Debug.Log( GameManager.instance.level );
				GameManager.instance.loadLevel( GameManager.instance.level ); // replay
				break;
			case Global.isButtonDown( 'B', GameManager.instance.readyControllers ):
				Application.LoadLevel( SceneEnum.LevelSelect ); // choose a new level
				break;
			case Global.isButtonDown( 'Back', GameManager.instance.readyControllers ):
				Application.LoadLevel( SceneEnum.Start ); // go back to start
				break;
		}
	}
	
	function OnGUI() {
		var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		var width : float = 500.0;
		var height : float = 300.0;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), 20.0, width, height ) );
			
			GUILayout.Box( 'Score Board' );
			
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
	}
}