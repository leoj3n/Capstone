
public var targets : GameObject[];

private var current : int = 0;
private var desiredRot : Quaternion;

function Start() {
	setDesiredRot();
}

function Update() {	
	if( Input.GetKeyDown( KeyCode.Space ) ) {
		current = ((current == (targets.Length - 1)) ? 0 : (current + 1));		
		setDesiredRot();
		audio.Play();
	}
	
	transform.rotation = Quaternion.Slerp( transform.rotation, desiredRot, Time.deltaTime * 6 );
}

function setDesiredRot() {
	desiredRot = Quaternion.LookRotation( transform.position - targets[current].transform.position );
	desiredRot.x = desiredRot.z = 0;
}