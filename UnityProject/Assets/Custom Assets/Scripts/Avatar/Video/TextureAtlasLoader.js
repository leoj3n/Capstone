
import MiniJSON;

public var texture : Texture2D[];
public var atlas : TextAsset[];

private var parentScript : Avatar;
private var frames : ArrayList;
private var width : float;
private var height : float;
private var scaleFactor; // (Placeholder-Image-Width / X-Axis-Scale)
private var fps : float = 30.0;
private enum atlasType {
	none,
	binary,
	json
}
private var type : atlasType;
private var origScale : Vector3;

function Awake() {
	parentScript = transform.parent.GetComponent( Avatar );
	
	origScale = transform.localScale;
	scaleFactor = (renderer.material.mainTexture.width / origScale.x);
	
	frames = new ArrayList();
	loadFrames( texture[0], atlas[0] );
}

function Update() {
	// Debug: toggle textures
	if( Input.GetKeyDown( KeyCode.Space ) ) {
		switch( type ) {
			case atlasType.binary:
				loadFrames( texture[1], atlas[1] );
				break;
			case atlasType.json:
				loadFrames( texture[0], atlas[0] );
				break;
		}
	}

	if (type != atlasType.none) renderFrame();
}

function loadFrames( tex : Texture2D, data : TextAsset ) {
	// detect type of data
	var path = AssetDatabase.GetAssetPath( data );
	if (path.Contains( '.bytes' ))
		type = atlasType.binary;
	else if (path.Contains( '.txt' ))
		type = atlasType.json;
	else
		type = atlasType.none;
	
	frames.Clear();
	
	switch( type ) {
		case atlasType.binary:
			var br = System.IO.BinaryReader( System.IO.MemoryStream( data.bytes ) );
			width = read4Bytes( br );
			height = read4Bytes( br );
			var numFrames = read4Bytes( br );
			
			for( var i = 0; i < numFrames; i++ )
				frames.Add( Rect( read4Bytes( br ), read4Bytes( br ), read4Bytes( br ), read4Bytes( br ) ) );
			break;
		case atlasType.json:
			var dict = Json.Deserialize( data.text ) as System.Collections.Generic.Dictionary.<String, Object>;
			
			width = dict['meta']['size']['w'];
			height = dict['meta']['size']['h'];
			
			for (var frame in dict['frames'].Values)
				frames.Add( Rect( frame['frame']['x'], frame['frame']['y'], frame['frame']['w'], frame['frame']['h'] ) ); 
			break;
	}
	
	renderer.material.mainTexture = tex;
}

function renderFrame() {
	Debug.Log( frames.Count );
	
	var index = parseInt( (Time.timeSinceLevelLoad * fps) % (frames.Count) );
	var frame : Rect = frames[index];
				
	renderer.material.mainTextureOffset = Vector2( (frame.x / width), 1.0 - ((frame.y + frame.height) / height) );
	renderer.material.mainTextureScale = Vector2( (frame.width / width), (frame.height / height) );
	transform.localScale = Vector3( (frame.width / scaleFactor), (frame.height / scaleFactor), transform.localScale.z );
}

function read4Bytes( reader : System.IO.BinaryReader ) {
	return System.BitConverter.ToInt32( reader.ReadBytes( 4 ), 0 );
}

/*

TexturePacker Settings:
	
	Data Format: Unity3D
	Texture Format: PNG
	Image Format: RGBA8888
	Dithering: NearestNeighbor
	Autosize: True
	Max Width: 4096
	Max Height: 4096
	Algorithm: MaxRects
	Heuristics: Best
	Border Padding: 0
	Shape Padding: 0
	Inner Padding: 0
	Extrude: 0
	Trim: True
	Trim/Crop Threshold: True
	Enable Auto Alias: True
	

Texture Atlas Generator Settings:
	
	Pack Transparent: True
	Max Width: 4096
	Power of 2 Width: True
	Power of 2 Height: True
	Output Formats: PNG, TXA
	
*/