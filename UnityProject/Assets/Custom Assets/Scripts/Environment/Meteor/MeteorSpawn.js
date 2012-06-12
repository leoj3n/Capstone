
public var meteorPrefab : GameObject;
public var timeBetween : float = 5.0;
public var yOffset : float = 10.0;
public var debug : boolean = false;
public var disable : boolean = false;
public var layersToShake : LayerMask;
public var maximumShake : float = 2.0;
public var maximumHeightToShakeFrom : float = 12.0;

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
		
		var xPos : float = Random.Range( (Camera.main.transform.position.x - range), (Camera.main.transform.position.x + range) );
		var yPos : float = (Camera.main.transform.position.y + Camera.main.orthographicSize + yOffset);
		
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
				if ((shakeable == object.transform) || (object.transform.position.y > (maximumHeightToShakeFrom / 2.0))) skip = true;
			}
			
			if (!skip) shakeables.Add( object.transform );
		}
		
		var t : float = (70.0 * (1.0 + shake) * Time.deltaTime); // speed shake relative to shake value
		var dist : float = (0.3 * Mathf.Clamp01( shake )); // distance of shake relative to shake value
		var shakeRange : float = (Mathf.Round( Global.pingPongRange( t, dist ) * 100.0) / 100.0); // round to two decimal places
		var shakeVector : Vector3 = Vector3( shakeRange, (shakeRange / 4.0), (shakeRange / 2.0) );
		cumulativeShakeVector += shakeVector;
		
		for( var shakeable : Transform in shakeables ) {
			if (shakeable == null) continue;
			
			shakeable.position += shakeVector;
		}
			
		shake -= Time.deltaTime;
	} else {
		var beforeChange : Vector3 = cumulativeShakeVector;
		cumulativeShakeVector = Vector3.Lerp( cumulativeShakeVector, Vector3.zero, (Time.deltaTime * 4.0) );
		var lerpDelta : Vector3 = (beforeChange - cumulativeShakeVector);
		
		if( lerpDelta == Vector3.zero ) {
			shakeables.Clear(); // shake has been undone, safe to clear the array
		} else if( shakeables.Count > 0 ) {
			// undo shake over time
			for( var shakeable : Transform in shakeables ) {
				if (shakeable == null) continue;
				
				shakeable.position -= lerpDelta;
			}
		}
	}
}

function AddShake( fromPoint : Vector3 ) {
	shake += (Mathf.Max( (maximumHeightToShakeFrom - fromPoint.y), 0.0 ) * (1.2 / maximumHeightToShakeFrom));
	if (shake > maximumShake) shake = maximumShake;
}