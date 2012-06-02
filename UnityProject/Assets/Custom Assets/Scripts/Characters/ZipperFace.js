
class ZipperFace extends Avatar {
	function Awake() {
		Debug.Log( 'ZipperFace is alive!' );
	}
	
	function StateFinal() {
		switch( state ) {
			case CharacterState.Walk:
				break;
			case CharacterState.Drop:
				//staticFrame = 8;
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