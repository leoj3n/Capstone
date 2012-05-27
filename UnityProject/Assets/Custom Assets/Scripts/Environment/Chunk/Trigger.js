
public var disable : boolean = false;

private var chunkVolume : ChunkVolume;

function Start() {
	chunkVolume = transform.parent.GetComponent( ChunkVolume );
}

function OnTriggerEnter( other : Collider ) {
	if (!disable) chunkVolume.ignoreAvatarCollision( other, true );
}

function OnTriggerStay( other : Collider ) {
	if (!disable) chunkVolume.ignoreAvatarCollision( other, true );
}

function OnTriggerExit( other : Collider ) {
	if (!disable) chunkVolume.ignoreAvatarCollision( other, false );
}