
class StartScene extends SceneManager {
	public var backgroundImage : Texture2D;
	public var countDownSeconds : int = 3;
	public var buttonTimeout : float = 0.3;
	public var connectSound : AudioClip;
	public var disconnectSound : AudioClip;
	public var readySound : AudioClip;
	
	private var countdownStartTime : float;
	private var lastSelectTime : float[];
	private var previousSecond : int = -1;
	
	function SceneLoaded() {		
		countdownStartTime = 0.0;
		
		// incase they have hit back, to re-select their characters
		for( var i = 0; i < ControllerEnum.Count; i++ ) {
			if (GameManager.instance.controllers[i].state == ControllerState.Ready)
				GameManager.instance.controllers[i].state = ControllerState.TeamSelect;
		}
		
		lastSelectTime = new float[ControllerEnum.Count];
		
		GameManager.instance.audioBind( 'connect', connectSound );
		GameManager.instance.audioBind( 'disconnect', disconnectSound );
		GameManager.instance.audioBind( 'ready', readySound );
	}
	
	function Update() {
		// loop through each controller to set state and team on button press
		for( var i = 0; i < ControllerEnum.Count; i++ ) {
			switch( true ) {
				case Global.isButtonDown( 'Start', i ):
					switch( GameManager.instance.controllers[i].state ) {
						case ControllerState.SittingOut:
							GameManager.instance.audioPlay( 'connect', true );
							GameManager.instance.controllers[i].state = ControllerState.TeamSelect;
							GameManager.instance.controllers[i].team = i; // hopefully will reduce confusion
							break;
						case ControllerState.TeamSelect:
							GameManager.instance.controllers[i].state = ControllerState.Ready;
							GameManager.instance.audioPlay( 'ready', true );
							break;
					}
					break;
				case Global.isButtonDown( 'Back', i ):
					switch( GameManager.instance.controllers[i].state ) {
						case ControllerState.Ready:
							GameManager.instance.controllers[i].state = ControllerState.TeamSelect;
							break;
						case ControllerState.TeamSelect:
							GameManager.instance.audioPlay( 'disconnect', true );
							GameManager.instance.controllers[i].state = ControllerState.SittingOut;
							break;
					}
					break;
			}
			
			if( GameManager.instance.controllers[i].state == ControllerState.TeamSelect ) {
				var up : boolean;
				var down : boolean;
				if( ((Time.time - lastSelectTime[i]) > buttonTimeout) ) {
					var v : float = Global.getAxis( 'Vertical', i );
					up = (v > 0.1);
					down = (v < -0.1);
				}
				
				if( up || down ) {
					lastSelectTime[i] = Time.time;
					GameManager.instance.audioPlay( 'Click', true );
				}
				
				var countInt : int = ControllerTeam.Count;
				var teamInt : int = GameManager.instance.controllers[i].team;
				switch( true ) {
					case up:
						GameManager.instance.controllers[i].team = teamInt = ((teamInt - 1) % countInt);
						if (teamInt < 0) GameManager.instance.controllers[i].team = (countInt - 1);
						break;
					case down:
						GameManager.instance.controllers[i].team = ((teamInt + 1) % countInt);
						break;
				}
			}
		}
	}
	
	function OnGUI() {
		GUI.skin = GameManager.instance.customSkin;
		
		var selecting : ControllerEnum[] = GameManager.instance.getControllerEnumsWithState( ControllerState.TeamSelect );
		var ready : ControllerEnum[] = GameManager.instance.getControllerEnumsWithState( ControllerState.Ready );
		var totalControllers : int = (selecting.Length + ready.Length);
		
		var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		var width : float = (Screen.width * 0.90);
		var height : float = (Screen.height * 0.90);
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		// background
		GUI.DrawTexture( Rect( (halfScreenWidth - 250), (Screen.height - 393), 500, 393 ), backgroundImage );
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
			
			// information
			if( totalControllers == 1 ) {
				GUILayout.Box( 'Add another controller to continue!' );
			} else if( totalControllers > 0 ) {
				if( selecting.Length == 0 ) {
					if( onSameTeam( ready ) ) {
						GUILayout.Box( 'All players cannot be on the same team! A controller must change teams!' );
					} else {
						if (countdownStartTime == 0.0) countdownStartTime = Time.time;
						var seconds : int = (Mathf.CeilToInt( countDownSeconds - (Time.time - countdownStartTime) ) % 60);
						var second : int = Mathf.Max( seconds, 1 );
						
						if (second != previousSecond) GameManager.instance.audioPlay( second.ToString() );
						previousSecond = second;
						
						GUILayout.Box( 'Character select in ' + second );
						
						if (seconds == 0) GameManager.instance.loadScene( SceneEnum.CharacterSelect );
					}
				} else {
					countdownStartTime = 0.0;
					previousSecond = 0;
					GUILayout.Box( 'Waiting for ' + selecting.Length + ' controllers to press [Start] to ready up' );
				}
			} else {
				GUILayout.Box( 'No controllers added yet' );
			}
			
			GUILayout.Box( 'Press [Start] or [Back] to add or remove your controller' );
			
			// teams
			GUILayout.BeginVertical();
				
				for (var i = 0; i < ControllerTeam.Count; i++) displayTeam( i );
				
			GUILayout.EndVertical();
			
		GUILayout.EndArea();
	}
	
	// helper function to display a team
	private function displayTeam( team : ControllerTeam ) {
		GUILayout.BeginHorizontal();
					
			GUILayout.Box( team + '\nTeam', GUILayout.Width( 100 ) );
		
			for( var i = 0; i < ControllerEnum.Count; i++ ) {
				var text : String;
				
				switch( GameManager.instance.controllers[i].state ) {
					case ControllerState.TeamSelect:
						text = 'Press [Start] again...';
						break;
					case ControllerState.Ready:
						text = 'Ready!';
						break;
				}
				
				if (text && (GameManager.instance.controllers[i].team == team))
					GUILayout.Box( 'Controller ' + i + '\n' + text, GUILayout.Width( 200 ) );
			}
			
		GUILayout.EndHorizontal();
	}
	
	// utility function to check if all passed controllers are on the same team
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
}