
public var characterPrefab : GameObject;
public var statsLeftFrame : int = 0;
public var statsRightFrame : int = 1;
public var statsTopFrame : int = 2;
public var playSelected : boolean = false;

private var clone : GameObject;
private var taRenderer : TextureAtlasRenderer;

function Start() {
	clone = Instantiate( characterPrefab );
	
	var statsTexture : Texture2D = clone.GetComponent( Avatar ).statsTexture;
	var statsAtlas : TextAsset = clone.GetComponent( Avatar ).statsAtlas;
	
	for( var child : Transform in transform ) {
		taRenderer = child.gameObject.AddComponent( TextureAtlasRenderer );
		
		taRenderer.texture = [statsTexture];
		taRenderer.atlas = [statsAtlas];
		taRenderer.isStatic = true;
		
		switch( taRenderer.name ) {
			case 'Stats Left':
				taRenderer.staticFrame = statsLeftFrame;
				break;
			case 'Stats Right':
				taRenderer.staticFrame = statsRightFrame;
				break;
			case 'Stats Top':
				taRenderer.staticFrame = statsTopFrame;
				break;
		}
	}
	
	clone.GetComponent( Avatar ).isControllable = false;
	clone.transform.parent = transform;
	clone.transform.localPosition = Vector3( 0.0, 2.4, -12.6 );
	clone.AddComponent( BillBoard );
}

function Update() {
	taRenderer.setTextureAtlasIndex(
		parseInt( playSelected ? CharacterState.Selected : CharacterState.SelectIdle ) );
	
	if (playSelected && (taRenderer.loopCount == 1))
		playSelected = false;
}