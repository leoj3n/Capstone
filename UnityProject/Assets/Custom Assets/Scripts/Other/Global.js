
static var sharedZ : float = 0.0;
static var sharedMinX : float = -17.0;
static var sharedMaxX : float = 17.0;

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