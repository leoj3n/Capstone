
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
	WalkBackward,
	WalkForward,
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

// use these bounds to restrict avatar movement
static var sharedZ : float = 0.0;
static var sharedMinX : float = -22.0;
static var sharedMaxX : float = 22.0;

// an array of game controllers gets stored in GameManager
class Controller {
	public var team : ControllerTeam;
	public var state : ControllerState;
	public var character : CharacterEnum;
}

interface ISceneManager {
	function OnLevelWasLoaded();
	function Update();
	function OnGUI();
	
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

// utility function for fading in audio
static function audioFadeIn( a : AudioSource, duration : float ) {
	var startTime : float = Time.time;
	var endTime : float = startTime + duration;
	
	while( Time.time < endTime ) {
		a.volume = (Time.time - startTime) / duration;
		yield;		
	}
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

// utility function to check if a button is being held down for a given controller
static function isButton( button : String, ce : ControllerEnum ) : boolean {
	return Input.GetButton( button + ' (' + ce + ')' );
}

// utility function to get horizontal or vertical axis data for a given controller
static function getAxis( axis : String, ce : ControllerEnum ) : float {
	return Input.GetAxisRaw( axis + ' (' + ce + ')' );
}