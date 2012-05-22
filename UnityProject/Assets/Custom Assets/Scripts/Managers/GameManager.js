
 // GameManager is a singleton.
 // To avoid having to manually link an instance to every class that needs it, it has a static variable called
 // instance, so other objects that need to access it can just call:
 // 	GameManager.instance.DoSomeThing(); or GameManager.instance.myVal;

class GameManager extends MonoBehaviour {
	// the only static variable, points to singleton
	public static var instance : GameManager;
	
	// variables available in the inspector (accessible via GameManager.instance)
	public var backgroundMusic : AudioClip[];
	public var backgroundMusicVolume : float = 0.60;
	public var characterPrefabs : GameObject[];
	public var expectedOrder : CharacterEnum; // just to expose the expected order in the Inspector
	public var selectTimeout : float = 1.0;
	public var countDownSeconds : int = 3;
	public var selectHudPrefab : GameObject;
	public var chooseYourFighter : AudioClip;
	public var swoosh : AudioClip;
	public var sceneManagers : MonoScript[];
	public var defaultSceneManager : MonoScript;
	public var levelsTexture : Texture2D;
	public var levelsAtlas : TextAsset;
	public var levelHudPrefab : GameObject;
	
	// private variables (accessible via GameManager.instance)
	private var _controllers : Controller[];
	public function get controllers() : Controller[] { return _controllers; }
	private function set controllers( value : Controller[] ) { _controllers = value; }
	
	private var _avatars : GameObject[];
	public function get avatars() : GameObject[] { return _avatars; }
	private function set avatars( value : GameObject[] ) { _avatars = value; }
	
	private var _readyControllers : ControllerEnum[];
	public function get readyControllers() : ControllerEnum[] { return _readyControllers; }
	private function set readyControllers( value : ControllerEnum[] ) { _readyControllers = value; }
	
	private var _level : LevelEnum = LevelEnum.Rooftop;
	public function get level() : LevelEnum { return _level; }
	public function set level( value : LevelEnum ) { _level = value; }
	
	private var _paused : boolean = false;
	public function get paused() : boolean { return _paused; }
	private function set paused( value : boolean ) { _paused = value; }
	
	// private variables not accessible outside of this class
	private var audioSources : Hashtable;
	private var managers : ISceneManager[];
	
	// PRIVATE FUNCTIONS
	
	private function oneTimeSetup() {
		// ControllerEnum is used to build the controllers array
		controllers = new Controller[ControllerEnum.Count];
		for (var i = 0; i < ControllerEnum.Count; i++)
			controllers[i] = new Controller();
		
		// setup audio
		audioSources = new Hashtable();
		audioBind( 'swoosh', swoosh );
		audioBind( 'chooseYourFighter', chooseYourFighter );
		
		// make sure every scene has a manager
		managers = new ISceneManager[Application.levelCount];
		for( i = 0; i < Application.levelCount; i++ ) {
			if ((i < sceneManagers.Length) && (sceneManagers[i].GetClass().GetInterface( 'ISceneManager' ) == ISceneManager))
				managers[i] = System.Activator.CreateInstance( sceneManagers[i].GetClass() );
			else
				managers[i] = System.Activator.CreateInstance( defaultSceneManager.GetClass() );
		}
	}
	
	private function simulating() : boolean {
		return ((Global.debugScene > 0) && 
			(Global.debugScene < Application.levelCount) && (Application.loadedLevel < Global.debugScene));
	}
	
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
	
	// MAIN FUNCTIONS
	
	function OnApplicationQuit() {
		instance = null; // unset singleton
	}
	
	function OnEnable() {
		if (!verifySingleton()) return; // verify singleton
		
		if (!controllers) oneTimeSetup();
		
		if( simulating() ) { // if true, simulate this scene then skip ahead to the next
			managers[Application.loadedLevel].SimulateScene();
		} else { // this level is for real
			audioBind( 'backgroundMusic', backgroundMusic[Application.loadedLevel] );
			audioFadeIn( audioPlay( 'backgroundMusic', true, true, backgroundMusicVolume ), 3.0 );
			readyControllers = getControllerEnumsWithState( ControllerState.Ready );
			
			managers[Application.loadedLevel].OnEnable();
		}
	}
	
	function Update() {
		if (!simulating()) managers[Application.loadedLevel].Update();
	}
		
	function OnGUI() {
		if (!simulating()) managers[Application.loadedLevel].OnGUI();
	}
	
	// PUBLIC FUNCTIONS
	
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
	
	// utility function for instantiating avatars
	public function instantiateAvatars() {
		avatars = new GameObject[readyControllers.Length];
		
		for( var i = 0; i < avatars.Length; i++ ) {
			var ce : ControllerEnum = readyControllers[i];
			
			var avatar : GameObject = GameObject.Instantiate( 
				characterPrefabs[controllers[ce].character], Vector3( (3.0 * i), 4.0, 0.0 ), Quaternion.LookRotation( Vector3.back ) );
			
			Global.bindAvatarToController( avatar, ce ); // set a reference to the Controller in Avatar
			avatars[i] = avatar;
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
		return audioPlay( uid, force, loop, 1.0 );
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
	
	// utility function for fading in audio
	public function audioFadeIn( a : AudioSource, duration : float ) {
		var startTime : float = Time.time;
		var endTime : float = (startTime + duration);
		var origVolume : float = a.volume;
		
		while( Time.time < endTime ) {
			a.volume = (origVolume * ((Time.time - startTime) / duration));
			yield;
		}
	}
	
	// utility function for fading out audio
	public function audioFadeOut( a : AudioSource, duration : float, delay : float ) {
		var endTime : float = (Time.time + (a.clip.length - a.time));
		var startTime : float = (endTime - duration);
		var origVolume : float = a.volume;
		
		// delay only used for looping audio
		if( a.loop ) {
			endTime = (delay + Time.time + duration);
			startTime = (delay + Time.time);
		}
		
		while( Time.time < endTime ) {
			if (Time.time > startTime)
				a.volume = (origVolume * (1.0 - ((Time.time - startTime) / duration)));
			yield;
		}
	}
	public function audioFadeOut( a : AudioSource, duration : float ) {
		audioFadeOut( a, duration, 0 );
	}
	
	// utility function for returning an array of ControllerEnum(s) with the passed state
	public function getControllerEnumsWithState( state : ControllerState ) : ControllerEnum[] {
		enumArray = new Array();
		
		for( i = 0; i < ControllerEnum.Count; i++ ) {
			if (controllers[i].state == state) enumArray.Push( i );
		}
		
		return enumArray.ToBuiltin( ControllerEnum );
	}
	
	public function getController( ce : ControllerEnum ) : Controller {
		return controllers[ce];
	}
}