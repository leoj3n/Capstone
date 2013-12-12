
class TimeWarp extends Modifier {	
	function ApplyModifier() {
		var halfDuration : float = (duration / 2.0);
		var warpFactor : float = (fadeEmitters.getTimeRemaining() / duration);
		
		if( fadeEmitters.getTimeRemaining() < halfDuration )
			warpFactor = (1.0 - warpFactor); // reverse direction of halfway through
		
		GameManager.instance.audioFadeAllToPitch( Mathf.Clamp01( warpFactor * warpFactor * warpFactor + 0.4 ), 1.0 );
		applyTimeWarp( warpFactor * warpFactor * warpFactor + 0.2 );
	}
	
	function EndModifier() {
		GameManager.instance.audioResetAllPitch();
		applyTimeWarp( 1.0 );
	}
	
	private function applyTimeWarp( factor : float ) {
		var avatars : GameObject[] = GameManager.instance.getAvatarsOnOtherTeams( owner.getTeam() );
		
		for( var avatar : GameObject in avatars ) {
			var component : PlayerAvatar = avatar.GetComponent( PlayerAvatar );
			component.setTimeWarpFactor( factor );
		}
	}
}