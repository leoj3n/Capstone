
public var chunkPrefab : GameObject;
public var chunkScale : float = 1.0;
public var timeUntilReset : float = 5.0;
private var lastReset : float;
private var chunks : ArrayList;
private var chunkScaleVector : Vector3;

function Start() {
	lastReset = Time.time;
	chunkScaleVector = Vector3( chunkScale, chunkScale, chunkScale );
	renderer.enabled = false; // hide this scene object

	var objectSize : Vector3 = getSize( this );
	var chunkSize : Vector3 = getSize( chunkPrefab );
	
	chunkSize.Scale( chunkScaleVector ); // anticipate additional scaling

	if( (objectSize != Vector3.zero) && (chunkSize != Vector3.zero) ) {
		var xNum : int = (objectSize.x / chunkSize.x);
		var xBegin : float = transform.position.x - (objectSize.x / 2) + (chunkSize.x / 2);
		
		var yNum : int = (objectSize.y / chunkSize.y);
		var yBegin : float = transform.position.y - (objectSize.y / 2) + (chunkSize.y / 2);
		
		var zNum : int = (objectSize.z / chunkSize.z);
		var zBegin : float = transform.position.z - (objectSize.z / 2) + (chunkSize.z / 2);
		
		chunks = new ArrayList();
		
		// fill volume of this scene object with "chunks"
		for( var i = 0; i < xNum; i++ ) {
			for( var j = 0; j < yNum; j++ ) {
				for( var k = 0; k < zNum; k++ ) {
					var chunk : GameObject = Instantiate( chunkPrefab,
						Vector3( (xBegin + i * chunkSize.x), (yBegin + j * chunkSize.y), (zBegin + k * chunkSize.z) ), 
						Quaternion.identity );
					
					 // do additional scaling
					chunk.transform.localScale = Vector3.Scale( chunk.transform.localScale, chunkScaleVector );
					
					// keep track of each chunk in chunks list
					chunks.Add( chunk.gameObject );
				}
			}
		}
	}
}

function getSize( object ) {
	try {
		var size : Vector3 = object.GetComponent( MeshFilter ).sharedMesh.bounds.size;
	} catch( err ) {
		Debug.LogError( err );
		return Vector3.zero; // if unable get size of mesh, return zero
	}
	
	return Vector3.Scale( size, object.transform.localScale ); // apply scaling to get final size
}

function Update() {
	if( (Time.time - lastReset) > timeUntilReset ) {
		for( var chunk : GameObject in chunks ) {
			chunk.SendMessage( 'Reset' );
		}
		lastReset = Time.time;
	}
}

function ignoreAvatarCollision( other : Collider, ignore : boolean ) {
	for( var chunk : GameObject in chunks ) {
		Physics.IgnoreCollision( other.collider, chunk.collider, ignore );
		chunk.GetComponent( 'Chunk' ).setTrigger( ignore );
	}
}