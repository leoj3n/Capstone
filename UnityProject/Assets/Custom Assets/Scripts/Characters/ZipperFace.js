
class ZipperFace extends Avatar {
	function Awake() {
		Debug.Log( 'ZipperFace is alive!' );
	}
	
	function StateFinal() {
		switch( state ) {
			case CharacterState.Walk:
				shadowOffsetExtra = Vector3( -0.2, 0.0, 0.0 );
				break;
			case CharacterState.Drop:
				Debug.Log( 'Drop!' );
				staticFrame = 8;
				break;
			case CharacterState.Special1:
				canMove = false;
				// do special attack 1
				break;
			case CharacterState.Special2:
				canMove = false;
				// do special attack 2
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
	}
}