
public var damping : float = 8.0;
public var minimumY : float = 6.75;
public var minimumSize : float = 8.0;
public var padding : float = 2.0;
public var maximumShake : float = 2.0;

private var avatars : GameObject[];
private var averagePosition : Vector3;
static var largestDistance : float;
private var largestY : float;
private var orthoSize : float;
private var t : float;
private var shake : float = 0.0;

function Start() {
	avatars = GameObject.FindGameObjectsWithTag( 'Player' );
}

function Update() {
	largestDistance = largestY = 0.0;
	averagePosition = Vector3.zero;
	t = (damping * Time.deltaTime);
	
	for( var i = 0; i < avatars.Length; i++ ) {
		averagePosition += avatars[i].transform.position;
		
		for( var j = 0; j < avatars.Length; j++ ) {
			var distance : float = Vector3.Distance( avatars[i].transform.position, avatars[j].transform.position );
			if (distance > largestDistance) largestDistance = distance;
			
			var yDist : float = Mathf.Abs( avatars[i].transform.position.y - avatars[j].transform.position.y );
			if (yDist > largestY) largestY = yDist;
		}
	}
	
	averagePosition /= avatars.Length;
	largestY = ((largestY / 2) + padding);
	orthoSize = ((largestDistance / camera.aspect) / 2) + padding;
	
	if (averagePosition.y < minimumY) averagePosition.y = minimumY;
	if (orthoSize < largestY) orthoSize = largestY;
	if (orthoSize < minimumSize) orthoSize = minimumSize;
	
	if( shake > 0 ) {
		averagePosition += Vector3( Random.Range( -shake, shake ), Random.Range( -shake, shake ), 0.0 );
		shake -= Time.deltaTime;
	}
	
	averagePosition.z = transform.position.z;
	transform.position = Vector3.Lerp( transform.position, averagePosition, t );	
	transform.LookAt( transform.position );
	
	camera.orthographicSize = Mathf.Lerp( camera.orthographicSize, orthoSize, t );
}

function AddShake( amount : float ) {
	shake += amount;
	if (shake > maximumShake) shake = maximumShake;
}