
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
	public var jumpEffectPrefab : GameObject;
	public var healthBarTexture : Texture2D;
	public var powerGuageTexture : Texture2D;
	public var nearlyGroundedLayerMask : LayerMask = -1;
	public var avatarOnlyLayerMask : LayerMask = -1;
	public var soundsBoundByName : AudioClip[]; // no order necessary
	public var countdownTextures : Texture[];
	public var powerModifyPrefab : GameObject;
	public var defaultBackgroundPrefab : GameObject;
	public var customSkin : GUISkin;
	public var audioListenerVolume : float = 1.0;
	public var defaultAudioVolume : float = 1.0;
	
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
	
	private var _lastModifier : int;
	public function get lastModifier() : int { return _lastModifier; }
	public function set lastModifier( value : int ) { _lastModifier = value; }
	
	// private variables not accessible outside of this class
	private var audioSources : Hashtable;
	private var roundResults : ControllerTeam[];
	private var resetRounds : boolean = false;
	private var audioListener : AudioListener;
	
	// MAIN FUNCTIONS
	
	function Awake() {
		verifySingleton(); // verify singleton
		
		oneTimeSetup();
	}
	
	function OnApplicationQuit() {
		instance = null; // unset singleton
	}
	
	// this gets called when a new level is being loaded
	function OnDisable() {
		// do any necessary cleanup here
		audioUnbindAll();
		audioResetAll();
		
		if( resetRounds ) {
			Debug.Log( round + Time.time );
			round = 0; // set the round back to zero
			clearRoundResults();
			resetRounds = false;
		}
	}
	
	function Update() {
		audioListener.volume = audioListenerVolume;
		
		for (var asm : AudioSourceManaged in audioSources.Values) asm.Update();
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
			GameManager.instance.audioBind( clip.name, clip, true );
			
		// setup round results
		roundResults = new ControllerTeam[3]; // there are at most 3 rounds
		clearRoundResults();
		
		audioListener = Camera.main.GetComponent( AudioListener );
	}
	
	private function clearRoundResults() {
		// set to a "nothing" value
		roundResults[0] = roundResults[1] = roundResults[2] = ControllerTeam.Count;
	}
	
	// PUBLIC FUNCTIONS
	
	public function destroyAllOfType( type ) {
		var objects : GameObject[] = GameObject.FindObjectsOfType( typeof( type ) );
		for (var object : GameObject in objects) Destroy( object );
	}
	
	// this function gets called at the start of every scene by SceneManager
	public function updateReadyControllers() {
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
		
		audioPauseAll( paused );
	}
	
	// utility function for loading rounds
	public function nextRoundOrScoreboard() {	
		// set last living team as winner
		var aliveTeamEnums : ControllerTeam[] = GameManager.instance.getAliveControllerTeamEnums();
		roundResults[round] = aliveTeamEnums[0];
		
		// if last round or same team won first two in a row
		if( (round == 2) || (roundResults[0] == roundResults[1]) ) {
			loadScene( SceneEnum.Scoreboard ); // end
		} else {
			round++; // continue to the next round
			loadLevel( level ); // reload the level
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
	
	// utility function for loading levels
	public function loadLevel( id : LevelEnum, reset : boolean ) {
		resetRounds = reset; // this is done later to avoid scoreboard freakout
		
		// SceneEnum.Count is used to offset LevelEnum
		loadScene( parseInt( SceneEnum.Count ) + parseInt( id ) );
	}
	public function loadLevel( id : LevelEnum ) {
		loadLevel( id, false );
	}
	
	// utility function for loading scenes
	public function loadScene( id : SceneEnum ) {		
		Application.LoadLevel( parseInt( id ) );
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
	
	// utility function to get avatars not on a specific team
	public function getAvatarsOnOtherTeams( team : ControllerTeam ) : GameObject[] {
		var avatarArray : Array = new Array();
		
		for( var avatar : GameObject in avatars ) {
			if (avatar.GetComponent( Avatar ).getTeam() != team)
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
		
		return audioIsPlaying( 'Countdown' );
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
	
	// utility function for ignoring collision with passed team
	public function ignoreCollisionsWithTeam( colPassed : Collider, team : ControllerTeam ) {
		var avatars : GameObject[] = getAvatarsOnTeam( team );
		
		for( var avatar : GameObject in avatars ) {
			var colAvatar : Collider = avatar.GetComponent( CharacterController ).GetComponent( Collider );
			
			Physics.IgnoreCollision( colPassed, colAvatar );
		}
	}
	
	// utility function for setting the background music
	public function audioFadeInAndLoop( uid, clip : AudioClip, volume : float, fade : boolean) {
		var a : AudioSourceManaged = audioBind( uid, clip );
		audioPlay( uid, fade, true, volume ); // force if fading in
		if( fade ) {
			a.SetVolume( 0.0 );
			audioFadeToVolume( uid, volume, 30.0 );
		}
	}
	
	// utility function for binding audio
	public function audioBind( uid, clip : AudioClip, doNotDestroy : boolean ) : AudioSourceManaged {
		if( audioSources == null ) {
			Debug.LogWarning( 'GameManager was asked to bind ' + clip.name + ' before audioSources was newed.' );
			return;
		}
		
		var a : AudioSourceManaged;
		
		if( !audioSources.ContainsKey( uid ) ) {
			a = new AudioSourceManaged( gameObject.AddComponent( AudioSource ) );
			audioSources.Add( uid, a );
		} else {
			a = audioSources[uid];
		}
		
		a.audioSource.playOnAwake = false;
		a.audioSource.clip = clip;
		a.doNotDestroy = doNotDestroy;
		
		return a;
	}
	public function audioBind( uid, clip : AudioClip ) : AudioSourceManaged {
		return audioBind( uid, clip, false );
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
	
	public function audioGetSource( uid ) : AudioSourceManaged {
		if (audioSources.ContainsKey( uid ))
			return audioSources[uid];
		else
			Debug.LogWarning( 'Unable to get audio source using id ' + uid + '.' );
	}
	
	// utility function for unbinding audio
	public function audioUnbind( uid ) {
		if( audioStop( uid ) && !audioSources[uid].doNotDestroy ) {
			Destroy( audioSources[uid].audioSource );
			audioSources.Remove( uid );
		}
	}
	
	// utility function for unbinding all temporary audio
	public function audioUnbindAll() {
		var audioSourcesClone : Hashtable = audioSources.Clone();
		for (var key in audioSourcesClone.Keys) audioUnbind( key );
	}
	
	// utility function for playing audio
	public function audioPlay( uid, force : boolean, loop : boolean, volume : float, pitch : float ) : AudioSourceManaged {
		if (audioSources.ContainsKey( uid ))
			audioSources[uid].Play( force, loop, volume, pitch );
		else
			Debug.LogWarning( 'GameManager was asked to play ' + uid + ' but that ID has not been bound.' );
		
		return audioSources[uid];
	}
	public function audioPlay( uid, force : boolean, loop : boolean, volume : float ) : AudioSourceManaged {
		return audioPlay( uid, force, loop, volume, 1.0 );
	}
	public function audioPlay( uid, force : boolean, loop : boolean ) : AudioSourceManaged {
		return audioPlay( uid, force, loop, defaultAudioVolume );
	}
	public function audioPlay( uid, force : boolean ) : AudioSourceManaged {
		return audioPlay( uid, force, false );
	}
	public function audioPlay( uid ) : AudioSourceManaged {
		return audioPlay( uid, false );
	}
	
	public function audioIsPlaying( uid ) : boolean {
		if (audioSources.ContainsKey( uid ) && audioSources[uid].IsPlaying() ) return true;
		
		return false;
	}
	
	// utility function for fading audio from current to target pitch
	public function audioFadeToPitch( uid, target : float, duration : float ) {
		var a : AudioSourceManaged = audioGetSource( uid );
		a.targetPitch = target;
		a.pitchDuration = duration;
	}
	
	// utility function for fading all audio from current to target pitch
	public function audioFadeAllToPitch( targetPitch : float, duration : float ) {
		for (var key in audioSources.Keys) audioFadeToPitch( key, targetPitch, duration );
	}
	
	// utility function for fading audio from current to target volume
	public function audioFadeToVolume( uid, target : float, duration : float ) {
		var a : AudioSourceManaged = audioGetSource( uid );
		a.targetVolume = target;
		a.volumeDuration = duration;
	}
	
	// utility function for pausing or unpausing audio
	public function audioPause( uid, bool : boolean ) {
		audioSources[uid].Pause( bool );
	}
	
	// utility function for pausing or unpausing all audio
	public function audioPauseAll( bool : boolean ) {
		for (var key in audioSources.Keys) audioPause( key, bool );
	}
	
	// utility function to stop specific audio fading
	public function audioResetPitch( uid ) {
		audioSources[uid].ResetPitch();
	}
	public function audioResetVolume( uid ) {
		audioSources[uid].ResetVolume();
	}
	public function audioReset( uid ) {
		audioSources[uid].Reset();
	}
	// utility function to stop all audio fading
	public function audioResetAllPitch() {
		for (var key in audioSources.Keys) audioSources[key].ResetPitch();
	}
	public function audioResetAllVolume() {
		for (var key in audioSources.Keys) audioSources[key].ResetVolume();
	}
	public function audioResetAll() {
		for (var key in audioSources.Keys) audioSources[key].Reset();
	}
	
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