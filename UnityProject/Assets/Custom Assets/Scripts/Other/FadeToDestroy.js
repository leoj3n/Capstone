
public var delay : float = 0.0;
public var timeUntilDestroy : float = 5.0;

private var startTime : float;
private var origAlpha : float;

function Awake() {
	startTime = Time.time;
	origAlpha = renderer.material.color.a;
}

function Update() {
	var timeSinceStart : float = (Time.time - startTime);
	
	if( delay > 0.0 ) {
		if( timeSinceStart > delay ) {
			delay = 0.0;
			startTime = Time.time;
		}
	} else {
		renderer.material.color.a = origAlpha * (1.0 - (timeSinceStart / timeUntilDestroy));
		if (timeSinceStart > timeUntilDestroy) Destroy( gameObject );
	}
}