
 // GameManager is a singleton.
 // To avoid having to manually link an instance to every class that needs it, it has a static variable called
 // instance, so other objects that need to access it can just call:
 // 	GameManager.instance.DoSomeThing(); or GameManager.instance.myVal;

class GameManager extends MonoBehaviour {
	// the only static variable, points to singleton
	public static var instance : GameManager;
	
	// variables available in the inspector (accessible via GameManager.instance.(variable))
	public var characterPrefabs : GameObject[];
	public var expectedOrder : CharacterEnum; // just to expose the expected order in the Inspector
	public var soundsBoundByName : AudioClip[]; // no order necessary
	public var nearlyGroundedLayerMask : LayerMask = -1;
	public var avatarOnlyLayerMask : LayerMask = -1;
	public var countdownTextures : Texture[];
	public var powerModifyPrefab : GameObject;
	public var audioListenerVolume : float = 1.0;
	public var defaultAudioVolume : float = 1.0;
	public var customSkin : GUISkin;
	
	// non-inspector variables still accessible via GameManager.instance.(variable)
	private var _paused : boolean = false;
	public function get paused() : boolean { return _paused; }
	private function set paused( value : boolean ) { _paused = value; }
	
	private var _controllers : Controller[];
	public function get controllers() : Controller[] { return _controllers; }
	private function set controllers( value : Controller[] ) { _controllers = value; }
	
	private var _readyControllers : ControllerEnum[];
	public function get readyControllers() : ControllerEnum[] { return _readyControllers; }
	private function set readyControllers( value : ControllerEnum[] ) { _readyControllers = value; }
	
	// variables geared towards levels (instead of scenes in general)
	private var _level : LevelEnum;
	public function get level() : LevelEnum { return _level; }
	public function set level( value : LevelEnum ) { _level = value; }
	
	private var _round : int = 0;
	public function get round() : int { return _round; }
	private function set round( value : int ) { _round = value; }
	
	private var _avatars : GameObject[];
	public function get avatars() : GameObject[] { return _avatars; }
	private function set avatars( value : GameObject[] ) { _avatars = value; }
	
	private var _lastModifier : ModifierEnum;
	public function get lastModifier() : ModifierEnum { return _lastModifier; }
	public function set lastModifier( value : ModifierEnum ) { _lastModifier = value; }
	
	// private variables not accessible outside of this class
	private var audioSources : Hashtable;
	private var roundResults : ControllerTeam[];
	private var resetRound : boolean = false;
	private var audioListener : AudioListener;
	
	// MAIN FUNCTIONS
	
	function Awake() {
		verifySingleton(); // verify singleton
		
		oneTimeSetup();
	}
	
	function OnApplicationQuit() {
		instance = null; // unset singleton
	}
	
	function OnLevelWasLoaded( level : int ) {
		if( resetRound ) {
			round = 0; // set the round back to zero
			nullifyRoundResults();
			resetRound = false;
		}
	}
	
	function Update() {
		audioListener.volume = audioListenerVolume;
	}
	
	// PRIVATE FUNCTIONS
	
	private function verifySingleton() {
		if( instance == null ) {
			instance = this;
			DontDestroyOnLoad( gameObject );
		} else if (instance != this) {
			DestroyImmediate( gameObject );
			return false;
		}
		
		return true;
	}
	
	private function oneTimeSetup() {
		// ControllerEnum is used to build the controllers array
		controllers = new Controller[ControllerEnum.Count];
		for (var i = 0; i < ControllerEnum.Count; i++)
			controllers[i] = new Controller();
		
		// setup by-name audio
		audioSources = new Hashtable();
		for (var clip : AudioClip in soundsBoundByName)
			GameManager.instance.audioBind( clip.name, clip );
			
		// setup round results
		roundResults = new ControllerTeam[3]; // there are at most 3 rounds
		nullifyRoundResults();
		
		audioListener = Camera.main.GetComponent( AudioListener );
	}
	
	function nullifyRoundResults() {
		// set to nothing value
		roundResults[0] = roundResults[1] = roundResults[2] = ControllerTeam.Count;
	}
	
	// PUBLIC FUNCTIONS
	
	// this function gets called at the start of every scene by SceneManager
	function updateReadyControllers() {
		readyControllers = getControllerEnumsWithState( ControllerState.Ready );
	}
	
	// utility function for toggling the pause state of the game
	public function togglePause() {
		if( paused ) {
			Time.timeScale = 1.0;
			paused = false;
		} else {
			Time.timeScale = 0.0;
			paused = true;
		}
	}
	
	// utility function for loading rounds
	public function nextRoundOrScoreboard() {
		var aliveTeamEnums : ControllerTeam[] = GameManager.instance.getAliveControllerTeamEnums();
		roundResults[round] = aliveTeamEnums[0]; // set last living team as winner
		
		// if last round or same team won first two in a row
		if( (round == 2) || (roundResults[0] == roundResults[1]) ) {
			Application.LoadLevel( SceneEnum.Scoreboard ); // end
		} else {
			round++; // continue to the next round
			Application.LoadLevel( Application.loadedLevel ); // reload the level
		}
	}
	
