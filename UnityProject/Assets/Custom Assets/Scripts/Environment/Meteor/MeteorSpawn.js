
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
private var cumulativeShakeVector : Vector3;

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
		var objectsToShake : GameObject[] = Global.findGameObjectsUsingLayerMask( layersToShake );
		
		for( var object : GameObject in objectsToShake ) {
			var skip : boolean = false;
			
			for( var shakeable : Transform in shakeables ) {
				if ((shakeable == object.transform) || (object.transform.position.y > 6.0)) skip = true;
			}
			
			if (!skip) shakeables.Add( object.transform );
		}
		
		var t : float = (60 * (1 + shake) * Time.deltaTime); // speed of slerp relative to shake value
		var dist : float = (0.4 * Mathf.Clamp01( shake )); // distance of shake relative to shake value
		var shakeRange : float = (Mathf.Round( Global.pingPongRange( t, dist ) * 100.0) / 100.0); // round to two decimal places
		var shakeVector : Vector3 = Vector3( shakeRange, 0.0, shakeRange );
		cumulativeShakeVector += shakeVector;
		
		for( var shakeable : Transform in shakeables ) {
			if (shakeable == null) continue;
			
			shakeable.position += shakeVector;
		}
			
		shake -= Time.deltaTime;
	} else {
		var beforeChange : Vector3 = cumulativeShakeVector;
		cumulativeShakeVector = Vector3.Lerp( cumulativeShakeVector, Vector3.zero, (Time.deltaTime * 2.0) );
		var lerpDelta : Vector3 = (beforeChange - cumulativeShakeVector);
		
		if( lerpDelta == Vector3.zero ) {
			shakeables.Clear(); // shake has been undone, safe to clear the array
		} else {
			// undo shake over time
			for (var shakeable : Transform in shakeables) shakeable.position -= lerpDelta;
		}
	}
}

function AddShake( amount : float ) {
	shake += amount;
	if (shake > maximumShake) shake = maximumShake;
}