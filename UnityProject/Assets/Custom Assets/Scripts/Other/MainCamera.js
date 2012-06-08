
public var damping : float = 8.0;
public var minimumY : float = 6.75;
public var minimumSize : float = 8.0;
public var padding : float = 2.0;
public var maximumShake : float = 2.0;
public var swayAmount : float = 3.0;

private var averagePosition : Vector3;
private var largestDistance : float;
static var largestX : float;
private var largestY : float;
private var t : float;
private var shake : float = 0.0;
private var averagePositionY_Save : float;
private var largestY_Save : float;
private var sway : Vector3 = Vector3.zero;
private var cameraVelocity = Vector3.zero;

function Update() {
	largestDistance = largestX = largestY = 0.0;
	averagePosition = Vector3.zero;
	t = (damping * Time.deltaTime);
	
	for( var i = 0; i < GameManager.instance.avatars.Length; i++ ) {
		var avatari : Avatar = GameManager.instance.avatars[i].GetComponent( Avatar );
		var iFoot : Vector3 = avatari.getFootPosInWorld();
		var iHead : Vector3 = avatari.getHeadPosInWorld();
		var iRadius : float = avatari.getScaledRadius();
		
		for( var j = 0; j < GameManager.instance.avatars.Length; j++ ) {
			var avatarj : Avatar = GameManager.instance.avatars[j].GetComponent( Avatar );
			
			if (avatari == avatarj) continue; // skip self
			
			var jFoot : Vector3 = avatarj.getFootPosInWorld();
			var jHead : Vector3 = avatarj.getHeadPosInWorld();
			var jRadius : float = avatarj.getScaledRadius();
			
			var iPos : Vector3;
			var jPos : Vector3;
			
			if( iHead.y > jHead.y ) {
				iPos = iHead;
				jPos = jFoot;
			} else {
				iPos = iFoot;
				jPos = jHead;
			}
			
			if( iPos.x > jPos.x ) {
				iPos.x += iRadius;
				jPos.x -= jRadius;
			} else {
				iPos.x -= iRadius;
				jPos.x += jRadius;
			}
			
			var distance : float = Vector3.Distance( iPos, jPos );
			if (distance > largestDistance) largestDistance = distance;
			
			distance = Vector2.Distance( Vector2( iPos.x, 0 ), Vector2( jPos.x, 0 ) );
			if( distance > largestX ) {
				largestX = distance;
				averagePosition.x = ((iPos.x + jPos.x) / 2.0);
			}
			
			distance = Vector2.Distance( Vector2( 0, iPos.y ), Vector2( 0, jPos.y ) );
			if( distance > largestY ) {
				largestY = distance;
				averagePosition.y = ((iPos.y + jPos.y) / 2.0);
			}
		}
	}
	
	Debug.DrawLine( Vector3( averagePosition.x, (averagePosition.y - (largestY * 0.5)), 0.0 ),
		Vector3( averagePosition.x, (averagePosition.y + (largestY * 0.5)), 0.0 ), Color.magenta );
		
	Debug.DrawLine( Vector3( (averagePosition.x - (largestX * 0.5)), averagePosition.y, 0.0 ),
		Vector3( (averagePosition.x + (largestX * 0.5)), averagePosition.y, 0.0 ), Color.magenta );
		
	Debug.DrawLine( Vector3( (averagePosition.x - (largestX * 0.5)), averagePosition.y, 0.0 ),
		Vector3( (averagePosition.x + (largestX * 0.5)), averagePosition.y, 0.0 ), Color.magenta );
	
	//if (averagePosition.y < minimumY) averagePosition.y = minimumY;
	
	// stop the camera from moving for tiny movements on y-axis
	/*if( Mathf.Abs( averagePositionY_Save - averagePosition.y ) > 0.1 ) {
		averagePositionY_Save = averagePosition.y;
		largestY_Save = largestY;
	} else {
		averagePosition.y = averagePositionY_Save;
		largestY = largestY_Save;
	}*/
	
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
		var dblFovTangent : float = (Mathf.Tan( camera.fieldOfView * 0.5 * Mathf.Deg2Rad ) * 2.0);
		var height : float = (dblFovTangent * (Global.sharedZ - camera.transform.position.z));
		var width : float = (height * camera.aspect);
		
		/*if (height < largestY)
			z = -(largestY / dblFovTangent);
		else
			z = -((largestX / camera.aspect) / dblFovTangent);*/
			
		//z = -(((largestX / camera.aspect) + largestY) / dblFovTangent);
		//z = -(largestY / dblFovTangent);
		
		Debug.Log( -(largestY / dblFovTangent) + ' ... ' + -((largestX / camera.aspect) / dblFovTangent) );
		
		//var minSizeCorrect : float = (minimumSize * -2.5);
		//if (z > minSizeCorrect) z = Mathf.Lerp( z, minSizeCorrect, t );
	}
	
	// TODO: this needs some work.
	if( swayAmount > 0.0 ) {
		var temp : float = (Mathf.PingPong( (Time.time * 0.25), swayAmount ) - (swayAmount / 2.0)); // eg: -0.5 to 0.5 for swayAmount of 1.0
		sway = Vector3.Slerp( sway, Vector3( 0.0, (temp / 2.0), temp ), t );
	}
	
	transform.position = Vector3.SmoothDamp( transform.position, (sway + Vector3( averagePosition.x, averagePosition.y, z )), cameraVelocity, t );
	transform.rotation = Quaternion.Slerp( transform.rotation, Quaternion.LookRotation( averagePosition - transform.position ), t );
}

function AddShake( amount : float ) {
	shake += amount;
	if (shake > maximumShake) shake = maximumShake;
}