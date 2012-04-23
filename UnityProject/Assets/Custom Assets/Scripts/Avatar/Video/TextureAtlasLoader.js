
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
	
	loadFrames( texture[0], atlas[0] );
}

function Update() {
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
	var path = AssetDatabase.GetAssetPath( data );
	
	if (path.Contains( '.bytes' ))
		type = atlasType.binary;
	else if (path.Contains( '.txt' ))
		type = atlasType.json;
	else
		type = atlasType.none;
	
	switch( type ) {
		case atlasType.binary:
			var s : System.IO.Stream = new System.IO.MemoryStream( data.bytes );
			var br : System.IO.BinaryReader = new System.IO.BinaryReader( s );
			width = read4Bytes( br );
			height = read4Bytes( br );
			var numFrames = read4Bytes( br );
			var rects = new Rect[numFrames];
			
			// get rectangles
			for( var i = 0; i < numFrames; i++ )
				rects[i] = Rect( read4Bytes( br ), read4Bytes( br ), read4Bytes( br ), read4Bytes( br ) );
			
			// skip names
			for (i = 0; i < numFrames; i++)
				while (br.ReadChar() != 0);
			
			frames = new ArrayList(); // will be an array of rects
			
			// set rectangle offsets
			for( i = 0; i < numFrames; i++ ) {
				var left = read4Bytes( br );
				var top = read4Bytes( br );
				var right = read4Bytes( br );
				var bottom = read4Bytes( br );
				
				var rectAndOffset = new ArrayList();
				rectAndOffset.Add( rects[i] );
				rectAndOffset.Add( RectOffset( left, right, top, bottom ) );
				frames.Add( rectAndOffset );
			}
			break;
		case atlasType.json:
			var dict = Json.Deserialize( data.text ) as System.Collections.Generic.Dictionary.<String, Object>;
			
			frames = new ArrayList(); // will be an array of dictionary keys/pairs
			for (var frame in dict['frames'].Values) frames.Add( frame ); //Debug.Log( frames[0]['frame']['x'] );
			
			width = dict['meta']['size']['w'];
			height = dict['meta']['size']['h'];			
			break;
	}
	
	renderer.material.mainTexture = tex;
}

function renderFrame() {
	var index = parseInt( (Time.timeSinceLevelLoad * fps) % (frames.Count) );
	var frame : Rect;
	var trimmed : boolean = false;
	
	switch( type ) {
		case atlasType.binary:
			var r = frames[index];
			trimmed = ((r[1].horizontal + r[1].vertical) > 0);
			//frame = (trimmed ? r[1].Remove( r[0] ) : r[0]);
			//if (trimmed)
			//	frame = Rect( r[0].x + r[1].left, r[0].y + r[1].top, r[0].width - r[1].right, r[0].height - r[1].bottom ); 
			//else
				frame = r[0];
				
			//Debug.Log( r[0] + ' ... ' + r[1] + ' ... ' + frame );
			
			transform.localPosition = Vector3.zero; // hack
			break;
		case atlasType.json:			
			var f = frames[index]['frame'];
			frame = Rect( f['x'], f['y'], f['w'], f['h'] );
			trimmed = frames[index]['trimmed'];
			
			transform.localPosition = Vector3( -0.723588, 0.25, 0.0 ); // hack
			break;
	}
	
	renderer.material.mainTextureOffset = Vector2( (frame.x / width), 1.0 - ((frame.y + frame.height) / height) );
	renderer.material.mainTextureScale = Vector2( (frame.width / width), (frame.height / height) );
	transform.localScale = (trimmed ? Vector3( (frame.width / scaleFactor), (frame.height / scaleFactor), transform.localScale.z ) : origScale );
}

function read4Bytes( reader : System.IO.BinaryReader ) {
	return System.BitConverter.ToInt32( reader.ReadBytes( 4 ), 0 );
}