
class StartScene extends SceneManager {	
	public var backgroundImage : Texture2D;
	public var countDownSeconds : int = 3;
	
	private var countdownStartTime : float;
	
	function SceneLoaded() {		
		countdownStartTime = 0.0;
		
		// incase they hit back to re-select their characters
		for( var i = 0; i < ControllerEnum.Count; i++ ) {
			if (GameManager.instance.controllers[i].state == ControllerState.Ready)
				GameManager.instance.controllers[i].state = ControllerState.TeamSelect;
		}
	}
	
	function Update() {
		// loop through each controller to set state and team on button press
		for( var i = 0; i < ControllerEnum.Count; i++ ) {
			switch( true ) {
				case Global.isButtonDown( 'Start', i ):
					switch( GameManager.instance.controllers[i].state ) {
						case ControllerState.SittingOut:
							GameManager.instance.controllers[i].state = ControllerState.TeamSelect;
							break;
						case ControllerState.TeamSelect:
							GameManager.instance.controllers[i].state = ControllerState.Ready;
							break;
					}
					break;
				case Global.isButtonDown( 'Back', i ):
					switch( GameManager.instance.controllers[i].state ) {
						case ControllerState.Ready:
							GameManager.instance.controllers[i].state = ControllerState.TeamSelect;
							break;
						default:
							GameManager.instance.controllers[i].state = ControllerState.SittingOut;
							break;
					}
					break;
			}
			
			if( GameManager.instance.controllers[i].state == ControllerState.TeamSelect ) {
				switch( true ) {
					case Global.isButtonDown( 'A', i ):
						GameManager.instance.controllers[i].team = ControllerTeam.Green;
						break;
					case Global.isButtonDown( 'B', i ):
						GameManager.instance.controllers[i].team = ControllerTeam.Red;
						break;
					case Global.isButtonDown( 'X', i ):
						GameManager.instance.controllers[i].team = ControllerTeam.Blue;
						break;
					case Global.isButtonDown( 'Y', i ):
						GameManager.instance.controllers[i].team = ControllerTeam.Orange;
						break;
				}
			}
		}
	}
	
	function OnGUI() {
		GUI.skin = GameManager.instance.customSkin;
		
		var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		var width : float = (Screen.width * 0.90);
		var height : float = 300.0;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		GUI.DrawTexture( Rect( (halfScreenWidth - 250), (Screen.height - 393), 500, 393 ), backgroundImage );
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), 20.0, width, height ) );
		
			GUILayout.Box( 'Press [Start] or [Back] to add or remove your controller\nChange teams using [A] [B] [X] [Y] (button colors correspond to team colors)' );
			
			var selecting : ControllerEnum[] = GameManager.instance.getControllerEnumsWithState( ControllerState.TeamSelect );
			var ready : ControllerEnum[] = GameManager.instance.getControllerEnumsWithState( ControllerState.Ready );
			var totalControllers : int = (selecting.Length + ready.Length);
			
			if( totalControllers == 1 ) {
				GUILayout.Box( 'Two or more controllers are needed. Add another controller to continue!' );
			} else if( totalControllers > 0 ) {
				if( selecting.Length == 0 ) {
					if( onSameTeam( ready ) ) {
						GUILayout.Box( 'All players cannot be on the same team! A controller must change teams!' );
					} else {
						if (countdownStartTime == 0.0) countdownStartTime = Time.time;
						var seconds : int = (Mathf.CeilToInt( countDownSeconds - (Time.time - countdownStartTime) ) % 60);
						if (seconds == 1) Application.LoadLevel( SceneEnum.CharacterSelect );
						GUILayout.Box( 'Character select in ' + seconds );
					}
				} else {
					countdownStartTime = 0.0;
					GUILayout.Box( 'Waiting for ' + selecting.Length + ' controllers to press [Start] to ready up' );
				}
			} else {
				GUILayout.Box( 'No controllers added yet' );
			}
			
			GUILayout.BeginHorizontal();
			
				for (var i = 0; i < ControllerTeam.Count; i++) displayTeam( i );
				
			GUILayout.EndHorizontal();
			
		GUILayout.EndArea();
	}
	
	private function onSameTeam( controllers : ControllerEnum[] ) : boolean {
		for( var ce1 : ControllerEnum in controllers ) {
			var team1 : ControllerTeam = GameManager.instance.controllers[ce1].team;
			
			for( var ce2 : ControllerEnum in controllers ) {
				var team2 : ControllerTeam = GameManager.instance.controllers[ce2].team;
				
				if (team1 != team2) return false;
			}
		}
		
		return true;
	}
	
	private function displayTeam( team : ControllerTeam ) {
		GUILayout.BeginVertical();
					
			GUILayout.Box( team + ' Team' );
		
			for( var i = 0; i < ControllerEnum.Count; i++ ) {
				var text : String;
				
				switch( GameManager.instance.controllers[i].state ) {
					case ControllerState.TeamSelect:
						text = 'Press [Start]';
						break;
					case ControllerState.Ready:
						text = 'Ready!';
						break;
				}
				
				if (text && (GameManager.instance.controllers[i].team == team))
					GUILayout.Box( 'Controller ' + i + '\n' + text );
			}
			
		GUILayout.EndVertical();
	}
}