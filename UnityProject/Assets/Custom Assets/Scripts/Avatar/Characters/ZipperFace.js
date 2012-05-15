
class ZipperFace extends CharacterTemplate {
	function Awake() {
		Debug.Log( 'ZipperFace is alive!' );
	}
	
	function Special1() {
		Debug.Log( 'ZipperFace Special1() override called!' );
		
		/*
		var orbClone : Rigidbody = Instantiate( orbPrefab, (transform.position + Vector3( 0, 1, 0 )), transform.rotation );
		orbClone.rigidbody.AddForce( Vector3( 1, 0, 0 ) * 1000.0 );
		Physics.IgnoreCollision( orbClone.collider, transform.parent.collider );
		*/
	}
}