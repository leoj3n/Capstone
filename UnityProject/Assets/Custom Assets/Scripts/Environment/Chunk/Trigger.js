
public var disable : boolean = false;

private var chunkVolume : ChunkVolume;

function Start() {
	chunkVolume = transform.parent.GetComponent( 'ChunkVolume' );
}

function OnTriggerEnter( other : Collider ) {
	if (!disable) chunkVolume.ignoreAvatarCollision( other, true );
	//Debug.Log( 'enter' );
}

function OnTriggerStay( other : Collider ) {
	if (!disable) chunkVolume.ignoreAvatarCollision( other, true );
	//Debug.Log( 'stay' );
}

function OnTriggerExit( other : Collider ) {
	Debug.Log( 'exit' );
	//if (!disable) chunkVolume.ignoreAvatarCollision( other, false );
}