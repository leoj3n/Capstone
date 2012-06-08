
class DefaultScene extends SceneManager {
	public var ambientNoise : AudioClip;
	public var ambientNoiseVolume : float;

	private var countDownSeconds : int = 3;
	private var countdownStartTime : float = 0.0;
	private var timeBetweenPM : float = 10.0;
	private var yOffsetPM : float = 10.0;
	private var lastSpawnTimePM : float;
	private var initial : boolean = true;
	private var aliveTeamEnums : ControllerTeam[];
	private var playedOnce : boolean = false;
	
	function SceneLoaded() {
		GameManager.instance.instantiateAvatars();
		GameManager.instance.setupTeamPhysics();
		
		GameManager.instance.audioFadeInAndLoop( 'ambientNoise', ambientNoise, ambientNoiseVolume, fadeInBackgroundMusic );
	}
	
	function Update() {
		aliveTeamEnums = GameManager.instance.getAliveControllerTeamEnums();
		
		if (Global.isButtonDown( 'Start', GameManager.instance.readyControllers ))
			GameManager.instance.togglePause();
		
		if( GameManager.instance.paused ) {
			switch( true ) {
				case Global.isButtonDown( 'B', GameManager.instance.readyControllers ):
					GameManager.instance.togglePause();
					GameManager.instance.loadScene( SceneEnum.LevelSelect );
					break;
				case Global.isButtonDown( 'Back', GameManager.instance.readyControllers ):
					GameManager.instance.togglePause();
					GameManager.instance.loadScene( SceneEnum.Start );
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
			if( aliveTeamEnums.Length == 1 ) { // only 1 team still alive
				if( initial ) {
					// play victory for all avatars on this team
					var avatars : GameObject[] = GameManager.instance.getAvatarsOnTeam( aliveTeamEnums[0] );
					for (var avatar : GameObject in avatars) avatar.GetComponent( Avatar ).playCutScene( CutScene.Victory );
					
					// fade out the background music
					GameManager.instance.audioFadeToVolume( 'backgroundMusic', 0.1, 6.0 );
					
					initial = false;
				} else if( !GameManager.instance.cutScenePlaying() ) {
					// progress to next round (or scoreboard) if cutscenes finished

					GameManager.instance.nextRoundOrScoreboard();
				}
			}
		}
	}
	
	function OnGUI() {
		if (!GameManager.instance) return;
		
		GUI.skin = GameManager.instance.customSkin;
		
		var halfScreenWidth : float = (Screen.width / 2.0);
		var halfScreenHeight : float = (Screen.height / 2.0);
		
		// game paused
		 
		if( GameManager.instance.paused ) {
			var width : float = 300.0;
			var height : float = 200.0;
			var halfWidth : float = (width / 2);
			var halfHeight : float = (height / 2);
			
			GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ) );
			
				GUILayout.Box( 'Game Paused', GUILayout.Width( 150 ) );
				GUILayout.Box( 'Press [Start] to unpause the game.' );
				GUILayout.Box( 'Press [B] to return to Level Select.' );
				GUILayout.Box( 'Press [Back] to return to the Main Menu.' );
							
			GUILayout.EndArea();
			
			return;
		}
		
		// controller HUD
		
		GUI.Box( Rect( (halfScreenWidth - 50.0), 20.0, 100.0, 22.0 ), 
			((GameManager.instance.round == 2) ? 'Final Round' : ('Round ' + (GameManager.instance.round + 1))) );
		
		GUILayout.BeginArea( Rect( 20.0, (Screen.height * 0.05), 140.0, (Screen.height * 0.90) ) );
			
			GUILayout.BeginVertical();
				
				for( var i = 0; i < ControllerTeam.Count; i++ ) {					
					var avatars : GameObject[] = GameManager.instance.getAvatarsOnTeam( i );
					
					if( avatars.Length > 0 ) {
						var teamWonLost : String;
						var playerWonLost : String;
						if( aliveTeamEnums.Length == 1 ) {
							if( i == aliveTeamEnums[0] ) {
								teamWonLost = ' wins!';
								playerWonLost = 'You won the round!';
							} else {
								playerWonLost = 'You lost.';
							}
						}
					
						if (i != 0) GUILayout.Space( 20.0 );
						GUILayout.Box( ControllerTeam.GetName( ControllerTeam, i ) + ' Team' + teamWonLost );
						
						for( var avatar : GameObject in avatars ) {
							var component : Avatar = avatar.GetComponent( Avatar );
							
							var HPPM : String = (component.isAlive() ? ('HP [' + parseInt( Mathf.Max( component.getHealth(), 1.0 ) ) + '] Power [' + 
								parseInt( component.getPower() ) + ']') : 'You are dead!');
							
							GUILayout.Box( 'Controller ' + parseInt( component.getController() ) + '\n' + component.getName() + '\n' + 
								(playerWonLost ? playerWonLost : HPPM ) ); // win/loss message or health/power
						}
					}
				}
				
			GUILayout.EndVertical();
		
		GUILayout.EndArea();
		
		// 3-2-1
		
		width = (halfScreenWidth / 2.0);
		height = width;
		halfWidth = (width / 2);
		halfHeight = (height / 2);
		
		if( GameManager.instance.cutScenePlaying() ) {
			if( !playedOnce ) {
				GameManager.instance.audioPlay( 'Round' + (GameManager.instance.round + 1) );
				playedOnce = true;
			}
			
			if( !GameManager.instance.audioIsPlaying( 'Round1' ) && 
				!GameManager.instance.audioIsPlaying( 'Round2' ) &&
				!GameManager.instance.audioIsPlaying( 'Round3' ) ) {
				
				if( !countdownStartTime ) {
					countdownStartTime = Time.time;
					GameManager.instance.audioPlay( 'Countdown' );
				}
				
				var seconds : int = ((Mathf.CeilToInt( countDownSeconds - (Time.time - countdownStartTime) ) % 60) - 1);
				if (seconds >= 0)
					GUI.DrawTexture( Rect( (halfScreenWidth - halfWidth), (halfScreenHeight - halfHeight), width, height ), 
						GameManager.instance.countdownTextures[seconds] );
			}
		}
	}
}