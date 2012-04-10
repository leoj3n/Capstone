public var magnitude : float = 2.0f;
public var cameraSubject : Vector3 = new Vector3( 0, 5, 0 );

private var cameraShakeSubject : Vector3;
private var shakeTimer : float;
private var timerRemaining : float;
private var timerActive : boolean;
private var shakeDone : boolean;

// Use this for initialization
function Start() {
	transform.LookAt( cameraSubject );
	timerActive = false;
	shakeDone = true;
}

// Update is called once per frame
function Update() {
	if( timerActive ) {
		timerRemaining -= Time.deltaTime;
		cameraShakeSubject = cameraSubject;
		
		var temp : float;
		if( timerRemaining < 2/shakeTimer ) {
			temp = 1 - (timerRemaining/shakeTimer);
			cameraShakeSubject.x += Random.Range( magnitude * -temp, magnitude * temp ); 
			cameraShakeSubject.y += Random.Range( magnitude * -temp, magnitude * temp ); 
			cameraShakeSubject.z += Random.Range( magnitude * -temp, magnitude * temp ); 
		} else {
			temp = timerRemaining/shakeTimer;
			cameraShakeSubject.x += Random.Range( magnitude * -temp, magnitude * temp ); 
			cameraShakeSubject.y += Random.Range( magnitude * -temp, magnitude * temp ); 
			cameraShakeSubject.z += Random.Range( magnitude * -temp, magnitude * temp ); 
		}
		transform.LookAt( cameraShakeSubject );
		cameraShakeSubject = cameraSubject;
		
		if( timerRemaining < 0.5f ){
			timerActive = false;
			timerRemaining = shakeTimer;
		}
	} else if( !shakeDone ) {
		transform.LookAt( cameraSubject );
		shakeDone = true;	
	}
}

function CameraShake( shakeTime : float ) {
	timerRemaining = shakeTimer = shakeTime;
	timerActive = true;
	shakeDone = false;
}
