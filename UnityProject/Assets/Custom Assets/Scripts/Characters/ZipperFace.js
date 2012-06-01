
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
}