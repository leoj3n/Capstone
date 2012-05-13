
public var chooseYourFighter : AudioClip;
public var swoosh : AudioClip;

private var targets : Vector3[];
private var templates : AvatarTemplate[];
private var current : int = 0;
private var desiredRot : Quaternion;
private var activeControllers : Array;

function Awake() {
	var objectsWithTag : GameObject[] = GameObject.FindGameObjectsWithTag( 'Target' );
	targets = new Vector3[objectsWithTag.Length];
	templates = new AvatarTemplate[objectsWithTag.Length];
	for( var i = 0; i < objectsWithTag.Length; i++ ) {
		targets[i] = objectsWithTag[i].transform.position; // set targets[]
		templates[i] = objectsWithTag[i].transform.parent.GetComponentInChildren( AvatarTemplate );
	}
	
	// order matters, do this after setting targets
	setDesiredRot();
	
	activeControllers = new Array();
	for( i = 0; i < ControllerID.Count; i++ ) {
		if (GameManager.controllers[i].active) activeControllers.Push( i );
	}
	
	audioPlay( chooseYourFighter );
}

function Update() {
	var leftArrow : boolean = Input.GetKeyDown( KeyCode.LeftArrow );
	var rightArrow : boolean = Input.GetKeyDown( KeyCode.RightArrow );
	
	if( leftArrow ) {
		current = ((current + 1) % targets.Length);
	} else if( rightArrow ) {
		current = ((current - 1) % targets.Length);
		if (current < 0) current = (targets.Length - 1);
	}
	
	if( leftArrow || rightArrow ) {
		setDesiredRot();
		audioPlay( templates[current].sound[AvatarSound.AnnouncerName] );
		audio.PlayOneShot( swoosh, 1.0 );
	}
	
	transform.rotation = Quaternion.Slerp( transform.rotation, desiredRot, Time.deltaTime * 6 );
	
	if( Input.GetKeyDown( KeyCode.Space ) ) {
		GameManager.controllers[activeControllers.Pop()].avatar = current;
		current = 0;
		setDesiredRot();
		if (activeControllers.Count == 0) Application.LoadLevel( 2 );
		audioPlay( chooseYourFighter );
	}
}

function audioPlay( clip ) {
	audio.clip = clip;
	audio.Play();
}

function setDesiredRot() {
	desiredRot = Quaternion.LookRotation( targets[current] - transform.position );
	desiredRot.x = desiredRot.z = 0;
}