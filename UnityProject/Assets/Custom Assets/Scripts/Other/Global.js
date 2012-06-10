
// all shared enums are here
enum CharacterEnum { ZipperFace, BlackMagic, KidCane, Dan, Mick }
enum CharacterSound {
	AnnouncerName, // 0
	Selected, // 1
	Jump, // 2
	HitA, // 3
	HitB, // 4
	AttackImpactA, // 5
	AttackImpactB, // 6
	AttackMissA, // 7
	AttackMissB // 8
}
enum CharacterState {
	Dead,
	CutScene,
	Idle,
	Jump,
	Walk,
	Fall,
	Hit,
	Drop,
	Block,
	Attack1,
	Attack2,
	Special1,
	Special2,
	Ultimate,
}
enum CharacterAtlas {
	SelectIdle, // 0
	Selected, // 1
	Intro, // 2
	Idle, // 3
	Jump, // 4
	JumpBackward, // 5
	JumpForward, // 6
	Walk, // 7
	Fall, // 8
	Hit, // 9
	Block, // 10
	Attack1, // 11
	Attack2, // 12
	Special1, // 13
	Special2, // 14
	Ultimate, // 15
	Victory // 16
}
enum AttackType {
	SpecificFrame,
	WidestFrame,
	Timed,
	Constant
}
enum CastType {
	Raycast,
	Capsule
}
enum CutScene {
	Intro,
	Victory
}
enum ControllerEnum { A, B, C, D, Count } // Unity supports a maximum of 4 controllers
enum ControllerTeam { Green, Red, Blue, Orange, Count } // need at least 4 teams to support free-for-all
enum ControllerState { SittingOut, TeamSelect, Ready }
enum SceneEnum { Start, CharacterSelect, LevelSelect, Scoreboard, Count }
enum LevelEnum { Rooftop, Bridge, Fountain, Count } // use SceneEnum.Count to offset LevelEnum
enum AlertTextType {
	Plain,
	Gaudy
}

// use these bounds to restrict avatar movement
static var sharedZ : float = 0.0;
static var sharedMinX : float = -32.0;
static var sharedMaxX : float = 32.0;

class Score {
	public var damageTaken : float;
	public var damageDealt : float;
	public var deaths : int;
}

// an array of game controllers gets stored in GameManager
class Controller {
	public var team : ControllerTeam;
	public var state : ControllerState;
	public var character : CharacterEnum;
	public var score : Score;
}

class AudioSourceManaged {
	public var audioSource : AudioSource;
	public var targetPitch : float;
	public var pitchDuration : float;
	public var targetVolume : float;
	public var volumeDuration : float;
	public var doNotDestroy : boolean;
	
	private var origPitch : float;
	private var origVolume : float;
	private var stopped = true;
	private var paused = false;
	
	function AudioSourceManaged( a : AudioSource ) {
		audioSource = a;
		targetPitch = origPitch = a.pitch;
		targetVolume = origVolume = a.volume;
	}
	
	function Update() {
		if( IsPlaying() ) {
			if (audioSource.pitch != targetPitch)
				audioSource.pitch = Mathf.MoveTowards( audioSource.pitch, targetPitch, (Time.deltaTime / pitchDuration) );
				
			if (audioSource.volume != targetVolume)
				audioSource.volume = Mathf.MoveTowards( audioSource.volume, targetVolume, (Time.deltaTime / volumeDuration) );
		} else if( !paused ) {
			stopped = true;
		}
	}
	
	function Play( force : boolean, loop : boolean, volume : float, pitch : float ) {
		if( (!paused && !IsPlaying()) || force ) {
			Stop();
			SetPitch( pitch );
			SetVolume( volume );
			audioSource.loop = loop;
			audioSource.Play();
			stopped = false;
		}
	}
	
	function Pause( bool : boolean ) {
		if (bool)
			audioSource.Pause();
		else if( !stopped )
			audioSource.Play();
			
		paused = bool;
	}
	
	function Stop() {
		Reset();
		stopped = true;
		audioSource.Stop();
	}
	
