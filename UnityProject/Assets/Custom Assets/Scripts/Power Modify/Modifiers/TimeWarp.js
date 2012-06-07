
class TimeWarp extends Modifier {
	function ApplyModifier() {
		var halfDuration : float = (duration / 2.0);
		
		if( fadeEmitters.getTimeRemaining() > halfDuration )
			GameManager.instance.audioFadeAllToPitch( 0.5, halfDuration );
		else
			GameManager.instance.audioFadeAllToPitch( 1.0, halfDuration );
	}
	
	function EndModifier() {
		GameManager.instance.audioResetAllPitch();
	}
}