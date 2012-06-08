
class ZipperFace extends Avatar {	
	public var shurikenPrefab : GameObject;
	
	private var lastSpecialTime : float = 0.0;
	
	function CharacterStateSwitch() {
		switch( state ) {
			case CharacterState.Block:
				atlas = CharacterAtlas.Attack1;
				staticFrame = 4;
				break;
			case CharacterState.Attack1:
			case CharacterState.Attack2:
				fps = 20.0;
				
				var hit : RaycastHit = capsuleAttack( AttackType.SpecificFrame, 5 );
				if( hit.transform ) {
					hitOtherAvatar( hit, attackOneForce, attackOneDamping );
				}
				break;
			case CharacterState.Special1:
				canMove = canJump = false;
				//updatePressedOnce( state ); // simply call this to make this state a "press once" state
				// currently throws stars until animation ends or power runs out
				
				atlas = CharacterAtlas.Attack1;
				staticFrame = 3;
				
				if( hasPower( 5.0 ) ) {
					if( (Time.time - lastSpecialTime) > 0.1 ) {
						var shuriken : GameObject = Instantiate( shurikenPrefab );
						shuriken.transform.position = (getCenterInWorld() + Vector3( facing, 1.5, 0.0 ));
						shuriken.GetComponent( Shuriken ).direction = Vector3( facing, 0.0, 0.0 );
						shuriken.GetComponent( Shuriken ).belongsToTeam = getTeam();
						lastSpecialTime = Time.time;
						changePower( -5.0 );
					}
				}
				//} else {
				//	pressedOnce = CharacterState.Dead; // end animation prematurely and stop throwing shurikens
				//}
				break;
			case CharacterState.Special2:
				canMove = false;
				// do special attack 2
				break;
		}
	}
}