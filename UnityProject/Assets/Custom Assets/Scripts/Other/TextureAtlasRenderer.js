
import MiniJSON;

enum ScaleAnchor { Center, Top, Bottom, Left, Right }

public var texture : Texture2D[];
public var atlas : TextAsset[];
public var scaleAgainstPlaceholder : boolean = false;
public var scaleAnchor : ScaleAnchor;
public var fps : float = 30.0; // should match (or be close to) After Effects composition settings
public var isStatic : boolean = false;
public var staticFrame : int = 0;
public var reverse : boolean = false;

private var textureAtlasArray : TextureAtlas[];
private var textureAtlasIndex : int;
private var origScale : Vector3;
private var attachedController : CharacterController;
private var origRadius : float;
private var scaleFactor : Vector2 = Vector2( 1.0, 1.0 );
private var fpsTimer : float = 0.0;
private var frameIndex : int = 0;
private var loopCount : int = 0;

function Start() {
	origScale = Global.absoluteVector( transform.localScale );
	
	attachedController = GetComponent( CharacterController );
	if (attachedController) origRadius = attachedController.radius;
	
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
	applyTextureAtlas( textureAtlasArray[textureAtlasIndex] );
}

function applyTextureAtlas( ta : TextureAtlas ) {
	fpsTimer += Time.deltaTime;
	
	frameIndex = parseInt( (fpsTimer * fps) % ta.frames.Length );
	if (reverse) frameIndex = ((ta.frames.Length - 1) - frameIndex);
	if (isStatic) frameIndex = staticFrame;
	
	var frame : Rect = ta.frames[frameIndex];
	renderer.material.mainTexture = ta.texture;
	renderer.material.mainTextureOffset = Vector2( (frame.x / ta.width), (1.0 - ((frame.y + frame.height) / ta.height)) );
	renderer.material.mainTextureScale = Vector2( (frame.width / ta.width), (frame.height / ta.height) );
	
	if (!scaleAgainstPlaceholder) scaleFactor = Vector2( (origScale.x / frame.width), (origScale.y / frame.height) );
	
	var scaleFromSide : boolean = (scaleAnchor != ScaleAnchor.Center); // set a helper variable
	if (scaleFromSide) var sizeBeforeScale : Vector3 = Global.getSize( gameObject );
	
	transform.localScale = Global.multiplyVectorBySigns( Vector3( (frame.width * scaleFactor.x), 
		(frame.height * scaleFactor.y), origScale.z ), transform.localScale );
	
	// update position to compensate for scale
	if( scaleFromSide ) {
		var sizeDiff : Vector3 = ((Global.getSize( gameObject ) - sizeBeforeScale) / 2);
		switch( scaleAnchor ) {
			case ScaleAnchor.Top:
				transform.position.y -= sizeDiff.y;
				break;
			case ScaleAnchor.Bottom:
				transform.position.y += sizeDiff.y;
				break;
			case ScaleAnchor.Left:
				transform.position.x += sizeDiff.x;
				break;
			case ScaleAnchor.Right:
				transform.position.x -= sizeDiff.x;
				break;
		}
	}
	
	// update radius to compensate for scale
	if (scaleAgainstPlaceholder && attachedController)
		attachedController.radius = (origRadius * Mathf.Abs( origScale.x / transform.localScale.x ));
	
	if (!isStatic && (frameIndex == (ta.frames.Length - 1))) loopCount++;
}

function setTextureAtlasIndex( index : int ) {
	if( index != textureAtlasIndex ) {
		textureAtlasIndex = index;
		loopCount = 0;
		fpsTimer = 0.0;
	}
}

function getLoopCount() {
	return loopCount;
}

function getFrameIndex() {
	return frameIndex;
}

function getFrameCount() {
	return textureAtlasArray[textureAtlasIndex].frames.Length;
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