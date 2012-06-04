
class DefaultScene extends SceneManager {
	private var countDownSeconds : int = 3;
	private var countdownStartTime : float;
	private var timeBetweenPM : float = 10.0;
	private var yOffsetPM : float = 10.0;
	private var lastSpawnTimePM : float;
	private var initial : boolean = true;
	
	function SceneLoaded() {
		GameManager.instance.instantiateAvatars();
		GameManager.instance.setupTeamPhysics();
		
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
			// instantiate power modifies
			if( (Time.timeSinceLevelLoad - lastSpawnTimePM) > timeBetweenPM ) {				
				var xPos : float = Random.Range( Global.sharedMinX, Global.sharedMaxX );
				var yPos : float = (Camera.main.transform.position.y + Camera.main.orthographicSize + yOffsetPM);
					
				Instantiate( GameManager.instance.powerModifyPrefab, Vector3( xPos, yPos, Global.sharedZ ), Quaternion.identity );
				
				lastSpawnTimePM = Time.timeSinceLevelLoad;
			}
			
			// do the rounds
			var aliveTeamEnums : ControllerTeam[] = GameManager.instance.getAliveControllerTeamEnums();
			if( aliveTeamEnums.Length == 1 ) { // only 1 team still alive
				if( initial ) {
					var avatars : GameObject[] = GameManager.instance.getAvatarsOnTeam( aliveTeamEnums[0] );
					
					// play victory for all avatars on this team
					for( var avatar : GameObject in avatars ) {
						avatar.GetComponent( Avatar ).playCutScene( CutScene.Victory );
					}
					
					initial = false;
				} else if( !GameManager.instance.cutScenePlaying() ) {
					// progress to next round if cutscenes finished
					GameManager.instance.nextRoundOrScoreboard();
				}
			}
		}
	}
	
	function OnGUI() {
		GUI.skin = GameManager.instance.customSkin;
		
		var halfScreenWidth : float = (Screen.width / 2.0);
		var halfScreenHeight : float = (Screen.height / 2.0);
		
		GUI.Box( Rect( (halfScreenWidth - 50.0), 20.0, 100.0, 22.0 ), 
			((GameManager.instance.round == 2) ? 'Final Round' : ('Round ' + (GameManager.instance.round + 1))) );
		
		GUILayout.BeginArea( Rect( 20.0, (Screen.height * 0.05), 140.0, (Screen.height * 0.90) ) );
			
			GUILayout.BeginVertical();
				
				for( var i = 0; i < ControllerTeam.Count; i++ ) {					
					var avatars : GameObject[] = GameManager.instance.getAvatarsOnTeam( i );
					
					if( avatars.Length > 0 ) {
						if (i != 0) GUILayout.Space( 20.0 );
						GUILayout.Box( ControllerTeam.GetName( ControllerTeam, i ) + ' Team' );
						
						for( var avatar : GameObject in avatars ) {
							var component : Avatar = avatar.GetComponent( Avatar );
							var HPPM : String = ((component.isAlive()) ? 'HP [' + parseInt( Mathf.Max( component.getHealth(), 1.0 ) ) + '] PM [0%]' : 'You are dead!' );
							GUILayout.Box( 'Controller ' + parseInt( component.getController() ) + '\n' + component.getName() + '\n' + HPPM );
						}
					}
				}
				
			GUILayout.EndVertical();
		
		GUILayout.EndArea();
		
		// character labels
		
		/*for( var avatar : GameObject in GameManager.instance.avatars ) {
			var componentA : Avatar = avatar.GetComponent( Avatar );
			var txt : String = ('Controller ' + parseInt( componentA.getController() ) + '\n(' + componentA.getTeam().ToString() + ' Team)');
			characterLabel( componentA.getCenterInWorld(), ((componentA.getScaledHeight() / 2.0) + 1.5), txt );
		}*/
		
		for( var avatar : GameObject in GameManager.instance.avatars ) {
			component = avatar.GetComponent( Avatar );
			var point = Camera.main.WorldToScreenPoint( component.getCenterInWorld() + Vector2( 0.0, (component.getScaledHeight() * 0.80) ) );
			var rect : Rect = Rect( (point.x - 30.0), (Screen.height - point.y), 100.0, 60.0 );
			GUI.Label( rect, ('Controller ' + parseInt( component.getController() )) );
		}
		
		// 3-2-1
		
		var width : float = (halfScreenWidth / 2.0);
		var height : float = width;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		if( GameManager.instance.cutScenePlaying() ) {
			var seconds : int = ((Mathf.CeilToInt( countDownSeconds - (Time.time - countdownStartTime) ) % 60) - 1);
			if (seconds >= 0)
				GUI.DrawTexture( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ), 
					GameManager.instance.countdownTextures[seconds] );
		}
		
		// game paused
		 
		if (!GameManager.instance.paused) return;
		
		width = 300.0;
		height = 200.0;
		halfWidth = (width / 2);
		halfHeight = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
		
			GUILayout.Box( 'Game Paused', GUILayout.Width( 150 ) );
			GUILayout.Box( 'Press [Start] to unpause the game.' );
			GUILayout.Box( 'Press [B] to return to Level Select.' );
			GUILayout.Box( 'Press [Back] to return to the Main Menu.' );
						
		GUILayout.EndArea();
	}
	
	// utility function to make character labels
	function characterLabel( worldPoint : Vector3, yOffset : float, text : String ) {
		var point = Camera.main.WorldToScreenPoint( worldPoint + Vector2( 0, yOffset ) );
		var rect : Rect = Rect( (point.x - 30.0), (Screen.height - point.y), 100.0, 60.0 );
		GUI.Label( rect, text );
	}
}