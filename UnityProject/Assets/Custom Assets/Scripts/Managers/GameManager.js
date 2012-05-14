
public var backgroundMusic : AudioClip[];

static var controllers : Controller[];

function Awake() {
	// ControllerEnum is used to build and access the controllers array
	controllers = new Controller[ControllerEnum.Count];
	for (var i = 0; i < ControllerEnum.Count; i++)
		controllers[i] = new Controller( i );
	
	setBackgroundMusic();
}

function Update() {
	setBackgroundMusic();
}

function setBackgroundMusic() {
	audio.clip = backgroundMusic[Application.loadedLevel];
}

static function getControllerEnumsWithState( state : ControllerState ) : ControllerEnum[] {
	enumArray = new Array();
	
	for( i = 0; i < ControllerEnum.Count; i++ ) {
		if (controllers[i].state == state) enumArray.Push( i );
	}
	
	return enumArray.ToBuiltin( ControllerEnum );
}

static function getController( ce : ControllerEnum ) : Controller {
	return controllers[ce];
}