
public var characterPrefab : GameObject;
public var statsTexture : Texture2D;
public var statsAtlas : TextAsset;
public var statsLeftFrame : int = 0;
public var statsRightFrame : int = 1;
public var statsTopFrame : int = 2;

private var clone : GameObject;
private var selected : boolean = false;

function Awake() {
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
	
	// order matters, do this after adding a TextureAtlasRenderer
	clone = Instantiate( characterPrefab );
	clone.transform.parent = transform;
	clone.transform.localPosition = Vector3( 0.0, 2.4, -11.5 );
	//clone.GetComponent( AvatarTemplate ).anchorAtFeet = false;
	clone.AddComponent( BillBoard );
	clone.SendMessage( 'TextureAtlasIndex', parseInt( states.idle ) );
}

function Update() {
	if (selected) clone.SendMessage( 'TextureAtlasIndex', parseInt( states.select ) );
}