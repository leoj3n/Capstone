
public var modifier : ModifierEnum;
public var duration : float;
public var pickupSound : AudioClip;

private var owner : Avatar;
private var pickedUp : boolean = false;
private var fadeEmitters : FadeEmitters;

function Start() {
	GameManager.instance.audioBind( modifier, pickupSound );
	transform.localScale = transform.parent.localScale; // scale to card
	fadeEmitters = GetComponent( FadeEmitters );
	totalTime = fadeEmitters.getTimeRemaining();
}

function Update() {
	if( owner ) {
		switch( modifier ) {
			case ModifierEnum.TimeWarp:
				var halfDuration : float = (duration / 2.0);
				
				if( fadeEmitters.getTimeRemaining() > halfDuration )
					GameManager.instance.audioFadeAllToPitch( 0.5, halfDuration );
				else
					GameManager.instance.audioFadeAllToPitch( 1.0, halfDuration );
				break;
			case ModifierEnum.PowerGaugeBoost:
				owner.changePower( 25.0 );
				break;
			case ModifierEnum.Invincibility:
				//Debug.Log( 'invincibility' );
				break;
		}
		
		transform.position = owner.getCenterInWorld();
		var doubleRadius : float = (owner.getScaledRadius() * 2.0);
		transform.localScale = Vector3( doubleRadius, owner.getScaledHeight(), doubleRadius );
		
		pickedUp = true;
	}
}

function OnDestroy() {
	if (GameManager.instance && (modifier == ModifierEnum.TimeWarp))
		GameManager.instance.audioResetAllPitch();
}

function pickup( avatar : Avatar ) {
	owner = avatar;
	transform.parent = owner.transform;
	GameManager.instance.audioPlay( modifier, true );
	fadeEmitters.restart( 0.0, duration, true );
	return;
}