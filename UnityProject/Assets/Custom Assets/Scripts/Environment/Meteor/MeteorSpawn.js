
public var meteorPrefab : GameObject;
public var timeBetween : float = 5.0;
public var yOffset : float = 10.0;

private var lastSpawnTime : float;
private var range : float;

function Start() {
	lastSpawnTime = Time.time;
}

function Update() {
	if( (Time.time - lastSpawnTime) > timeBetween ) {
		range = Mathf.Clamp( (camera.orthographicSize * camera.aspect), Global.sharedMinX, Global.sharedMaxX );
		
		Instantiate( meteorPrefab,
			Vector3( Random.Range( (transform.position.x - range), (transform.position.x + range) ),
				(transform.position.y + camera.orthographicSize + yOffset),
				Global.sharedZ ),
			Quaternion.identity );
		
		lastSpawnTime = Time.time;
	}
}