
private var waitFinish : boolean = false;

// these get set in Start()
private var parentScript : Avatar;
private var mainTexture : MovieTexture;

// these get set in the inspector
public var jumpTexture : MovieTexture;
public var fire1Texture : MovieTexture;
public var fire2Texture : MovieTexture;

function Start() {
	parentScript = transform.parent.GetComponent( Avatar );
	mainTexture = renderer.material.mainTexture;
	
	ForceTexture( mainTexture, true );
}

function Update() {
	if (!IsPlaying()) waitFinish = false;
	
	switch( true ) {
		case parentScript.IsJumping():
			SetTexture( jumpTexture, false );
			break;
		case IsButtonDown( 'Fire1' ):
			SetTexture( fire1Texture, false );
			waitFinish = true;
			break;
		case IsButtonDown( 'Fire2' ):
			SetTexture( fire2Texture, false );
			waitFinish = true;
			break;
		default:
			if( !waitFinish ) {
				SetTexture( mainTexture, true );
			}
			break;
	}
}

function IsButtonDown( button ) {
	return Input.GetButtonDown( button + ' ' + parentScript.GetPlayerLetter() );
}

function IsCurTex( tex : MovieTexture ) {
	return (renderer.material.mainTexture == tex);
}

function IsPlaying() {
	return renderer.material.mainTexture.isPlaying;
}

function SetTexture( tex : MovieTexture, loop ) {
	if (IsCurTex( tex )) return; // abort if already current texture
	ForceTexture( tex, loop ); // else set texture
}
function ForceTexture( tex : MovieTexture, loop ) {
	renderer.material.mainTexture.Stop();
	renderer.material.mainTexture = tex;
	renderer.material.mainTexture.loop = loop;
	renderer.material.mainTexture.Play();
}