
class ZipperFace extends PlayerAvatar {	
	function CharacterStateSwitch() {
		switch( state ) {
			case CharacterState.Attack1:
			case CharacterState.Attack2:
				fps = 20.0;
				
				var hit : RaycastHit = capsuleAttack( AttackType.SpecificFrame, 5 );
				if( hit.transform ) {
					hitOtherAvatar( hit, attackOneForce, attackOneDamping );
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