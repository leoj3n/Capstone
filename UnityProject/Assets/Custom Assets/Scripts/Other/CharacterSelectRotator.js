
private var targets : Vector3[];
private var current : int = 0;
private var desiredRot : Quaternion;

function Awake() {
	// set targets[]
	var objectsWithTag : GameObject[] = GameObject.FindGameObjectsWithTag( 'Target' );
	targets = new Vector3[objectsWithTag.Length];
	for( i = 0; i < objectsWithTag.Length; i++ ) {
		targets[i] = objectsWithTag[i].transform.position;
		Debug.Log( objectsWithTag[i].transform.position );
	}
	
	// order matters, do this second
	setDesiredRot();
}

function Update() {
	if( Input.GetKeyDown( KeyCode.LeftArrow ) ) {
		current = ((current + 1) % targets.Length);
		setDesiredRot();
		audio.Play();
	} else if( Input.GetKeyDown( KeyCode.RightArrow ) ) {
		current = ((current - 1) % targets.Length);
		if (current < 0) current = (targets.Length - 1);
		setDesiredRot();
		audio.Play();
	}
	
	transform.rotation = Quaternion.Slerp( transform.rotation, desiredRot, Time.deltaTime * 6 );
}

function setDesiredRot() {
	desiredRot = Quaternion.LookRotation( targets[current] - transform.position );
	desiredRot.x = desiredRot.z = 0;
	Debug.Log( desiredRot );
}