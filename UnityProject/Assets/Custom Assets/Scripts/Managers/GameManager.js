
 // GameManager is a singleton.
 // To avoid having to manually link an instance to every class that needs it, it has a static variable called
 // instance, so other objects that need to access it can just call:
 // 	GameManager.instance.DoSomeThing(); or GameManager.instance.myVal;

class GameManager extends MonoBehaviour {
	// the only static variable, points to singleton
	public static var instance : GameManager;
	
	// variables available in the inspector (accessible via GameManager.instance)
	public var backgroundMusic : AudioClip[];
	public var avatarPrefab : GameObject;
	public var characterPrefabs : GameObject[];
	public var expectedOrder : CharacterEnum; // just to expose the expected order in the Inspector
	public var selectTimeout : float = 1.0;
	public var countDownSeconds : int = 3;
	public var selectHudPrefab : GameObject;
	public var chooseYourFighter : AudioClip;
	public var swoosh : AudioClip;
	public var sceneManagers : MonoScript[];
	public var defaultSceneManager : MonoScript;
	
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
	
	private var _paused : boolean = false;
	public function get paused() : boolean { return _paused; }
	private function set paused( value : boolean ) { _paused = value; }
	
	// private variables not accessible outside of this class
	private var audioSources : Hashtable;
	private var managers : ISceneManager[];
	
	// MAIN FUNCTIONS
	
	function OnApplicationQuit() {
		instance = null; // unset singleton
	}
	
	function Awake() {
		if( instance == null ) {
			instance = this;
			DontDestroyOnLoad( gameObject );
		} else {
			Destroy( gameObject );
			return;
		}
		
		// ControllerEnum is used to build the controllers array
		controllers = new Controller[ControllerEnum.Count];
		for (var i = 0; i < ControllerEnum.Count; i++)
			controllers[i] = new Controller();
		
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
		
		OnLevelWasLoaded( 0 ); // simulate load for initial level (Unity doesn't call OnLevelWasLoaded for level 0)
	}
	
	function OnLevelWasLoaded( loadedLevel : int ) {
		audioBind( 'backgroundMusic', backgroundMusic[loadedLevel] );
		audioPlay( 'backgroundMusic', true, true );
		readyControllers = getControllerEnumsWithState( ControllerState.Ready );
		
		managers[loadedLevel].OnLevelWasLoaded();
	}
	
	function Update() {		
		managers[Application.loadedLevel].Update();
		
		if( (Global.debugScene > 0) && 
			(Global.debugScene < Application.levelCount) && (Global.debugScene > Application.loadedLevel) ) {
			// simulate this scene, then skip ahead to the next
			managers[Application.loadedLevel].SimulateScene();
			Application.LoadLevel( Application.loadedLevel + 1 );
		}
	}
	
	function OnGUI() {
		managers[Application.loadedLevel].OnGUI();
	}
	
	// PUBLIC FUNCTIONS
	
	public function togglePause() {
		if( paused ) {
			Time.timeScale = 1.0;
			paused = false;
		} else {
			Time.timeScale = 0.0;
			paused = true;
		}
	}
	
	public function instantiateAvatars() {
		avatars = new GameObject[readyControllers.Length];
		
		for( var i = 0; i < avatars.Length; i++ ) {
			var ce : ControllerEnum = readyControllers[i];
			
			var avatar : GameObject = GameObject.Instantiate( characterPrefabs[controllers[ce].character], Vector3( (3.0 * i), 4.0, 0.0 ), Quaternion.LookRotation( Vector3.back ) );
			
			Global.bindAvatarToController( avatar, ce ); // set a reference to the Controller in Avatar
			avatars[i] = avatar;
		}
	}
	
	public function audioBind( uid, clip : AudioClip ) {
		if( !audioSources.ContainsKey( uid ) ) {
			var a : AudioSource = gameObject.AddComponent( AudioSource );
			a.clip = clip;
			audioSources.Add( uid, a );
		} else {
			audioSources[uid].clip = clip;
		}
	}
	
	public function audioPlay( uid, force : boolean, loop : boolean, volume : float ) {
		if( audioSources.ContainsKey( uid ) ) {
			var a : AudioSource = audioSources[uid];
			
			if( !a.isPlaying || force ) {
				a.loop = loop;
				a.volume = volume;
				a.Play();
			}
		} else {
			Debug.LogWarning( 'GameManager was asked to play ' + uid + ' but that ID has not been bound.' );
		}
	}
	public function audioPlay( uid, force : boolean, loop : boolean ) {
		audioPlay( uid, force, loop, 1.0 );
	}
	public function audioPlay( uid, force : boolean ) {
		audioPlay( uid, force, false );
	}
	public function audioPlay( uid ) {
		audioPlay( uid, false );
	}
	
	public function audioIsPlaying( uid ) : boolean {
		if (audioSources.ContainsKey( uid ) && audioSources[uid].isPlaying ) return true;
		
		return false;
	}
	
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