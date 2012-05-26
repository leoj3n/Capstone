
class ZipperFace extends Avatar {
	function Awake() {
		Debug.Log( 'ZipperFace is alive!' );
	}
	
	function StateUpdate() {
		// button-activated states
		if( characterController.isGrounded || stateTransition ) {
			switch( true ) {
				case Global.isButton( 'A', boundController ):
					state = CharacterState.Attack1;
					// do attack 1
					break;
				case Global.isButton( 'B', boundController ):
					state = CharacterState.Attack2;
					// do attack 2
					break;
				case Global.isButton( 'X', boundController ):
					state = CharacterState.Special1;
					// do special attack 1
					break;
				case Global.isButton( 'Y', boundController ):
					state = CharacterState.Special2;
					// do special attack 2
					break;
			}
		}
	}
	
	function StateFinal() {
		switch( state ) {
			case CharacterState.Walk:
				shadowOffsetExtra = Vector3( -0.2, 0.0, 0.0 );
				break;
		}
	}
	
	/*function Attack1() {
		stateForced = true;
		
		while( stateForced == true ) {
			Debug.Log( 'raycast attack ' + Time.deltaTime );
			if (taRenderer.loopCount == 1) stateForced = false;
			yield;
		}
	}*/
	
	function Special1() {
		Debug.Log( 'ZipperFace Special1() override called!' );
		
		/*
		var orbClone : Rigidbody = Instantiate( orbPrefab, (transform.position + Vector3( 0, 1, 0 )), transform.rotation );
		orbClone.rigidbody.AddForce( Vector3( 1, 0, 0 ) * 1000.0 );
		Physics.IgnoreCollision( orbClone.collider, transform.parent.collider );
		*/
	}
}