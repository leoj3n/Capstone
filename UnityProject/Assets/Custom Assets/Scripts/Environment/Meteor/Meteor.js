
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

private var angleAmount : float = 0.05;

function Awake() {
	origVolume = audio.volume;
	audio.volume = 0;
	startPos = lastPos = transform.position;
	layerMask = ~(1 << avatarLayer); // layer mask for use in raycast
	additionalVelocity = Vector3( (Random.Range( 0.0, angleAmount ) * ((startPos.x < 0.0) ? -1 : 1 )), 0.0, 0.0 );
}

function Update() {
	rigidbody.velocity += additionalVelocity;
	
	var directionOfTravel : Vector3 = (transform.position - lastPos).normalized;
	
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
			Camera.main.audio.PlayOneShot( impactSound ); // play on camera because this gets destroyed
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
		Camera.main.audio.PlayOneShot( explodeSound );
		Camera.main.audio.PlayOneShot( audio.clip, 0.5 ); // crackle
		
		// instantiate a detonator
		GameObject.Instantiate( detonatorPrefab, transform.position, Quaternion.identity );
				
		// add explosion force to avatars that are within 7 units
		Global.avatarExplosion( Manager.avatars, transform.position, 7, 2, 6 );
		
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














		
		// apply an explosion force to nearby objects
		/*var radius = 10.0;
		var colliders : Collider[] = Physics.OverlapSphere( transform.position, radius );
		for( var collider : Collider in colliders ) {
			//if (collider.GetComponent( CharacterController )) collider.GetComponent( CharacterController ).enabled = false;
			if (!collider) continue;
			if (collider.rigidbody) collider.rigidbody.AddExplosionForce( 200.0 + (collision.impactForceSum.magnitude * 20), transform.position, radius, 8.0 );
		}*/

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