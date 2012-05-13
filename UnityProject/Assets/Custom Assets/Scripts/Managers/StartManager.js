
private var countDownSeconds : int = 5;
private var startTime : float = 0.0;

function Update() {	
	for( var i = 0; i < ControllerID.Count; i++ ) {
		switch( true ) {
			case Global.isButtonDown( 'Start', i ):
				if (GameManager.controllers[i].active)
					GameManager.controllers[i].ready = true;
				else
					GameManager.controllers[i].active = true;
				break;
			case Global.isButtonDown( 'Back', i ):
				if (GameManager.controllers[i].ready)
					GameManager.controllers[i].ready = false;
				else
					GameManager.controllers[i].active = false;
				break;
		}
		
		if( GameManager.controllers[i].active && !GameManager.controllers[i].ready ) {
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
		
		var activeCount : int = 0;
		var readyCount : int = 0;
		for( i = 0; i < ControllerID.Count; i++ ) {
			if (GameManager.controllers[i].active) activeCount++;
			if (GameManager.controllers[i].ready) readyCount++;
		}
		
		if( activeCount > 0 ) {
			if( activeCount == readyCount ) {
				if (startTime == 0.0) startTime = Time.time;
				var seconds : int = (Mathf.CeilToInt( countDownSeconds - (Time.time - startTime) ) % 60);
				if (seconds == 1) Application.LoadLevel( 1 );
				GUILayout.Box( 'Character select in ' + seconds );
			} else {
				startTime = 0.0;
				GUILayout.Box( 'Waiting for ' + (activeCount - readyCount) + ' players to press Start' );
			}
		} else {
			GUILayout.Box( 'No controllers added yet' );
		}
		
	GUILayout.EndArea();
}

function displayTeam( team : ControllerTeam ) {
	GUILayout.BeginVertical();
				
		GUILayout.Box( team + ' Team' );
	
		for( var i = 0; i < ControllerID.Count; i++ ) {
			if ((GameManager.controllers[i].team == team) && GameManager.controllers[i].active)
				GUILayout.Box( 'Controller ' + i + '\n[' + (GameManager.controllers[i].ready ? 'READY' : 'Press Start') + ']' );
		}
		
	GUILayout.EndVertical();
}