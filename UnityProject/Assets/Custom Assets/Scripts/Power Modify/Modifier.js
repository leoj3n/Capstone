
class Modifier extends MonoBehaviour {
	public var modifier : ModifierEnum;
	public var duration : float;
	public var pickupSound : AudioClip;
	
	protected var owner : Avatar;
	protected var pickedUp : boolean = false;
	protected var fadeEmitters : FadeEmitters;
	
	function Start() {
		GameManager.instance.audioBind( modifier, pickupSound );
		transform.localScale = transform.parent.localScale; // scale to card
		fadeEmitters = GetComponent( FadeEmitters );
		totalTime = fadeEmitters.getTimeRemaining();
	}
	
	function Update() {
		if( owner ) {			
			transform.position = owner.getCenterInWorld();
			var doubleRadius : float = (owner.getScaledRadius() * 2.0);
			transform.localScale = Vector3( doubleRadius, owner.getScaledHeight(), doubleRadius );
			
			ApplyModifier(); // apply
			
			pickedUp = true;
		}
	}
	
	function OnDestroy() {
		if (GameManager.instance) EndModifier(); // end
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