	function IsPlaying() : boolean {
		return audioSource.isPlaying;
	}
	
	function ResetPitch() {
		SetPitch( origPitch );
	}
	
	function ResetVolume() {
		SetPitch( origVolume );
	}
	
	function Reset() {
		ResetPitch();
		ResetVolume();
	}
	
	function SetPitch( p : float ) {
		audioSource.pitch = targetPitch = p;
	}
	
	function SetVolume( v : float ) {
		audioSource.volume = targetVolume = v;
	}
}

class SceneManager extends MonoBehaviour {
	public var gameManager : GameObject;
	public var backgroundMusic : AudioClip;
	public var backgroundMusicVolume : float = 0.60;
	public var fadeInBackgroundMusic : boolean;
	public var useDefaultBackground : boolean;
	
	function OnEnable() {
		if( GameManager.instance == null ) {
			Instantiate( gameManager );
			
			// simulate start scene
			if( Application.loadedLevel > SceneEnum.Start ) {
				GameManager.instance.controllers[0].state = ControllerState.Ready;
				GameManager.instance.controllers[1].state = ControllerState.Ready;
				GameManager.instance.controllers[1].team = ControllerTeam.Red;
				
				//GameManager.instance.controllers[2].state = ControllerState.Ready;
				//GameManager.instance.controllers[2].team = ControllerTeam.Red;
				//GameManager.instance.controllers[3].state = ControllerState.Ready;
				//GameManager.instance.controllers[3].team = ControllerTeam.Orange;
			}
			
			// simulate character select
			if( Application.loadedLevel > SceneEnum.CharacterSelect ) {
				GameManager.instance.controllers[0].character = CharacterEnum.ZipperFace;
				GameManager.instance.controllers[1].character = CharacterEnum.ZipperFace;
				
				//GameManager.instance.controllers[2].character = CharacterEnum.ZipperFace;
				//GameManager.instance.controllers[3].character = CharacterEnum.Dan;
			}
			
			// simulate level select
			if (Application.loadedLevel > SceneEnum.LevelSelect) GameManager.instance.level = LevelEnum.Rooftop;
			
			// simulate for scoreboard
			if( Application.loadedLevel == SceneEnum.Scoreboard ) {
				// simulated deaths stats, etc...
				GameManager.instance.level = LevelEnum.Rooftop;
			}
		}
	}
	
	// put anything you want to have happen at the beginning of every scene in this function
	function Start() {
		GameManager.instance.audioStopAll();
		GameManager.instance.audioFadeInAndLoop( 'backgroundMusic', backgroundMusic, backgroundMusicVolume, fadeInBackgroundMusic );
		GameManager.instance.updateReadyControllers();
		
		if (useDefaultBackground) Instantiate( GameManager.instance.defaultBackgroundPrefab );
		
		SceneLoaded(); // call the overloaded function
	}
	
	function SceneLoaded() { /* overload this function */ }
}

// utility function for getting the size of an objects' geometry
static function getSize( object ) : Vector3 {
	try {
		var size : Vector3 = object.GetComponent( MeshFilter ).sharedMesh.bounds.size;
	} catch( err ) {
		Debug.LogError( err, object );
		return Vector3.zero; // if unable get size of mesh, return zero
	}
	
	return absoluteVector( Vector3.Scale( size, object.transform.localScale ) ); // apply scaling to get final size
}

// utility function to enforce the bounds set in Global
static function enforceBounds( transform : Transform ) {
	transform.position.z = Global.sharedZ;
	if (transform.position.x > Global.sharedMaxX) transform.position.x = Global.sharedMaxX;
	if (transform.position.x < Global.sharedMinX) transform.position.x = Global.sharedMinX;
}

// utility functions for making the values of a vector absolute
static function absoluteVector( v : Vector3 ) { 
	return Vector3( Mathf.Abs( v.x ), Mathf.Abs( v.y ), Mathf.Abs( v.z ) );
}
static function absoluteVector( v : Vector2 ) { 
	return Vector3( Mathf.Abs( v.x ), Mathf.Abs( v.y ) );
}

