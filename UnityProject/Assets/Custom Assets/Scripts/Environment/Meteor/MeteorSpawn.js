
public var meteorPrefab : GameObject;
public var timeBetween : float = 5.0;
public var yOffset : float = 10.0;
public var debug : boolean = false;

private var lastSpawnTime : float;
private var range : float;

function Awake() {
	lastSpawnTime = Time.time;
}

function Update() {
	if( (Time.time - lastSpawnTime) > timeBetween ) {
		range = Mathf.Clamp( (GetComponent( 'MainCamera' ).largestX / 2), Global.sharedMinX, Global.sharedMaxX );
		
		var xPos : float = Random.Range( (transform.position.x - range), (transform.position.x + range) );
		var yPos : float = (transform.position.y + camera.orthographicSize + yOffset);
		
		if (debug) xPos = 0.0;
			
		Instantiate( meteorPrefab, Vector3( xPos, yPos, Global.sharedZ ), Quaternion.identity );
		
		lastSpawnTime = Time.time;
	}
}