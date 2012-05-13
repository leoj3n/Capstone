
class BlackMagic extends AvatarTemplate {

	function Awake() {
		Debug.Log( 'BlackMagic is alive!' );
	}
	
	function Special1() {
		Debug.Log( 'Special1() override called!' );
		
		/*
		var orbClone : Rigidbody = Instantiate( orbPrefab, (transform.position + Vector3( 0, 1, 0 )), transform.rotation );
		orbClone.rigidbody.AddForce( Vector3( 1, 0, 0 ) * 1000.0 );
		Physics.IgnoreCollision( orbClone.collider, transform.parent.collider );
		*/
	}
}