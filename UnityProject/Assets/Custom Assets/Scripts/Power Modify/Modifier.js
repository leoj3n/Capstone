
public var modifier : PowerModifyEnum;
public var duration : float;
public var pickupSound : AudioClip;

private var owner : PlayerAvatar;

function Start() {
	GameManager.instance.audioBind( modifier, pickupSound );
	transform.localScale = transform.parent.localScale; // scale to card
}

function Update() {
	//apply modify
	if( owner ) {
		transform.position = owner.getCenterInWorld();
		var doubleRadius : float = (owner.getScaledRadius() * 2.0);
		transform.localScale = Vector3( doubleRadius, owner.getScaledHeight(), doubleRadius );
	}
}

function pickup( avatar : PlayerAvatar ) {
	owner = avatar;
	transform.parent = owner.transform;
	GameManager.instance.audioPlay( modifier, true );
	GetComponent( FadeEmitters ).restart( 0.0, duration, true );
	return;
}