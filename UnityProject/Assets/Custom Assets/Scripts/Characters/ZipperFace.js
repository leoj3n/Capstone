
class ZipperFace extends Avatar {
	function Awake() {
		Debug.Log( 'ZipperFace is alive!' );
	}
	
	function CharacterStateSwitch() {
		switch( state ) {
			case CharacterState.Attack1:
				offset = Vector3( -0.5, 0.0, 0.0 );
			
				var hit : RaycastHit = raycastAttack( AttackType.SpecificFrame, 5 );
				if( hit.transform ) {
					hitOtherAvatar( hit, attackOneForce, (attackOneForce / 2.0) );
				}
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