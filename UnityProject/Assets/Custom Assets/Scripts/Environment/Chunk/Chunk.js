
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
			posOverTime.Clear();
			rotOverTime.Clear();
			dislodged = false;
		}
	} else if( dislodged && (rigidbody.velocity.magnitude > 2.0) && 
		(Vector3.Distance( transform.position, origPos ) < 5.0) && (posOverTime.Count < 12) ) {
			posOverTime.Add( transform.position );
			rotOverTime.Add( transform.rotation );
	}
}

function OnCollisionEnter( collision : Collision ) {
	if( !audio.isPlaying ) {
		audio.volume = origVolume * (collision.impactForceSum.magnitude / 20);
		audio.Play();
	}
	
	if( !dislodged && collision.collider.CompareTag( 'Meteor' ) ) {
		debris = Instantiate( debrisPrefab, transform.position, transform.rotation );
		debris.transform.parent = transform;
		rigidbody.AddExplosionForce( 400.0, collision.transform.position, 0.0, 0.0, ForceMode.Acceleration );
		
		rigidbody.constraints = RigidbodyConstraints.None;
		gameObject.layer = dislodgedLayer;
		dislodged = true;
	}
}

function Reset() {	
	if( dislodged ) {
		frame = (posOverTime.Count - 1);
		Destroy( debris );
	}
}

function setTrigger( bool : boolean ) {
	trigger = bool;
}