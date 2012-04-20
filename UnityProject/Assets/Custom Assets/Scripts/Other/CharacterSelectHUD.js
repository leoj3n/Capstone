
public var idle : MovieTexture;
public var select : MovieTexture;
public var statsTop : Texture;
public var statsLeft : Texture;
public var statsRight : Texture;

private var video : Transform;

function Start() {
	video = transform.FindChild( 'Video' );
	
	transform.FindChild( 'Stats Top' ).renderer.material.mainTexture = statsTop;
	transform.FindChild( 'Stats Left' ).renderer.material.mainTexture = statsLeft;
	transform.FindChild( 'Stats Right' ).renderer.material.mainTexture = statsRight;
	
	idle.loop = true;
	idle.Play();
	video.renderer.material.mainTexture = idle;
}

function Update() {
	//select.Play();
	//video.renderer.material.mainTexture = select;
}