	// utility function to get the currently winning team or teams if tied
	public function getWinningTeamOrTeams() : ControllerTeam[] {
		var teamArray : Array = new Array();
		
		switch( round ) {
			case 0:
				Debug.LogWarning( 'Nobody has won yet. Cannot return winning teams.' );
				break;
			case 1:
				if( roundResults[0] == roundResults[1] ) {
					teamArray.Push( roundResults[0] );
				} else { // 2-way tie
					 teamArray.Push( roundResults[0] );
					 teamArray.Push( roundResults[1] );
				}
				break;
			case 2:
				if( (roundResults[0] == roundResults[1]) && (roundResults[0] == roundResults[2]) ) {
					teamArray.Push( roundResults[0] );
				} else if( roundResults[0] == roundResults[1] ) {
					 teamArray.Push( roundResults[0] );
				} else if( roundResults[1] == roundResults[2] ) {
					 teamArray.Push( roundResults[1] );
				} else { // 3-way tie
					teamArray.Push( roundResults[0] );
					teamArray.Push( roundResults[1] );
					teamArray.Push( roundResults[2] );
				}
				break;
		}
		
		return teamArray.ToBuiltin( ControllerTeam );
	}
	
	// utility function for loading levels that need to have rounds
	public function loadLevel( id : LevelEnum) {
		// SceneEnum.Count is used to offset LevelEnum
		Application.LoadLevel( parseInt( SceneEnum.Count ) + id );
		
		resetRound = true;
	}
	
	// utility function for instantiating avatars
	public function instantiateAvatars() {
		avatars = new GameObject[readyControllers.Length];
		
		for( var i = 0; i < avatars.Length; i++ ) {
			var ce : ControllerEnum = readyControllers[i];
			
			var avatar : GameObject = GameObject.Instantiate( 
				characterPrefabs[controllers[ce].character], Vector3( (-5.0 + (10.0 * i)), 4.0, 0.0 ), Quaternion.identity );
			
			Global.bindAvatarToController( avatar, ce ); // set a reference to the Controller in Avatar
			avatar.GetComponent( Avatar ).playCutScene( CutScene.Intro ); // assume intro should be played for now
			
			avatars[i] = avatar;
		}
	}
	
	// utility function to get avatars on a specific team
	public function getAvatarsOnTeam( team : ControllerTeam ) : GameObject[] {
		var avatarArray : Array = new Array();
		
		for( var avatar : GameObject in avatars ) {
			if (avatar.GetComponent( Avatar ).getTeam() == team)
				avatarArray.Push( avatar );
		}
		
		return avatarArray.ToBuiltin( GameObject );
	}
	
	// utility function to get alive controller team enums
	public function getAliveControllerTeamEnums() : ControllerTeam[] {
		var teamArray : Array = new Array();
		
		for( var i = 0; i < ControllerTeam.Count; i++ ) {
			var avatars : GameObject[] = getAvatarsOnTeam( i );
			
			for( var avatar : GameObject in avatars ) {
				if (!avatar.GetComponent( Avatar ).isAlive()) continue;
				
				teamArray.Push( i ); // push if someone is alive
				break; // only need to add a team once
			}
		}
		
		return teamArray.ToBuiltin( ControllerTeam );
	}
	
	// utility function to check if a cutscene is playing
	public function cutScenePlaying() : boolean {
		// loop through avatars and see if any are playing a cutscene
		for( var avatar : GameObject in avatars ) {
			if (avatar.GetComponent( Avatar ).isPlayingCutScene()) return true;
		}
		
		return false;
	}
	
	// utility function to ignore collisions between characters on the same team
	public function setupTeamPhysics() {
		for( var i = 0; i < ControllerTeam.Count; i++ ) {
			var avatars : GameObject[] = getAvatarsOnTeam( i );
			
			for( var avatar1 : GameObject in avatars ) {
				var collider1 : Collider = avatar1.GetComponent( CharacterController ).GetComponent( Collider );
				
				for( var avatar2 : GameObject in avatars ) {
					if (avatar1 == avatar2) continue; // do not ignore collisions with self
					
					var collider2 : Collider = avatar2.GetComponent( CharacterController ).GetComponent( Collider );
					
					Physics.IgnoreCollision( collider1, collider2 );
				}
			}
		}
	}
	
	// utility function for setting the background music
	function setBackgroundMusic( clip : AudioClip, volume : float, fade : boolean) {
		audioBind( 'backgroundMusic', clip );
		var a : AudioSource = audioPlay( 'backgroundMusic', fade, true, volume ); // force if fading in
		if( fade ) {
			a.volume = 0.0;
			audioFadeToVolume( a, volume, 3.0 );
		}
	}
	
