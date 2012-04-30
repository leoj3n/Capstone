
import MiniJSON;

public var texture : Texture2D[];
public var atlas : TextAsset[];
public var fps : float = 30.0; // should match After Effects render settings
public var staticFrame : int = 0;
public var useTransformScale : boolean = false;

private var textureAtlasArray : TextureAtlas[];
private var textureAtlasIndex : int;
private var origScale : Vector3;
private var scaleFactor : float;

function Awake() {
	origScale = transform.localScale;
	
	 // (Placeholder-Image-Width / X-Axis-Scale)
	if (useTransformScale) scaleFactor = Mathf.Abs(renderer.material.mainTexture.width / origScale.x);
	
	textureAtlasArray = new TextureAtlas[texture.length];
	for (var i = 0; i < texture.Length; i++)
		textureAtlasArray[i] = new TextureAtlas( texture[i], atlas[i] );
}

function Update() {
	applyTextureAtlas( textureAtlasArray[textureAtlasIndex] );
}

function applyTextureAtlas( ta : TextureAtlas ) {
	var index : int = ((fps > 0.0) ? parseInt( (Time.timeSinceLevelLoad * fps) % (ta.frames.Length) ) : staticFrame);
	var frame : Rect = ta.frames[index];
	renderer.material.mainTexture = ta.texture;
	renderer.material.mainTextureOffset = Vector2( (frame.x / ta.width), (1.0 - ((frame.y + frame.height) / ta.height)) );
	renderer.material.mainTextureScale = Vector2( (frame.width / ta.width), (frame.height / ta.height) );
	
	if (!useTransformScale) scaleFactor = Mathf.Abs(frame.width / origScale.x);
	
	transform.localScale = Vector3( ((frame.width / scaleFactor) * Mathf.Sign( origScale.x )), 
		((frame.height / scaleFactor) * Mathf.Sign( origScale.y )), origScale.z );
}

function TextureAtlasIndex( index : int ) {
	textureAtlasIndex = index;
}

class TextureAtlas {
	public var texture : Texture2D;
	public var data : TextAsset;
	public var frames : Rect[];
	public var width : int;
	public var height : int;
	
	private enum atlasType {
		none,
		binary,
		json
	}
	private var type : atlasType;
	
	function TextureAtlas( tex : Texture2D, dat : TextAsset ) {
		texture = tex;
		data = dat;
		readData();
	}
	
	function readData() {
		var path = AssetDatabase.GetAssetPath( data );
		
		// detect type of data
		if (path.Contains( '.bytes' ))
			type = atlasType.binary;
		else if (path.Contains( '.txt' ))
			type = atlasType.json;
		else
			type = atlasType.none;
		
		frameList = new ArrayList();
		
		// load frame data into ArrayList
		switch( type ) {
			case atlasType.binary:
				var br = System.IO.BinaryReader( System.IO.MemoryStream( data.bytes ) );
				
				// order of read4Bytes() calls are important
				width = read4Bytes( br );
				height = read4Bytes( br );
				
				var numFrames = read4Bytes( br );
				for( var i = 0; i < numFrames; i++ ) // load frame data
					frameList.Add( Rect( read4Bytes( br ), read4Bytes( br ), read4Bytes( br ), read4Bytes( br ) ) );
				break;
			case atlasType.json:
				var dict = Json.Deserialize( data.text ) as System.Collections.Generic.Dictionary.<String, Object>;
				
				width = dict['meta']['size']['w'];
				height = dict['meta']['size']['h'];
				
				for (var frame in dict['frames'].Values) // load frame data
					frameList.Add( Rect( frame['frame']['x'], frame['frame']['y'], frame['frame']['w'], frame['frame']['h'] ) ); 
				break;
		}
		
		frames = frameList.ToArray( Rect ); // convert to builtin array for speed increase
	}
	
	function read4Bytes( reader : System.IO.BinaryReader ) {
		return System.BitConverter.ToInt32( reader.ReadBytes( 4 ), 0 );
	}
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