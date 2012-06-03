
class DefaultScene extends SceneManager {
	private var countDownSeconds : int = 3;
	private var countdownStartTime : float;
	private var timeBetweenPM : float = 5.0;
	private var yOffsetPM : float = 10.0;
	private var lastSpawnTimePM : float;
	
	function SceneLoaded() {
		GameManager.instance.instantiateAvatars();
		
		Global.numIntrosPlaying = GameManager.instance.avatars.Length;
		
		countdownStartTime = Time.time;
		GameManager.instance.audioPlay( 'Countdown' );
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
		} else {
			if( (Time.time - lastSpawnTimePM) > timeBetweenPM ) {				
				var xPos : float = Random.Range( Global.sharedMinX, Global.sharedMaxX );
				var yPos : float = (Camera.main.transform.position.y + Camera.main.orthographicSize + yOffsetPM);
					
				Instantiate( GameManager.instance.powerModifyPrefab, Vector3( xPos, yPos, Global.sharedZ ), Quaternion.identity );
				
				lastSpawnTimePM = Time.time;
			}
		}
	}
	
	function OnGUI() {
		var halfScreenWidth : float = (Screen.width / 2.0);
		var halfScreenHeight : float = (Screen.height / 2.0);
		
		GUILayout.BeginArea( Rect( 20.0, 20.0, 120.0, (Screen.height - 40.0) ) );
			
			GUILayout.BeginVertical();
				
				for( var i = 0; i < ControllerTeam.Count; i++ ) {					
					var avatars : GameObject[] = GameManager.instance.getAvatarsOnTeam( i );
					
					if( avatars.Length > 0 ) {
						if (i != 0) GUILayout.Space( 20.0 );
						GUILayout.Box( 'Team ' + ControllerTeam.GetName( ControllerTeam, i ) );
						
						for( var avatar : GameObject in avatars ) {
							var component : Component = avatar.GetComponent( Avatar );
							var HPPM : String = ((component.health > 0.0) ? 'HP [' + parseInt( component.health ) + '] PM [0%]' : 'You are dead!' );
							GUILayout.Box( component.getName() + '\n(Controller ' + parseInt( component.getController() ) + ')\n' + HPPM );
						}
					}
				}
				
			GUILayout.EndVertical();
		
		GUILayout.EndArea();
		
		var width : float = (halfScreenWidth / 2.0);
		var height : float = width;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		if( Global.numIntrosPlaying > 0 ) {
			var seconds : int = ((Mathf.CeilToInt( countDownSeconds - (Time.time - countdownStartTime) ) % 60) - 1);
			if (seconds >= 0)
				GUI.DrawTexture( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ), 
					GameManager.instance.countdownTextures[seconds] );
		}
		
		if (!GameManager.instance.paused) return;
		
		width = 300.0;
		height = 200.0;
		halfWidth = (width / 2);
		halfHeight = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
		
			GUILayout.Box( 'Game Paused', GUILayout.Width( 150 ) );
			GUILayout.Box( 'Press "Start" to unpause the game.' );
			GUILayout.Box( 'Press "B" to return to Level Select.' );
			GUILayout.Box( 'Press "Back" to return to the Main Menu.' );
						
		GUILayout.EndArea();
	}
}