	// utility function for binding audio
	public function audioBind( uid, clip : AudioClip ) {
		var a : AudioSource;
		
		if (audioSources == null) Debug.LogWarning( 'GameManager was asked to bind ' + clip.name + ' before audioSources was newed.' );
		
		if( !audioSources.ContainsKey( uid ) ) {
			a = gameObject.AddComponent( AudioSource );
			audioSources.Add( uid, a );
		} else {
			a = audioSources[uid];
		}
		
		a.playOnAwake = false;
		a.clip = clip;
	}
	
	// utility function for stopping all audio except background
	public function audioStopAll() {
		for( var key in audioSources.Keys ) {
			if (key == 'backgroundMusic') continue; // do not stop background music
			
			audioStop( key );
		}
	}
	
	// utility function for stopping audio
	public function audioStop( uid ) : boolean {		
		if( audioSources.ContainsKey( uid ) ) {
			audioSources[uid].Stop();
			return true;
		}
		
		Debug.LogWarning( 'GameManager was asked to stop ' + uid + ' but that ID is not bound.' );
		return false; // audio source not in the hashtable
	}
	
	// utility function for unbinding audio
	public function audioUnbind( uid ) {		
		if (audioStop( uid )) audioSources.Remove( uid );
	}
	
	// utility function for playing audio
	public function audioPlay( uid, force : boolean, loop : boolean, volume : float ) : AudioSource {
		var a : AudioSource;
		
		if( audioSources.ContainsKey( uid ) ) {
			a = audioSources[uid];
			
			if( !a.isPlaying || force ) {
				a.loop = loop;
				a.volume = volume;
				a.Play();
			}
		} else {
			Debug.LogWarning( 'GameManager was asked to play ' + uid + ' but that ID has not been bound.' );
		}
		
		return a;
	}
	public function audioPlay( uid, force : boolean, loop : boolean ) : AudioSource {
		return audioPlay( uid, force, loop, defaultAudioVolume );
	}
	public function audioPlay( uid, force : boolean ) : AudioSource {
		return audioPlay( uid, force, false );
	}
	public function audioPlay( uid ) : AudioSource {
		return audioPlay( uid, false );
	}
	
	public function audioIsPlaying( uid ) : boolean {
		if (audioSources.ContainsKey( uid ) && audioSources[uid].isPlaying ) return true;
		
		return false;
	}
	
	// utility function for fading audio from current pitch to target pitch
	public function audioFadeToPitch( a : AudioSource, targetPitch : float, duration : float ) {
		while( a.pitch != targetPitch ) {
			a.pitch = Mathf.MoveTowards( a.pitch, targetPitch, (Time.time / duration) );
			yield;
		}
	}
	
	// utility function for fading audio to target volume
	public function audioFadeToVolume( a : AudioSource, targetVolume : float, duration : float ) {
		while( a.volume != targetVolume ) {
			a.volume = Mathf.MoveTowards( a.volume, targetVolume, (Time.deltaTime / duration) );
			yield;
		}
	}
	
	// utility function for fading out audio
	/*public function audioFadeOut( a : AudioSource, duration : float, delay : float ) {
		var endTime : float = (Time.time + (a.clip.length - a.time));
		var startTime : float = (endTime - duration);
		var origVolume : float = a.volume;
		
		// delay can only be used for looping audio
		if( a.loop ) {
			endTime = (delay + Time.time + duration);
			startTime = (delay + Time.time);
		} else if( delay > 0.0 ) {
			Debug.LogWarning( 'Cannot delay fading out of non-looping audio. Delay will be ingored.' );
		}
		
		while( Time.time < endTime ) {
			if (Time.time > startTime)
				a.volume = (origVolume * (1.0 - ((Time.time - startTime) / duration)));
			yield;
		}
	}
	public function audioFadeOut( a : AudioSource, duration : float ) {
		audioFadeOut( a, duration, 0 );
	}*/
	
	// utility function for returning an array of ControllerEnum(s) with the passed state
	public function getControllerEnumsWithState( state : ControllerState ) : ControllerEnum[] {
		enumArray = new Array();
		
		for( i = 0; i < ControllerEnum.Count; i++ ) {
			if (controllers[i].state == state) enumArray.Push( i );
		}
		
		return enumArray.ToBuiltin( ControllerEnum );
	}
	
	// utility function for returning an array of ControllerEnum(s) on passed team
	public function getControllerEnumsOnTeam( team : ControllerTeam ) : ControllerEnum[] {
		enumArray = new Array();
		
		for( i = 0; i < ControllerEnum.Count; i++ ) {
			if ((controllers[i].state == ControllerState.Ready) && (controllers[i].team == team))
				enumArray.Push( i );
		}
		
		return enumArray.ToBuiltin( ControllerEnum );
	}
	
	// demonstrates how controllers can be accessed via enum
	// the same as GameManager.instance.controllers[ControllerEnum]
	public function getController( ce : ControllerEnum ) : Controller {
		return controllers[ce];
	}
}