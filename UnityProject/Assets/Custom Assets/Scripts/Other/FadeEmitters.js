
public var delay : float = 0.0;
public var timeUntilFaded : float = 3.0;
public var destroy : boolean = false;

private var startTime : float;
private var origMinEmission : float[];
private var origMaxEmission : float[];
private var emitters : Component[];

function Start() {
	emitters = GetComponentsInChildren( ParticleEmitter );
	startTime = Time.time;
	
	origMinEmission = new float[emitters.Length];
	origMaxEmission = new float[emitters.Length];
	for( var i = 0; i < emitters.Length; i++ ) {
		origMinEmission[i] = emitters[i].particleEmitter.minEmission;
		origMaxEmission[i] = emitters[i].particleEmitter.maxEmission;
	}
}

function Update() {
	var timeSinceStart : float = (Time.time - startTime);
	
	if( delay > 0.0 ) {
		if( timeSinceStart > delay ) {
			delay = 0.0;
			startTime = Time.time;
		}
	} else {
		var percentage : float = Mathf.Clamp01( (timeUntilFaded - timeSinceStart) / timeUntilFaded );
		
		for( var i = 0; i < emitters.Length; i++ ) {
			if (emitters[i] == null) continue;
			
			emitters[i].particleEmitter.minEmission = (origMinEmission[i] * percentage);
			emitters[i].particleEmitter.maxEmission = (origMaxEmission[i] * percentage);
		}
		
		if (destroy && (timeSinceStart > timeUntilFaded)) Destroy( gameObject );
	}
}

// utility function to restart the fading of emitters with new parameters
function restart( d : float, t : float, dstry : boolean ) {
	startTime = Time.time;
	delay = d;
	timeUntilFaded = t;
	destroy = dstry;
	
	for( var i = 0; i < emitters.Length; i++ ) {
		if (emitters[i] == null) continue;
		
		emitters[i].particleEmitter.ClearParticles();
	}
}

// utility function to return time remaining
function getTimeRemaining() : float {
	return (getTotalTime() - (Time.time - startTime));
}

// utility function to return total time
function getTotalTime() : float {
	return (delay + timeUntilFaded);
}