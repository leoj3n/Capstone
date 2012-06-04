
public var chunkPrefab : GameObject;
public var chunkScale : float = 1.0;
public var timeUntilReset : float = 5.0;

private var lastReset : float;
private var chunks : ArrayList;
private var chunkScaleVector : Vector3;

function Start() {
	chunkScaleVector = Vector3( chunkScale, chunkScale, chunkScale );
	renderer.enabled = false; // hide the scene object

	var objectSize : Vector3 = Global.getSize( this );
	var chunkSize : Vector3 = Global.getSize( chunkPrefab );
	
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
					
					// set this volume as parent
					chunk.transform.parent = transform;
					
					// keep track of each chunk in chunks list
					chunks.Add( chunk.gameObject );
				}
			}
		}
	}
}

function Update() {
	if( (Time.timeSinceLevelLoad - lastReset) > timeUntilReset ) {
		for (var chunk : GameObject in chunks) chunk.SendMessage( 'Return' );
		lastReset = Time.timeSinceLevelLoad;
	}
}

function ignoreAvatarCollision( other : Collider, ignore : boolean ) {
	for( var chunk : GameObject in chunks ) {
		Physics.IgnoreCollision( other.collider, chunk.collider, ignore );
		chunk.GetComponent( Chunk ).setTrigger( ignore );
	}
}