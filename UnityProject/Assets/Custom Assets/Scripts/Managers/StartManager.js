
private var countDownSeconds : int = 3;
private var startTime : float = 0.0;

function Update() {
	// loop through each controller to set state and team on button press
	for( var i = 0; i < ControllerEnum.Count; i++ ) {
		switch( true ) {
			case Global.isButtonDown( 'Start', i ):
				switch( GameManager.controllers[i].state ) {
					case ControllerState.SittingOut:
						GameManager.controllers[i].state = ControllerState.TeamSelect;
						break;
					case ControllerState.TeamSelect:
						GameManager.controllers[i].state = ControllerState.Ready;
						break;
				}
				break;
			case Global.isButtonDown( 'Back', i ):
				switch( GameManager.controllers[i].state ) {
					case ControllerState.Ready:
						GameManager.controllers[i].state = ControllerState.TeamSelect;
						break;
					default:
						GameManager.controllers[i].state = ControllerState.SittingOut;
						break;
				}
				break;
		}
		
		if( GameManager.controllers[i].state == ControllerState.TeamSelect ) {
			switch( true ) {
				case Global.isButtonDown( 'A', i ):
					GameManager.controllers[i].team = ControllerTeam.Green;
					break;
				case Global.isButtonDown( 'B', i ):
					GameManager.controllers[i].team = ControllerTeam.Red;
					break;
				case Global.isButtonDown( 'X', i ):
					GameManager.controllers[i].team = ControllerTeam.Blue;
					break;
				case Global.isButtonDown( 'Y', i ):
					GameManager.controllers[i].team = ControllerTeam.Orange;
					break;
			}
		}
	}
}

function OnGUI() {
	var halfScreenWidth : float = (Screen.width / 2);
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
		
		var selecting : ControllerEnum[] = GameManager.getControllerEnumsWithState( ControllerState.TeamSelect );
		var ready : ControllerEnum[] = GameManager.getControllerEnumsWithState( ControllerState.Ready );
		
		if( (selecting.Length + ready.Length) > 0 ) {
			if( selecting.Length == 0 ) {
				if (startTime == 0.0) startTime = Time.time;
				var seconds : int = (Mathf.CeilToInt( countDownSeconds - (Time.time - startTime) ) % 60);
				if (seconds == 1) Application.LoadLevel( 1 );
				GUILayout.Box( 'Character select in ' + seconds );
			} else {
				startTime = 0.0;
				GUILayout.Box( 'Waiting for ' + selecting.Length + ' controllers to press Start' );
			}
		} else {
			GUILayout.Box( 'No controllers added yet' );
		}
		
	GUILayout.EndArea();
}

function displayTeam( team : ControllerTeam ) {
	GUILayout.BeginVertical();
				
		GUILayout.Box( team + ' Team' );
	
		for( var i = 0; i < ControllerEnum.Count; i++ ) {
			var text : String;
			
			switch( GameManager.controllers[i].state ) {
				case ControllerState.TeamSelect:
					text = 'Press Start';
					break;
				case ControllerState.Ready:
					text = 'READY';
					break;
			}
			
			if (text && (GameManager.controllers[i].team == team))
				GUILayout.Box( 'Controller ' + i + '\n[' + text + ']' );
		}
		
	GUILayout.EndVertical();
}