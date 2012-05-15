
import MiniJSON;

public var texture : Texture2D[];
public var atlas : TextAsset[];
public var scaleAgainstPlaceholder : boolean = false;
public var fps : float = 30.0; // should match After Effects render settings
public var isStatic : boolean = false;
public var staticFrame : int = 0;
public var loopCount : int = 0;

private var textureAtlasArray : TextureAtlas[];
private var textureAtlasIndex : int;
private var origScale : Vector3;
private var scaleFactor : Vector2 = Vector2( 1.0, 1.0 );
private var fpsTimer : float = 0.0;

function Start() {
	origScale = transform.localScale;
	
	/*
	placeholder.width     frame.width
	------------------ = -------------
	   origScale.x        newScale.x
	
	newScale.x = (origScale.x * frame.width) / placeholder.width
	newScale.x = frame.width * (origScale.x / placeholder.width)
	*/
	
	 // Placeholder-Image / Axis-Scale
	if( scaleAgainstPlaceholder )
		scaleFactor = Vector2( (origScale.x / renderer.material.mainTexture.width), (origScale.y / renderer.material.mainTexture.height) );
		
	//Debug.Log( scaleFactor.ToString( 'F4' ) );
	
	textureAtlasArray = new TextureAtlas[texture.length];
	for (var i = 0; i < texture.Length; i++)
		textureAtlasArray[i] = new TextureAtlas( texture[i], atlas[i] );
		
	applyTextureAtlas( textureAtlasArray[textureAtlasIndex] );
}

function Update() {
	if (!isStatic) applyTextureAtlas( textureAtlasArray[textureAtlasIndex] );
}

function applyTextureAtlas( ta : TextureAtlas ) {
	fpsTimer += Time.deltaTime;
	var index : int = (isStatic ? staticFrame : parseInt( (fpsTimer * fps) % (ta.frames.Length) ));	
	var frame : Rect = ta.frames[index];
	renderer.material.mainTexture = ta.texture;
	renderer.material.mainTextureOffset = Vector2( (frame.x / ta.width), (1.0 - ((frame.y + frame.height) / ta.height)) );
	renderer.material.mainTextureScale = Vector2( (frame.width / ta.width), (frame.height / ta.height) );
	
	if (!scaleAgainstPlaceholder) scaleFactor = Vector2( (origScale.x / frame.width), (origScale.y / frame.height) );
	
	transform.localScale = Vector3( (frame.width * scaleFactor.x), (frame.height * scaleFactor.y), origScale.z );
	
	if (!isStatic && (index == (ta.frames.Length - 1))) loopCount++;
}

function TextureAtlasIndex( index : int ) {
	if( index != textureAtlasIndex ) {
		textureAtlasIndex = index;
		loopCount = 0;
		fpsTimer = 0.0;
	}
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
		// detect type of data
		type = ((data.text.Length > 0) ? atlasType.json : atlasType.binary);
		
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