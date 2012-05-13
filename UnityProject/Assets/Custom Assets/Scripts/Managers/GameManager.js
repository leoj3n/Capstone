
public var backgroundMusic : AudioClip[];

static var controllers : Controller[];

function Awake() {
	controllers = new Controller[ControllerID.Count];
	for (var i = 0; i < ControllerID.Count; i++) controllers[i] = new Controller( i );
	
	setBackgroundMusic();
}

function Update() {
	setBackgroundMusic();
}

function setBackgroundMusic() {
	audio.clip = backgroundMusic[Application.loadedLevel];
}
	
	
	
	
	
	
	/*switch( Application.loadedLevel ) {
		case 0:
			break;
		case 1:
			break;
		default:
			break;
	}*/