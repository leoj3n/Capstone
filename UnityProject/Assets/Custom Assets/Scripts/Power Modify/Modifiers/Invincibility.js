
class Invincibility extends Modifier {
	function ApplyModifier() {
		owner.setInvincibility( true );
	}
	
	function EndModifier() {
		owner.setInvincibility( false );
	}
}