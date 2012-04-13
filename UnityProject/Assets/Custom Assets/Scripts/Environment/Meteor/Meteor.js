
public var avatarLayer : int = 8;
public var impactSound : AudioClip;
public var impactSoundDistance : float = 14.0;

private var origVolume : float;
private var startPos : Vector3;
private var lastPos : Vector3;
private var timeUntilExpire : float = 1.0;
private var playedOnce : boolean = false;
private var layerMask;

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
	
	if( Physics.Raycast( transform.position, Vector3( 0, -1, 0 ), impactSoundDistance, layerMask ) && !playedOnce ) {
		Camera.main.audio.PlayOneShot( impactSound );
		playedOnce = true;
	}
}


function OnCollisionEnter( collision : Collision ) {
	if( collision.collider.CompareTag( 'Floor' ) || collision.collider.CompareTag( 'Player' ) ) {	
		/*var rand : int = Random.Range( 5, 10 );
		for( var i = 0; i < rand; i++ ) {
			// instantiate debris
			//var meteor : Meteor = Instantiate( this, transform.position, transform.rotation );
		}*/
		
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