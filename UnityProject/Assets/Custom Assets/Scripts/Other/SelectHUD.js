
public var characterPrefab : GameObject;
public var statsLeftFrame : int = 0;
public var statsRightFrame : int = 1;
public var statsTopFrame : int = 2;
public var playSelected : boolean = false;

private var character : GameObject;
private var avatar : Avatar;
private var taRenderer : TextureAtlasRenderer;

function Start() {
	character = Instantiate( characterPrefab );
	avatar = character.GetComponent( Avatar );
	taRenderer = avatar.GetComponentInChildren( TextureAtlasRenderer );
	
	var statsTexture : Texture2D = character.GetComponent( Avatar ).statsTexture;
	var statsAtlas : TextAsset = character.GetComponent( Avatar ).statsAtlas;
	
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
	
	avatar.isControllable = false;
	character.transform.parent = transform;
	character.transform.localPosition = Vector3( 0.0, 2.4, -12.6 );
	character.AddComponent( BillBoard );
}

function Update() {
	taRenderer.setTextureAtlas(
		parseInt( playSelected ? CharacterAtlas.Selected : CharacterAtlas.SelectIdle ), 
		Vector3( (avatar.baseOffset.x * -1.0), avatar.baseOffset.y, 0.0 ) );
	
	if (playSelected && (taRenderer.getLoopCount() == 1))
		playSelected = false;
}