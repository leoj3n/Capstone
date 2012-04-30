/*
public var texture : Texture2D;
public var txa : TextAsset;

private var parentScript : Avatar;
private var rects : Rect[];
private var offsets : RectOffset[];
private var numSprites : int;
private var width : int;
private var height : int;

private var fps : float = 30.0;

function Awake() {
	parentScript = transform.parent.GetComponent( Avatar );
	
	var s : System.IO.Stream = new System.IO.MemoryStream( txa.bytes );
	var br : System.IO.BinaryReader = new System.IO.BinaryReader( s );
	width = read4Bytes( br );
	height = read4Bytes( br );
	numSprites = read4Bytes( br );
	rects = new Rect[numSprites];
	offsets = new RectOffset[numSprites];
	
	// get rectangles
	for( var i = 0; i < numSprites; i++ )
		rects[i] = Rect( read4Bytes( br ), read4Bytes( br ), read4Bytes( br ), read4Bytes( br ) );
	
	// skip names
	for (i = 0; i < numSprites; i++)
		while (br.ReadChar() != 0);
	
	// get rectangle offsets
	for( i = 0; i < numSprites; i++ ) {
		var left = read4Bytes( br );
		var top = read4Bytes( br );
		var right = read4Bytes( br );
		var bottom = read4Bytes( br );
		
		offsets[i] = RectOffset( left, top, right, bottom );
	}
	
	renderer.material.mainTexture = texture;
}

function Update() {	
	var d = parseInt( (Time.timeSinceLevelLoad * fps) % (numSprites) );
	renderer.material.mainTextureOffset = Vector2( (rects[d].x / width), 1.0 - ((rects[d].y + rects[d].height) / height) );
	renderer.material.mainTextureScale = Vector2( (rects[d].width / width), (rects[d].height / height) );
}

function read4Bytes( reader : System.IO.BinaryReader ) {
	return System.BitConverter.ToInt32( reader.ReadBytes( 4 ), 0 );
}*/