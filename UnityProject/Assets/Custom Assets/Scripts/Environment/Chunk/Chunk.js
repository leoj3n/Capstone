
public var dislodgedLayer : int = 10;
public var debrisPrefab : GameObject;

private var origPos : Vector3;
private var origRot : Quaternion;
private var origLayer : int;
private var origVolume : float;
private var dislodged : boolean = false;
private var trigger : boolean = false;
private var debris : GameObject;
private var posOverTime : ArrayList;
private var rotOverTime : ArrayList;
private var frame : int = 0;

function Awake() {
	origPos = transform.position;
	origRot = transform.rotation;
	origLayer = gameObject.layer;
	origVolume = audio.volume;
	rigidbody.constraints = RigidbodyConstraints.FreezeAll;
	rigidbody.isKinematic = true;
	posOverTime = new ArrayList();
	rotOverTime = new ArrayList();
}

function Update() {
	renderer.material.color.a = ((!dislodged && trigger) ? 0.30 : 1.0);
	if( frame > 0 ) {
		transform.position = posOverTime[frame];
		transform.rotation = rotOverTime[frame--];
		if( frame == 0 ) {
			transform.position = origPos;
			transform.rotation = origRot;
			gameObject.layer = origLayer;
			rigidbody.constraints = RigidbodyConstraints.FreezeAll;
			rigidbody.isKinematic = true;
			posOverTime.Clear();
			rotOverTime.Clear();
			dislodged = false;
		}
	} else if( dislodged ) {
		if( (posOverTime.Count < 1) || ((Vector3.Distance( transform.position, origPos ) < 5.0) && (posOverTime.Count < 12)) ) {
			posOverTime.Add( transform.position );
			rotOverTime.Add( transform.rotation );
		}
	}
}

function OnCollisionEnter( collision : Collision ) {
	if( !audio.isPlaying ) {
		audio.volume = origVolume * (collision.impactForceSum.magnitude / 20);
		audio.Play();
	}
	
	if( !dislodged && collision.collider.CompareTag( 'Meteor' ) ) {
		rigidbody.constraints = RigidbodyConstraints.None;
		rigidbody.isKinematic = false;
		gameObject.layer = dislodgedLayer;
		dislodged = true;
		
		debris = Instantiate( debrisPrefab, transform.position, transform.rotation );
		debris.transform.parent = transform;
		rigidbody.AddExplosionForce( (collision.impactForceSum.magnitude * 20), collision.transform.position, 0.0, 0.0, ForceMode.Acceleration );
	}
}

function Return() {
	if( dislodged ) {
		frame = (posOverTime.Count - 1);
		Destroy( debris );
	}
}

function setTrigger( bool : boolean ) {
	trigger = bool;
}

function OnTriggerStay( other : Collider ) {
	if (other.collider.CompareTag( 'Meteor' )) rigidbody.isKinematic = false;
}

function OnTriggerExit( other : Collider ) {
	if (!dislodged && other.collider.CompareTag( 'Meteor' )) rigidbody.isKinematic = true;
}