
function OnTriggerEnter( other : Collider ) {
	other.transform.BroadcastMessage( 'OutOfBounds', SendMessageOptions.DontRequireReceiver );
}
