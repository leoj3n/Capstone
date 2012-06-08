
class SuperSpeed extends Modifier {	
	function ApplyModifier() {
		var speedFactor : float = (fadeEmitters.getTimeRemaining() / duration);
		
		owner.setSuperSpeedFactor( speedFactor );
	}
	
	function EndModifier() {
		owner.setSuperSpeedFactor( 0.0 );
	}
}