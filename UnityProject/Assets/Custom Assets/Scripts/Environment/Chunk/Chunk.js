
private var origPos : Vector3;
private var origRot : Quaternion;
private var origLayer : int;
private var origVolume : float;
private var contactTime : float = 0.0; // @TODO: change to "dislodged" (boolean)
private var trigger : boolean = false;
private var debris : GameObject;
private var posOverTime : ArrayList;
private var rotOverTime : ArrayList;
private var frame : int = 0;
public var dislodgedLayer : int = 10;
public var debrisPrefab : GameObject;

function Awake() {
	origPos = transform.position;
	origRot = transform.rotation;
	origLayer = gameObject.layer;
	origVolume = audio.volume;
	rigidbody.constraints = RigidbodyConstraints.FreezeAll;
	posOverTime = new ArrayList();
	rotOverTime = new ArrayList();
}

function Update() {
	renderer.material.color.a = ((contactTime == 0.0 && trigger) ? 0.30 : 1.0);
	if( frame > 0 ) {
		transform.position = posOverTime[frame];
		transform.rotation = rotOverTime[frame--];
		if( frame == 0 ) {
			transform.position = origPos;
			transform.rotation = origRot;
			gameObject.layer = origLayer;
			rigidbody.constraints = RigidbodyConstraints.FreezeAll;		
			posOverTime.Clear();
			rotOverTime.Clear();
			contactTime = 0.0;
		}
	} else if( (contactTime != 0.0) && (rigidbody.velocity.magnitude > 2.0) && (transform.position.y > -2.0) ) {
			posOverTime.Add( transform.position );
			rotOverTime.Add( transform.rotation );
	}
}

function OnCollisionEnter( collision : Collision ) {
	if( !audio.isPlaying ) {
		audio.volume = origVolume * (collision.impactForceSum.magnitude / 40);
		audio.Play();
	}
	if( collision.collider.CompareTag( 'Meteor' ) && (contactTime == 0.0) ) {
		rigidbody.constraints = RigidbodyConstraints.None;
		contactTime = Time.time;
		gameObject.layer = dislodgedLayer;
		debris = Instantiate( debrisPrefab, transform.position, transform.rotation );
		debris.transform.parent = transform;
	}
}

function Reset() {	
	if( (contactTime != 0.0) ) {
		frame = (posOverTime.Count - 1);
		Destroy( debris );
	}
}

function setTrigger( bool : boolean ) {
	trigger = bool;
}