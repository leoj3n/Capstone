
enum AvatarEnum { ZipperFace, BlackMagic, KidCane, Dan, Mick }
enum AvatarSound { AnnouncerName, Jump }
enum ControllerID {	A, B, C, D, Count } // Unity supports a maximum of 4 controllers
enum ControllerTeam { Green, Red, Blue, Orange, Count } // need at least 4 teams to support free-for-all

static var sharedZ : float = 0.0;
static var sharedMinX : float = -22.0;
static var sharedMaxX : float = 22.0;

class Controller {
	public var id : ControllerID;
	public var team : ControllerTeam;
	public var avatar : AvatarEnum;
	
	public var active : boolean;
	public var ready : boolean;

	function Controller( theId : ControllerID ) {
		id = theId; // should match GameManager.controllers[ id ]
		team = ControllerTeam.Green; // default to team Green
		avatar = AvatarEnum.ZipperFace; // default to ZipperFace
	}
}

static function getSize( object ) : Vector3 {
	try {
		var size : Vector3 = object.GetComponent( MeshFilter ).sharedMesh.bounds.size;
	} catch( err ) {
		Debug.LogError( err );
		return Vector3.zero; // if unable get size of mesh, return zero
	}
	
	return Vector3.Scale( size, object.transform.localScale ); // apply scaling to get final size
}

static function audioFadeIn( a : AudioSource, duration : float ) {
	var startTime : float = Time.time;
	var endTime : float = startTime + duration;
	
	while( Time.time < endTime ) {
		a.volume = (Time.time - startTime) / duration;
		yield;		
	}
}

static function avatarExplosion( object : System.Object, pos : Vector3, range : float, force : float, damping : float ) {
	avatarExplosion( Array( object.gameObject ), pos, range, force, damping );
}
static function avatarExplosion( avatars : GameObject[], pos : Vector3, range : float, force : float, damping : float ) {
	for( var avatar : GameObject in avatars ) {
		if (Vector3.Distance( pos, avatar.transform.position ) < range)
			avatar.GetComponent( Avatar ).addExplosionForce( pos, force, damping );
	}
}

static function spliceAvatar( avatars : GameObject[], avatarToRemove : System.Object ) : Array {
	var copy : Array = avatars;
	copy.Remove( avatarToRemove.gameObject );
	return copy;
}

static function isAvatar( object : System.Object ) {
	return (object.gameObject.CompareTag( 'Player' ) || object.gameObject.GetComponent( Avatar ));
}

static function bindAvatarToController( avatar : GameObject, ctlr : Controller ) {
	avatar.SendMessage( 'SetController', ctlr );
	avatar.name = 'Avatar (' + ctlr.id + ')'; // mainly for easier debugging
}

// returns an array of booleans of size ControllerID.Count
static function isButtonDown( button : String ) : boolean[] {
	var values : boolean[] = new boolean[ControllerID.Count];
	
	for (var i = 0; i < ControllerID.Count; i++) values[i] = Global.isButtonDown( button, i );

	return values;
}
static function isButtonDown( button : String, cid : ControllerID ) : boolean {
	return Input.GetButtonDown( button + ' (' + cid + ')' );
}

static function isButton( button : String, cid : ControllerID ) : boolean {
	return Input.GetButton( button + ' (' + cid + ')' );
}

static function getAxis( axis : String, cid : ControllerID ) : float {
	return Input.GetAxisRaw( axis + ' (' + cid + ')' );
}