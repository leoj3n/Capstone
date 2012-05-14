
public var chooseYourFighter : AudioClip;
public var swoosh : AudioClip;

//private var activeControllers : Array;
private var rotation : float = 0;

function Awake() {
	//activeControllers = new Array( GameManager.getControllerEnumsWithState( ControllerState.Ready ) );
	
	AudioPlay( chooseYourFighter );
}

function Update() {
	transform.rotation.y = Mathf.Lerp( transform.rotation.y, rotation, Time.deltaTime );
}

function SelectionComplete() {
	//current = 0;
	//setDesiredRot();
	//if (activeControllers.Count == 0) Application.LoadLevel( 2 );
	AudioPlay( chooseYourFighter );
}

function AddRotation( rot : float ) {
	rotation = (transform.rotation.y + rot);
	Debug.Log( transform.rotation.y );
}

function AudioPlay( clip : AudioClip ) {
	audio.clip = clip;
	audio.Play();
}