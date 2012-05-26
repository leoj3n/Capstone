
class ZipperFace extends Avatar {
	function Awake() {
		Debug.Log( 'ZipperFace is alive!' );
	}
	
	function StateUpdated() {
		switch( state ) {
			case CharacterState.Walk:
				shadowOffsetExtra = Vector3( -0.2, 0.0, 0.0 );
				break;
		}
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