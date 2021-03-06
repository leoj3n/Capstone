
import MiniJSON;

enum ScaleAnchorV { Center, Top, Bottom }
enum ScaleAnchorH { Middle, Left, Right }

public var texture : Texture2D[];
public var atlas : TextAsset[];
public var scaleAgainstPlaceholder : boolean = false;
public var scaleAnchorVert : ScaleAnchorV;
public var scaleAnchorHoriz : ScaleAnchorH;
public var fps : float = 30.0; // should match (or be close to) After Effects composition settings
public var isStatic : boolean = false;
public var staticFrame : int = 0;
public var allowLooping : boolean = true;
public var reverse : boolean = false;

private var textureAtlasArray : TextureAtlas[];
private var textureAtlasIndex : int;
private var origScale : Vector3;
private var origLocalPos : Vector3;
private var scalePos : Vector3 = Vector3.zero;
private var scaleFactor : Vector2 = Vector2( 1.0, 1.0 );
private var fpsTimer : float = 0.0;
private var frameIndex : int = 0;
private var previousFrameIndex : int = 0;
private var loopCount : int = 0;
private var offsetPosition : Vector3 = Vector3.zero;
private var scaleFixPos : Vector3 = Vector3.zero;
private var timeFactor : float = 1.0;

function Awake() {
	origScale = Global.absoluteVector( transform.localScale );
	origLocalPos = transform.localPosition;
	
	 // Placeholder-Image / Axis-Scale
	if( scaleAgainstPlaceholder )
		scaleFactor = Vector2( (origScale.x / renderer.material.mainTexture.width), (origScale.y / renderer.material.mainTexture.height) );
}

function Start() {
	textureAtlasArray = new TextureAtlas[texture.length];
	for (var i = 0; i < texture.Length; i++)
		textureAtlasArray[i] = new TextureAtlas( texture[i], atlas[i] );
		
	applyTextureAtlas( textureAtlasArray[textureAtlasIndex] );
}

function Update() {
	if (!allowLooping && (loopCount > 0)) return;
	
	applyTextureAtlas( textureAtlasArray[textureAtlasIndex] );
}

function applyTextureAtlas( ta : TextureAtlas ) {
	fpsTimer += (Time.deltaTime * timeFactor);
	
	frameIndex = parseInt( (fpsTimer * fps) % ta.frames.Length );
	if (reverse) frameIndex = ((ta.frames.Length - 1) - frameIndex);
	if (isStatic) frameIndex = staticFrame;
	
	var frame : Rect = ta.frames[frameIndex];
	renderer.material.mainTexture = ta.texture;
	renderer.material.mainTextureOffset = Vector2( (frame.x / ta.width), (1.0 - ((frame.y + frame.height) / ta.height)) );
	renderer.material.mainTextureScale = Vector2( (frame.width / ta.width), (frame.height / ta.height) );
	
	if (!scaleAgainstPlaceholder) scaleFactor = Vector2( (origScale.x / frame.width), (origScale.y / frame.height) );
	
	var sizeBeforeScale : Vector3 = Global.getSize( gameObject );
	transform.localScale = Global.multiplyVectorBySigns( Vector3( (frame.width * scaleFactor.x), 
		(frame.height * scaleFactor.y), origScale.z ), transform.localScale );
	var sizeDiff : Vector3 = ((Global.getSize( gameObject ) - sizeBeforeScale) / 2.0);
	
	// update position to compensate for scale
	var xAmount : float = Mathf.Abs( origScale.x / 2 );
	var yAmount : float = Mathf.Abs( origScale.y / 2 );
	switch( scaleAnchorHoriz ) {
		case ScaleAnchorH.Left:
			scaleFixPos.x += sizeDiff.x;
			scalePos.x = xAmount;
			break;
		case ScaleAnchorH.Right:
			scaleFixPos.x -= sizeDiff.x;
			scalePos.x = -xAmount;
			break;
		default:
			scalePos.x = 0.0;
			break;
	}
	switch( scaleAnchorVert ) {
		case ScaleAnchorV.Top:
			scaleFixPos.y -= sizeDiff.y;
			scalePos.y = -yAmount;
			break;
		case ScaleAnchorV.Bottom:
			scaleFixPos.y += sizeDiff.y;
			scalePos.y = yAmount;
			break;
		default:
			scalePos.y = 0.0;
			break;
	}
	
	transform.localPosition = (origLocalPos + scalePos + scaleFixPos + offsetPosition);
	
	if (!isStatic && (frameIndex != previousFrameIndex) && (frameIndex == (ta.frames.Length - 1))) loopCount++;
	previousFrameIndex = frameIndex;
}

function setTextureAtlas( index : int, offset : Vector3, loop : boolean, force : boolean ) {
	if( force || (index != textureAtlasIndex) ) {
		fpsTimer = 0.0;
		loopCount = 0;
	}
	
	textureAtlasIndex = index;
	offsetPosition = offset;
	allowLooping = loop;
}
function setTextureAtlas( index : int, offset : Vector3, loop : boolean ) {
	setTextureAtlas( index, offset, loop, false );
}
function setTextureAtlas( index : int, offset : Vector3 ) {
	setTextureAtlas( index, offset, true );
}
function setTextureAtlas( index : int ) {
	setTextureAtlas( index, Vector3.zero );
}

function getLoopCount() : int {
	return loopCount;
}

function getFrameIndex() : int {
	return frameIndex;
}

function getFrameCount() : int {
	return textureAtlasArray[textureAtlasIndex].frames.Length;
}

function getWidestFrameIndex() : int {
	widest = 0;
	
	for( var i = 0; i < getFrameCount(); i++ ) {
		var frame : Rect = getFrame( i );
		if (frame.width > getFrame( widest ).width) widest = i;
	}
	
	return widest;
}

function getFrame( frame : int ) : Rect {
	return textureAtlasArray[textureAtlasIndex].frames[frame];
}

// a quick hack
function setTimeFactor( factor : float ) {
	timeFactor = factor;
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
placeholder.width     frame.width
------------------ = -------------
   origScale.x        newScale.x

newScale.x = (origScale.x * frame.width) / placeholder.width
newScale.x = frame.width * (origScale.x / placeholder.width)

Debug.Log( scaleFactor.ToString( 'F4' ) );

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