
public var disable : boolean = false;

function OnTriggerEnter( other : Collider ) {
	if (!disable) transform.parent.GetComponent( 'ChunkVolume' ).ignoreAvatarCollision( other, true );
}

function OnTriggerStay( other : Collider ) {
	if (!disable) transform.parent.GetComponent( 'ChunkVolume' ).ignoreAvatarCollision( other, true );
}

function OnTriggerExit( other : Collider ) {
	if (!disable) transform.parent.GetComponent( 'ChunkVolume' ).ignoreAvatarCollision( other, false );
}