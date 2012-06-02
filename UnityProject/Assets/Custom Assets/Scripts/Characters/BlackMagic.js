
class BlackMagic extends Avatar {
	function Awake() {
		Debug.Log( 'BlackMagic is alive!' );
	}
	
	function CharacterStateSwitch() {
		switch( state ) {
			case CharacterState.Attack1:
			case CharacterState.Attack2:
				fps = 25.0;
				
				var hit : RaycastHit = raycastAttack( AttackType.WidestFrame );
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