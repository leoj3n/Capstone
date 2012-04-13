
public var damping : float = 8.0;
public var minimumY : float = 6.75;
public var minimumSize : float = 8;

private var avatars : GameObject[];
private var averagePosition : Vector3;
private var largestDistance : float;
private var distance : float;
private var t : float;

function Start() {
	avatars = GameObject.FindGameObjectsWithTag( 'Player' );
	t = (damping * Time.deltaTime);
}

function Update() {
	largestDistance = 0.0;
	averagePosition = Vector3.zero;
	
	for( var i = 0; i < avatars.Length; i++ ) {
		averagePosition += avatars[i].transform.position;
		
		for( var j = 0; j < avatars.Length; j++ ) {
			distance = Vector3.Distance( avatars[i].transform.position, avatars[j].transform.position );
			if (distance > largestDistance) largestDistance = distance;
		}
	}
	
	averagePosition /= avatars.Length;
	//Debug.Log( largestDistance );
	largestDistance /= 2;

	if (averagePosition.y < minimumY) averagePosition.y = minimumY;
	if (largestDistance < minimumSize) largestDistance = minimumSize;
	
	averagePosition.z = transform.position.z;
	transform.position = Vector3.Lerp( transform.position, averagePosition, t );
	transform.LookAt( transform.position );
	
	camera.orthographicSize = Mathf.Lerp( camera.orthographicSize, largestDistance, t );
}