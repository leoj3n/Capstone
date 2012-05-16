
class LevelManager implements ISceneManager  {
	function OnLevelWasLoaded() {
		GameManager.instance.instantiateAvatars();
	}
	
	function Update() {}
	
	function OnGUI() {
		/*var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		var width : float = 500.0;
		var height : float = 300.0;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
		
			GUILayout.Box( 'Press Start or Back to add or remove your controller\nChange teams using A/B/X/Y (button colors correspond to team colors)' );
			
			GUILayout.BeginHorizontal();
			
				for (var i = 0; i < ControllerTeam.Count; i++) displayTeam( i );
				
			GUILayout.EndHorizontal();
			
			var selecting : ControllerEnum[] = getControllerEnumsWithState( ControllerState.TeamSelect );
			var ready : ControllerEnum[] = getControllerEnumsWithState( ControllerState.Ready );
			
			if( (selecting.Length + ready.Length) > 0 ) {
				if( selecting.Length == 0 ) {
					if (countdownStartTime == 0.0) countdownStartTime = Time.time;
					var seconds : int = (Mathf.CeilToInt( countDownSeconds - (Time.time - countdownStartTime) ) % 60);
					if (seconds == 1) Application.LoadLevel( 1 );
					GUILayout.Box( 'Character select in ' + seconds );
				} else {
					countdownStartTime = 0.0;
					GUILayout.Box( 'Waiting for ' + selecting.Length + ' controllers to press Start' );
				}
			} else {
				GUILayout.Box( 'No controllers added yet' );
			}
			
		GUILayout.EndArea();*/
	}
}