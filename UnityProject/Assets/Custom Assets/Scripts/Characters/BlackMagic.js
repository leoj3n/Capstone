
class BlackMagic extends Avatar {
	function Awake() {
		Debug.Log( 'BlackMagic is alive!' );
	}
	
	function CharacterStateSwitch() {
		switch( state ) {
			case CharacterState.Attack1:
			case CharacterState.Attack2:
				var hit : RaycastHit = raycastAttack( AttackType.WidestFrame );
				if( hit.transform ) {
					hitOtherAvatar( hit, attackOneForce, (attackOneForce * 0.25) );
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