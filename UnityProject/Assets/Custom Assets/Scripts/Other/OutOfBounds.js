function OnTriggerEnter( other : Collider ) {
	other.transform.SendMessage( 'OutOfBounds', null, SendMessageOptions.DontRequireReceiver );
	//Debug.Log( other.name );
}
