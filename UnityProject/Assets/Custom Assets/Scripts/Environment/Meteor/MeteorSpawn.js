
public var meteorPrefab : GameObject;
public var timeBetween : float = 5.0;
public var yOffset : float = 10.0;
public var debug : boolean = false;
public var disable : boolean = false;
public var layersToShake : LayerMask;
public var maximumShake : float = 2.0;

private var lastSpawnTime : float;
private var shake : float = 0.0;
private var shakeables : Array;

function Start() {
	shakeables = new Array();
}

function Update() {
	if( !disable && !GameManager.instance.cutScenePlaying && ((Time.timeSinceLevelLoad - lastSpawnTime) > timeBetween) ) {
		var range : float = Mathf.Clamp( (Camera.main.GetComponent( 'MainCamera' ).largestX / 2.0), Global.sharedMinX, Global.sharedMaxX );
		
		var xPos : float = Random.Range( (transform.position.x - range), (transform.position.x + range) );
		var yPos : float = (transform.position.y + Camera.main.orthographicSize + yOffset);
		
		if (debug) xPos = 0.0;
			
		Instantiate( meteorPrefab, Vector3( xPos, yPos, Global.sharedZ ), Quaternion.identity );
		
		lastSpawnTime = Time.timeSinceLevelLoad;
	}
			
	// do any necessary shaking of objects
	var i : int;
	if( shake > 0.0 ) {
		var colliders : Collider[] = Physics.OverlapSphere( Vector3.zero, 3000, layersToShake );
		
		for( var collider : Collider in colliders ) {
			var skip : boolean = false;
			
			for( var shakeable : Transform in shakeables ) {
				if ((shakeable == collider.transform) || (collider.transform.position.y > 6.0)) skip = true;
			}
			
			if (!skip) shakeables.Add( collider.transform );
		}
		
		var t : float = (60 * (1 + shake) * Time.deltaTime); // speed of slerp relative to shake value
		var dist : float = (0.4 * Mathf.Clamp01( shake )); // distance of shake relative to shake value
		var shakeRange : float = Global.pingPongRange( t, dist );
		
		for (var shakeable : Transform in shakeables)
			shakeable.position = Vector3.Slerp( shakeable.position, (shakeable.position + Vector3( shakeRange, 0.0, shakeRange )), t );
			
		shake -= Time.deltaTime;
	} else {
		shakeables.Clear();
	}
}

function AddShake( amount : float ) {
	shake += amount;
	if (shake > maximumShake) shake = maximumShake;
}