// utility function to multiply one vector by the signs of another
static function multiplyVectorBySigns( v : Vector3, signs : Vector3 ) {
	return Vector3( (v.x * Mathf.Sign( signs.x )), (v.y * Mathf.Sign( signs.y )), (v.z * Mathf.Sign( signs.z )) );
}

static function pingPongRange( t : float, range : float ) {
	return (Mathf.PingPong( t, range ) - (range / 2.0));
}

// GLOBAL AVATAR FUNCTIONS

// utility function add explosion force to one or multiple avatars
static function avatarExplosion( avatars : GameObject[], pos : Vector3, radius : float, force : float, damping : float ) {
	for( var avatar : GameObject in avatars ) {
		if (Vector3.Distance( pos, avatar.transform.position ) < radius)
			avatar.GetComponent( Avatar ).addExplosionForce( pos, radius, force, damping );
	}
}

// utility function for testing if a given object is an avatar
static function isAvatar( object : System.Object ) {
	return (object.gameObject.CompareTag( 'Player' ) || object.gameObject.GetComponent( Avatar ));
}


	
// utility function so see if avatars are on same team
static function avatarsOnSameTeam( avatar1 : GameObject, avatar2 : GameObject ) : boolean {
	return (avatar1.GetComponent( Avatar ).getTeam() == avatar2.GetComponent( Avatar ).getTeam());
}

// utility function to set reference to controller in avatar
static function bindAvatarToController( avatar : GameObject, ce : ControllerEnum ) {
	avatar.SendMessage( 'SetController', ce );
	avatar.name = 'Avatar (' + ce + ')'; // mainly for easier debugging
}

// GLOBAL INPUT FUNCTIONS

// utility function to check if button was pressed for a given controller
static function isButtonDown( button : String, ce : ControllerEnum ) : boolean {
	return Input.GetButtonDown( button + ' (' + ce + ')' );
}
// similar to isButtonDown() but tests against all controllers
static function isButtonDown( button : String ) : boolean {
	for( var i = 0; i < ControllerEnum.Count; i++ ) {
		if (Global.isButtonDown( button, i )) return true;
	}
	
	return false;
}
// similar to isButtonDown() but tests against passed controllers
static function isButtonDown( button : String, controllers : ControllerEnum[] ) : boolean {
	for( var controller : ControllerEnum in controllers ) {
		if (Global.isButtonDown( button, controller )) return true;
	}
	
	return false;
}

// utility function to check if a button is being held down for a given controller
static function isButton( button : String, ce : ControllerEnum ) : boolean {
	return Input.GetButton( button + ' (' + ce + ')' );
}

// utility function to get horizontal or vertical axis data for a given controller
static function getAxis( axis : String, ce : ControllerEnum ) : float {
	return Input.GetAxisRaw( axis + ' (' + ce + ')' );
}
// similar to getAxis() but tests against all controllers
static function getAxis( axis : String ) : float {
	var largest : float;
	for( var i = 0; i < ControllerEnum.Count; i++ ) {
		var amount : float = Global.getAxis( axis, i );
		if (Mathf.Abs( amount ) > Mathf.Abs( largest )) largest = amount;
	}
	
	return largest;
}
// similar to getAxis() but tests against passed controllers
static function getAxis( axis : String, controllers : ControllerEnum[] ) : float {
	var largest : float;
	for( var controller : ControllerEnum in controllers ) {
		var amount : float = Global.getAxis( axis, controller );
		if (Mathf.Abs( amount ) > Mathf.Abs( largest )) largest = amount;
	}
	
	return largest;
}

// returns volume based on impact force and mass (if available)
// expects mass of objects to be between 0.1 and 10.0 (hence the multiplication by 0.01)
static function collisionVolume( collision : Collision, fallbackMass : float ) : float {
	return Mathf.Clamp01( collision.impactForceSum.magnitude * 
		(collision.gameObject.rigidbody ? collision.gameObject.rigidbody.mass : fallbackMass) * 0.01 );
}
static function collisionVolume( collision : Collision ) : float {
	return collisionVolume( collision, 1.0 );
}