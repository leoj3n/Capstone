
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
	
	// private variables (accessible via GameManager.instance)
	private var _controllers : Controller[];
	public function get controllers() : Controller[] { return _controllers; }
	private function set controllers( value : Controller[] ) { _controllers = value; }
	
	private var _avatars : GameObject[];
	public function get avatars() : GameObject[] { return _avatars; }
	private function set avatars( value : GameObject[] ) { _avatars = value; }
	
	private var _audioWaitFinish : boolean = false;
	public function get audioWaitFinish() : boolean { return _audioWaitFinish; }
	private function set audioWaitFinish( value : boolean ) { _audioWaitFinish = value; }
	
	private var _readyControllers : ControllerEnum[];
	public function get readyControllers() : ControllerEnum[] { return _readyControllers; }
	private function set readyControllers( value : ControllerEnum[] ) { _readyControllers = value; }
	
	// private variables not accessible outside of this class
	private var bgAudioSource : AudioSource;
	private var managers : ISceneManager[];
	
	// MAIN FUNCTIONS
	
	function OnApplicationQuit() {
		instance = null; // unset singleton
	}
	
	function Awake() {
		// do singleton stuff
		instance = FindObjectOfType( GameManager );
		if (instance == null) Debug.Log( 'Could not locate a GameManager object.' );
		DontDestroyOnLoad( gameObject );
		
		// ControllerEnum is used to build and access the controllers array
		controllers = new Controller[ControllerEnum.Count];
		for (var i = 0; i < ControllerEnum.Count; i++)
			controllers[i] = new Controller();
		
		bgAudioSource = GameObject.Find( 'Background Music' ).GetComponent( AudioSource );
		
		// make sure every scene has a manager
		managers = new ISceneManager[Application.levelCount];
		for( i = 0; i < Application.levelCount; i++ ) {
			if ((i < sceneManagers.Length) && (sceneManagers[i].GetClass().GetInterface( 'ISceneManager' ) == ISceneManager))
				managers[i] = System.Activator.CreateInstance( sceneManagers[i].GetClass() );
			else
				managers[i] = new LevelManager();
		}
		
		OnLevelWasLoaded( 0 ); // simulate load for initial level
	}
	
	function OnLevelWasLoaded( loadedLevel : int ) {
		setBackgroundMusic( backgroundMusic[loadedLevel] );
		readyControllers = getControllerEnumsWithState( ControllerState.Ready );
		
		managers[loadedLevel].OnLevelWasLoaded();
	}
	
	function Update() {
		if (!audio.isPlaying) audioWaitFinish = false;
		
		managers[Application.loadedLevel].Update();
	}
	
	function OnGUI() {
		managers[Application.loadedLevel].OnGUI();
	}
	
	// PUBLIC FUNCTIONS
	
	public function instantiateAvatars() {
		var avatarsTemp : Array = new Array(); // expandable arrays are easy to work with (but slow)
		
		var i : int = 0;
		for( var ce : ControllerEnum in readyControllers ) {		
			var avatar : GameObject = GameObject.Instantiate( avatarPrefab, Vector3( (2.0 * i++), 4.0, 0.0 ), Quaternion.LookRotation( Vector3.back ) );
			
			var avatarChild : GameObject = GameObject.Instantiate( characterPrefabs[controllers[ce].character], 
				avatar.transform.position, avatar.transform.rotation );
			avatarChild.transform.parent = avatar.transform;
			
			Global.bindAvatarToController( avatar, ce ); // set a reference to the Controller in Avatar
			avatarsTemp.Push( avatar );
		}
		
		avatars = avatarsTemp.ToBuiltin( GameObject ); // convert to builtin for speed
	}
	
	public function setBackgroundMusic( clip : AudioClip ) {
		bgAudioSource.clip = clip;
	}
	
	public function audioPlay( clip : AudioClip, waitFinish : boolean ) {
		if( !audioWaitFinish ) {
			audio.clip = clip;
			audio.Play();
			audioWaitFinish = waitFinish;
		}
	}
	public function audioPlay( clip : AudioClip ) {
		audioPlay( clip, false );
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