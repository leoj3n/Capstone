
function OnCollisionEnter( collision : Collision ) {
	if( Global.isAvatar( collision ) ) {
		Global.avatarExplosion( collision, transform.position, 2.0, 0.2, 6.0 );
		//collision.gameObject.GetComponent( Avatar ).addExplosionForce( transform.position, 0.2, 2.0 );
		
		Destroy( gameObject );
	}
}