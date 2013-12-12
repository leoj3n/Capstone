
public var characterPrefab : GameObject;
public var statsLeftFrame : int = 0;
public var statsRightFrame : int = 1;
public var statsTopFrame : int = 2;
public var playSelected : boolean = false;

private var character : GameObject;
private var taRenderer : TextureAtlasRenderer;

function Start() {
	character = Instantiate( characterPrefab );
	taRenderer = character.GetComponentInChildren( TextureAtlasRenderer );
	taRenderer.scaleAnchorVert = ScaleAnchorV.Center;
	taRenderer.scaleAnchorHoriz = ScaleAnchorH.Middle;
	
	var statsTexture : Texture2D = character.GetComponent( PlayerAvatar ).statsTexture;
	var statsAtlas : TextAsset = character.GetComponent( PlayerAvatar ).statsAtlas;
	
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
	
	character.GetComponent( PlayerAvatar ).isControllable = false;
	character.transform.parent = transform;
	character.transform.localPosition = Vector3( 0.0, 2.4, -12.6 );
	character.AddComponent( BillBoard );
}

function Update() {
	taRenderer.setTextureAtlas( parseInt( playSelected ? CharacterAtlas.Selected : CharacterAtlas.SelectIdle ) );
	
	if (playSelected && (taRenderer.getLoopCount() == 1))
		playSelected = false;
}