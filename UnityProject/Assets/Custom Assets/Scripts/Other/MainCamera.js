
public var damping : float = 8.0;
public var minimumY : float = 6.75;
public var minimumSize : float = 8.0;
public var padding : float = 2.0;
public var maximumShake : float = 2.0;
public var audioListenerVolume : float = 1.0;

private var averagePosition : Vector3;
private var largestDistance : float;
static var largestX : float;
private var largestY : float;
private var t : float;
private var shake : float = 0.0;
private var audioListener : AudioListener;

private var averagePositionY_Save : float;
private var largestY_Save : float;

function Start() {
	audioListener = GetComponent( AudioListener );
}

function Update() {
	audioListener.volume = audioListenerVolume;
	
	largestDistance = largestX = largestY = 0.0;
	averagePosition = Vector3.zero;
	t = (damping * Time.deltaTime);
	
	for( var i = 0; i < GameManager.instance.avatars.Length; i++ ) {
		var iPos : Vector3 = GameManager.instance.avatars[i].GetComponent( Avatar ).getCenterInWorld();
		
		averagePosition += iPos;
		
		for( var j = 0; j < GameManager.instance.avatars.Length; j++ ) {
			var jPos : Vector3 = GameManager.instance.avatars[j].GetComponent( Avatar ).getCenterInWorld();
			
			var distance : float = Vector3.Distance( iPos, jPos );
			if (distance > largestDistance) largestDistance = distance;
			
			distance = Vector2.Distance( Vector2( iPos.x, 0 ), Vector2( jPos.x, 0 ) );
			if (distance > largestX) largestX = distance;
			
			distance = Vector2.Distance( Vector2( 0, iPos.y ), Vector2( 0, jPos.y ) );
			if (distance > largestY) largestY = distance;
		}
	}
	
	averagePosition /= GameManager.instance.avatars.Length;
	
	if (averagePosition.y < minimumY) averagePosition.y = minimumY;
	
	// stop the camera from moving for tiny movements on y-axis
	if( Mathf.Abs( averagePositionY_Save - averagePosition.y ) > 0.1 ) {
		averagePositionY_Save = averagePosition.y;
		largestY_Save = largestY;
	} else {
		averagePosition.y = averagePositionY_Save;
		largestY = largestY_Save;
	}
	
	if( shake > 0 ) {
		averagePosition += Vector3( Random.Range( -shake, shake ), Random.Range( -shake, shake ), 0.0 );
		shake -= Time.deltaTime;
	}
	
	var z : float = transform.position.z;
	if( camera.isOrthoGraphic ) {
		largestY = ((largestY / 2) + padding);
		var orthoSize : float = ((largestDistance / camera.aspect) / 2) + padding;
		if (orthoSize < largestY) orthoSize = largestY;
		if (orthoSize < minimumSize) orthoSize = minimumSize;
		camera.orthographicSize = Mathf.Lerp( camera.orthographicSize, orthoSize, t );
	} else {		
		var height : float = (Mathf.Tan( camera.fieldOfView * 0.5 * Mathf.Deg2Rad ) * (Global.sharedZ - camera.transform.position.z) * 2);
		var width : float = height * camera.aspect;
		
		largestX += (padding * 2);
		largestY += (padding * 2);
		
		if (height < largestY)
			z = -(largestY / (Mathf.Tan( camera.fieldOfView * 0.5 * Mathf.Deg2Rad ) * 2));
		else
			z = -((largestX / camera.aspect) / (Mathf.Tan( camera.fieldOfView * 0.5 * Mathf.Deg2Rad ) * 2));
				
		if (z > (minimumSize * -2.5)) z = (minimumSize * -2.5);
	}
	
	transform.position = Vector3.Lerp( transform.position, Vector3( averagePosition.x, averagePosition.y, z ), t );	
	transform.LookAt( averagePosition );
}

function AddShake( amount : float ) {
	shake += amount;
	if (shake > maximumShake) shake = maximumShake;
}