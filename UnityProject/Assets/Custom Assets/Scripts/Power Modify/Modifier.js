
class Modifier extends MonoBehaviour {
	public var modifier : ModifierEnum;
	public var duration : float;
	public var pickupSound : AudioClip;
	
	protected var owner : Avatar;
	protected var fadeEmitters : FadeEmitters;
	
	function Start() {
		GameManager.instance.audioBind( modifier, pickupSound );
		transform.localScale = Vector3( 1.0, 1.0, 1.0 );// transform.parent.localScale; // scale to card
		fadeEmitters = GetComponent( FadeEmitters );
		totalTime = fadeEmitters.getTimeRemaining();
	}
	
	function Update() {
		if( owner ) {			
			transform.position = owner.getCenterInWorld();
			var doubleDiameter : float = (owner.getScaledRadius() * 4.0);
			transform.localScale = Vector3( doubleDiameter, owner.getScaledHeight(), doubleDiameter );
			
			ApplyModifier(); // apply
		}
	}
	
	function OnDestroy() {
		if (owner && GameManager.instance) EndModifier(); // end
	}
	
	function pickup( avatar : Avatar ) {
		owner = avatar;
		transform.parent = owner.transform;
		GameManager.instance.audioPlay( modifier, true );
		fadeEmitters.restart( 0.0, duration, true );
		return;
	}
	
	function ApplyModifier() { /* override this function */ }
	function EndModifier() { /* override this function */ }
}