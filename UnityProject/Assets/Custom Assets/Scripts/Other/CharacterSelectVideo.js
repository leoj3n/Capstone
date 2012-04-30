
public var idle : Texture2D;
public var select : Texture2D;

private var video : Transform;

function Awake() {
	/*video = transform.FindChild( 'Video' );*/
	
	video.renderer.material.mainTexture = idle;
	
}

function Update() {
	//select.Play();
}