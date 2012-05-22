
public var characterPrefab : GameObject;
public var statsLeftFrame : int = 0;
public var statsRightFrame : int = 1;
public var statsTopFrame : int = 2;
public var playSelected : boolean = false;

private var clone : GameObject;

function Start() {
	clone = Instantiate( characterPrefab );
	
	var statsTexture : Texture2D = clone.GetComponent( Avatar ).statsTexture;
	var statsAtlas : TextAsset = clone.GetComponent( Avatar ).statsAtlas;
	
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
	
	clone.transform.parent = transform;
	clone.transform.localPosition = Vector3( 0.0, 2.4, -12.6 );
	clone.AddComponent( BillBoard );
}

function Update() {
	clone.GetComponent( TextureAtlasRenderer ).TextureAtlasIndex(
		parseInt( playSelected ? CharacterState.Selected : CharacterState.SelectIdle ) );
	
	if (playSelected && (clone.GetComponent( TextureAtlasRenderer ).loopCount == 1))
		playSelected = false;
}