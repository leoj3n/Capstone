
public var avatarLayer : int = 8;
public var impactSound : AudioClip;
public var secondsUntilSoundClimax : float = 0.9;
public var explodeSound : AudioClip;
public var detonatorPrefab : GameObject;
public var craterPrefab : GameObject;

private var origVolume : float;
private var startPos : Vector3;
private var lastPos : Vector3;
private var timeUntilExpire : float = 1.0;
private var playedOnce : boolean = false;
private var layerMask : int;
private var additionalVelocity : Vector3;
private var health : float = 100.0;
private var dead : boolean = false;

private var angleAmount : float = 0.02;

function Awake() {
	origVolume = audio.volume;
	audio.volume = 0;
	startPos = lastPos = transform.position;
	layerMask = ~(1 << avatarLayer); // layer mask for use in raycast
	additionalVelocity = Vector3( (Random.Range( 0.0, angleAmount ) * ((startPos.x < 0.0) ? -1 : 1 )), 0.0, 0.0 );
	
	GameManager.instance.audioBind( 'meteorImpact', impactSound );
	GameManager.instance.audioBind( 'meteorExplode', explodeSound );
	GameManager.instance.audioBind( 'meteorCrackle', audio.clip );
}

function Update() {
	rigidbody.velocity += additionalVelocity;
	
	var directionOfTravel : Vector3 = (transform.position - lastPos);
	directionOfTravel.Normalize();
	
	// spin around direction of travel
	transform.RotateAroundLocal( directionOfTravel, Time.deltaTime * 3 );
	lastPos = transform.position;
	
	// volume is relative to distance from ground
	audio.volume = origVolume - ((transform.position.y * 0.75) / startPos.y);
	
	if( !playedOnce ) {
		// distance = (initial velocity * t) + (1/2a * t^2)
		var dist : Vector3 = ((rigidbody.velocity * secondsUntilSoundClimax) + 
			(0.5 * (Physics.gravity + additionalVelocity) * secondsUntilSoundClimax * secondsUntilSoundClimax));
		
		Debug.DrawLine( transform.position, (transform.position + (directionOfTravel * dist.magnitude)) );
		
		if( Physics.Raycast( transform.position, directionOfTravel, dist.magnitude, layerMask ) ) {
			GameManager.instance.audioPlay( 'meteorImpact' );
			playedOnce = true;
		}
	}
}


function OnCollisionEnter( collision : Collision ) {
	Camera.main.SendMessage( 'AddShake', 0.05 );
	health -= 10.0;
	
	// do the following if out of health OR if other object has a tag (any tag at all)
	if( !dead && ((health < 0) || !collision.collider.CompareTag( 'Untagged' )) ) {
		Camera.main.SendMessage( 'AddShake', 0.5 );
		GameManager.instance.audioPlay( 'meteorExplode' );
		
		GameManager.instance.audioFadeOut( GameManager.instance.audioPlay( 'meteorCrackle', true, false, 1.0 ), 1.0 );
		
		// instantiate a detonator
		GameObject.Instantiate( detonatorPrefab, transform.position, Quaternion.identity );
				
		// add explosion force to avatars that are within 7 units
		Global.avatarExplosion( GameManager.instance.avatars, transform.position, 7, 2, 6 );
		
		// add a crater decal to the floor
		if (collision.collider.CompareTag( 'Floor' ))
			Instantiate( craterPrefab, 
				Vector3( collision.contacts[0].point.x, (collision.contacts[0].point.y + 0.001), Global.sharedZ ), 
				Quaternion.identity );
		
		// detach particle emitters from meteor so they don't get destroyed
		var emitters : Component[] = GetComponentsInChildren( ParticleEmitter );
		for( var emitter : ParticleEmitter in emitters ) {
			if (emitter.tag == 'Meteor') continue; // skip detachment
			emitter.transform.parent = null;
			emitter.emit = false;
		}
		
		Destroy( gameObject ); // destroy this meteor
		
		dead = true;
	}
}

function OutOfBounds() {
	Destroy( gameObject );
}