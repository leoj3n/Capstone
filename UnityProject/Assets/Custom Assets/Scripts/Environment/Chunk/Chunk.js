
public var dislodgedLayer : LayerMask = -1; // only select one!
public var debrisPrefab : GameObject;
public var hitSound : AudioClip;

private var shaderSolid : Shader;
private var shaderTransparent : Shader;
private var origPos : Vector3;
private var origRot : Quaternion;
private var origLayer : int;
private var dislodged : boolean = false;
private var trigger : boolean = false;
private var debris : GameObject;
private var posOverTime : ArrayList;
private var rotOverTime : ArrayList;
private var frame : int = 0;

function Start() {
	shaderSolid = Shader.Find( 'Diffuse' );
	shaderTransparent = Shader.Find( 'Transparent/Diffuse' );
	origPos = transform.position;
	origRot = transform.rotation;
	origLayer = gameObject.layer;
	rigidbody.constraints = RigidbodyConstraints.FreezeAll;
	rigidbody.isKinematic = true;
	posOverTime = new ArrayList();
	rotOverTime = new ArrayList();
	
	GameManager.instance.audioBind( GetInstanceID(), hitSound );
}

function Update() {
	if( !dislodged && trigger ) {
		renderer.material.shader = shaderTransparent;
		renderer.material.color.a = 0.3;
	} else {
		renderer.material.shader = shaderSolid;
		renderer.material.color.a = 1.0;
	}
	
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
	if (frame == 0) GameManager.instance.audioPlay( GetInstanceID(), true, false, (collision.impactForceSum.magnitude / 10) );
	
	if( !dislodged && collision.collider.CompareTag( 'Meteor' ) ) {
		rigidbody.constraints = RigidbodyConstraints.None;
		rigidbody.isKinematic = false;
		gameObject.layer = parseInt( Mathf.Log( dislodgedLayer.value, 2 ) );
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