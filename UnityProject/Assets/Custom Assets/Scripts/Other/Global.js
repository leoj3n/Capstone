
// all shared enums are here
enum CharacterEnum { ZipperFace, BlackMagic, KidCane, Dan, Mick }
enum CharacterSound { AnnouncerName, Selected, Jump }
enum CharacterState {
	SelectIdle,
	Selected,
	Intro,
	Idle,
	Jump,
	JumpBackward,
	JumpForward,
	Walk,
	Attack1,
	Attack2,
	Special1,
	Special2,
	Ultimate,
	Block,
	KnockedBack
}
enum ControllerEnum { A, B, C, D, Count } // Unity supports a maximum of 4 controllers
enum ControllerTeam { Green, Red, Blue, Orange, Count } // need at least 4 teams to support free-for-all
enum ControllerState { SittingOut, TeamSelect, Ready }
enum SceneEnum { Start, CharacterSelect, LevelSelect, Count }
enum LevelEnum { Rooftop, Bridge, Fountain, Count }

// use these bounds to restrict avatar movement
static var sharedZ : float = 0.0;
static var sharedMinX : float = -22.0;
static var sharedMaxX : float = 22.0;
static var debugScene : int = 0;

// an array of game controllers gets stored in GameManager
class Controller {
	public var team : ControllerTeam;
	public var state : ControllerState;
	public var character : CharacterEnum;
}

class SceneManager extends MonoBehaviour {
	public var gameManager : GameObject;
	public var backgroundMusic : AudioClip;
	public var backgroundMusicVolume : float = 0.60;
	public var fadeInBackgroundMusic : boolean;
	
	function OnEnable() {
		if( GameManager.instance == null ) {
			Instantiate( gameManager );
			
			// simulate start scene
			if( Application.loadedLevel > 0 ) {
				GameManager.instance.controllers[0].state = ControllerState.Ready;
				GameManager.instance.controllers[1].state = ControllerState.Ready;
				GameManager.instance.controllers[1].team = ControllerTeam.Red;
			}
			
			// simulate character select
			if( Application.loadedLevel > 1 ) {
				GameManager.instance.controllers[0].character = CharacterEnum.ZipperFace;
				GameManager.instance.controllers[1].character = CharacterEnum.BlackMagic;
			}
			
			// simulate level select
			if (Application.loadedLevel > 2) GameManager.instance.level = LevelEnum.Rooftop;
		}
	}
	
	// put anything you want to have happen at the beginning of every scene in this function
	function Start() {
		GameManager.instance.setBackgroundMusic( backgroundMusic, fadeInBackgroundMusic );
		
		GameManager.instance.updateReadyControllers();
		
		SceneLoaded(); // call the overloaded function
	}
	
	function SceneLoaded() { /* overload this function */ }
}

// utility function for getting the size of an objects' geometry
static function getSize( object ) : Vector3 {
	try {
		var size : Vector3 = object.GetComponent( MeshFilter ).sharedMesh.bounds.size;
	} catch( err ) {
		Debug.LogError( err );
		return Vector3.zero; // if unable get size of mesh, return zero
	}
	
	return Vector3.Scale( size, object.transform.localScale ); // apply scaling to get final size
}

// GLOBAL AVATAR FUNCTIONS

// utility function add explosion force to one or multiple avatars
static function avatarExplosion( avatars : GameObject[], pos : Vector3, range : float, force : float, damping : float ) {
	for( var avatar : GameObject in avatars ) {
		if (Vector3.Distance( pos, avatar.transform.position ) < range)
			avatar.GetComponent( Avatar ).addExplosionForce( pos, force, damping );
	}
}
static function avatarExplosion( object : System.Object, pos : Vector3, range : float, force : float, damping : float ) {
	avatarExplosion( Array( object.gameObject ), pos, range, force, damping );
}

// utility function for testing if a given object is an avatar
static function isAvatar( object : System.Object ) {
	return (object.gameObject.CompareTag( 'Player' ) || object.gameObject.GetComponent( Avatar ));
}

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