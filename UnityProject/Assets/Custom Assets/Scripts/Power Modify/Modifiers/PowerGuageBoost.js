
class PowerGuageBoost extends Modifier {
	public var boostAmount : float = 30.0;
	
	function ApplyModifier() {
		owner.changePower( boostAmount * (Time.deltaTime / duration) );
	}
}