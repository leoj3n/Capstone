
public var modifier : ModifierEnum;
public var duration : float;
public var pickupSound : AudioClip;

private var owner : Avatar;
private var pickedUp : boolean = false;

function Start() {
	GameManager.instance.audioBind( modifier, pickupSound );
	transform.localScale = transform.parent.localScale; // scale to card
}

function Update() {
	if( owner ) {
		if( !pickedUp ) {
			switch( modifier ) {
				case ModifierEnum.TimeWarp:
					Debug.Log( 'time warp' );
					break;
				case ModifierEnum.PowerGaugeBoost:
					owner.changePower( 25.0 );
					break;
				case ModifierEnum.Invincibility:
					Debug.Log( 'invincibility' );
					break;
			}
		}
		
		transform.position = owner.getCenterInWorld();
		var doubleRadius : float = (owner.getScaledRadius() * 2.0);
		transform.localScale = Vector3( doubleRadius, owner.getScaledHeight(), doubleRadius );
		
		pickedUp = true;
	}
}

function pickup( avatar : Avatar ) {
	owner = avatar;
	transform.parent = owner.transform;
	GameManager.instance.audioPlay( modifier, true );
	GetComponent( FadeEmitters ).restart( 0.0, duration, true );
	return;
}