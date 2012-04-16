
public var avatarLayer : int = 8;
public var impactSound : AudioClip;
public var secondsUntilSoundClimax : float = 0.9;
public var explodeSound : AudioClip;

private var origVolume : float;
private var startPos : Vector3;
private var lastPos : Vector3;
private var timeUntilExpire : float = 1.0;
private var playedOnce : boolean = false;
private var layerMask : int;
private var health : float = 100.0;

function Start() {
	origVolume = audio.volume;
	audio.volume = 0;
	startPos = lastPos = transform.position;
	layerMask = ~(1 << avatarLayer);
}

function Update() {
	// spin around direction of travel
	transform.RotateAroundLocal( (transform.position - lastPos), Time.deltaTime * 3 );
	lastPos = transform.position;
	
	audio.volume = origVolume - ((transform.position.y * 0.75) / startPos.y); // volume is relative to distance from ground
	
	if( !playedOnce ) {
		// distance = (initial velocity * t) + (1/2a * t^2)
		var dist : float = Mathf.Abs( (rigidbody.velocity.y * secondsUntilSoundClimax) + 
			(0.5 * Physics.gravity.y * secondsUntilSoundClimax * secondsUntilSoundClimax) );
		
		if( Physics.Raycast( transform.position, Vector3( 0, -1, 0 ), dist, layerMask ) ) {
			Camera.main.audio.PlayOneShot( impactSound ); // play on camera because this gets destroyed
			playedOnce = true;
		}
	}
}


function OnCollisionEnter( collision : Collision ) {
	Camera.main.SendMessage( 'AddShake', 0.05 );
	health -= 10.0;
	
	if( (health < 0) || !collision.collider.CompareTag( 'Untagged' ) ) {
		Camera.main.SendMessage( 'AddShake', 0.5 );
		Camera.main.audio.PlayOneShot( explodeSound );
		Camera.main.audio.PlayOneShot( audio.clip, 0.5 );
		
		/*// instantiate debris
		var rand : int = Random.Range( 5, 10 );
		for( var i = 0; i < rand; i++ ) {
			//var meteor : Meteor = Instantiate( this, transform.position, transform.rotation );
		}*/
		
		// apply an explosion force to nearby objects
		var radius = 10.0;
		var colliders : Collider[] = Physics.OverlapSphere( transform.position, radius );
		for( var collider : Collider in colliders ) {
			//if (collider.GetComponent( CharacterController )) collider.GetComponent( CharacterController ).enabled = false;
			if (!collider) continue;
			if (collider.rigidbody) collider.rigidbody.AddExplosionForce( 200.0 + (collision.impactForceSum.magnitude * 20), transform.position, radius, 8.0 );
		}
		
		// detach particle emitters from meteor so they don't get destroyed
		var emitters : Component[] = GetComponentsInChildren( ParticleEmitter );
		for( var emitter : ParticleEmitter in emitters ) {
			if (emitter.tag == 'Meteor') continue; // skip detachment
			emitter.transform.parent = null;
			emitter.emit = false;
		}
		
		Destroy( gameObject ); // destroy this meteor
	}
}



/*
	// Check if the collider we hit has a rigidbody
  	// Then apply the force		this.name.Substring( (this.name.Length - 3)
    for (var contact : ContactPoint in collision.contacts) {
		if (contact.otherCollider.tag == "Player") {   //and if it isnt a part of the level
			var playerScript = contact.otherCollider.gameObject.GetComponent(Avatar);
			
			if (playerScript.facing == 'right')
				dir = 1;
			else
				dir = -1;
			playerScript.hitForceX = 5000 * dir * Time.deltaTime;
			playerScript.health -= 50;
		}
	}
*/