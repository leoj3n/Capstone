
public var characterPrefab : GameObject;
public var statsTexture : Texture2D;
public var statsAtlas : TextAsset;
public var statsLeftFrame : int = 0;
public var statsRightFrame : int = 1;
public var statsTopFrame : int = 2;
public var selected : boolean = false;

private var clone : GameObject;

function Start() {
	for( var child : Transform in transform ) {
		var tar : Component = child.gameObject.AddComponent( TextureAtlasRenderer );
		
		tar.texture = [statsTexture];
		tar.atlas = [statsAtlas];
		tar.isStatic = true;
		
		switch( tar.name ) {
			case 'Stats Left':
				tar.staticFrame = statsLeftFrame;
				break;
			case 'Stats Right':
				tar.staticFrame = statsRightFrame;
				break;
			case 'Stats Top':
				tar.staticFrame = statsTopFrame;
				break;
		}
	}
	
	// order matters, do this after adding TextureAtlasRenderer components
	clone = Instantiate( characterPrefab );
	clone.transform.parent = transform;
	clone.transform.localPosition = Vector3( 0.0, 2.4, -12.6 );
	clone.GetComponent( TextureAtlasRenderer ).fps = 16.0; // override fps
	clone.AddComponent( BillBoard );
	clone.SendMessage( 'TextureAtlasIndex', parseInt( AvatarState.SelectIdle ) );
}

function Update() {
	if (selected) clone.SendMessage( 'TextureAtlasIndex', parseInt( AvatarState.Selected ) );
	
	if( selected && (clone.GetComponent( TextureAtlasRenderer ).loopCount == 2) ) {		
		Debug.Log( 'DESELECT' );
		selected = false;
		SendMessageUpwards( 'SelectionComplete' );
	}
}