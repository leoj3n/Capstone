
public var textures : MovieTexture[];

private var enqueuedTexture : MovieTexture;
private var waitFinish : boolean = false;
private var parentScript : Avatar;
private enum action {
	intro,
	idle,
	jump,
	jumpBackward,
	jumpForward,
	walkBackward,
	walkForward,
	fire1,
	fire2,
	block
}

function Awake() {
	parentScript = transform.parent.GetComponent( Avatar );
	
	// calling Instantiate makes sure this object has its own MovieTexture instances
	// (this necessary to avoid the textures-shared-between-objects Start()/Stop() problem)
	for (var tex in textures) tex = Instantiate( tex );
}

function Start() {
	ForceTexture( textures[action.intro], false ); // play avatar intro
	waitFinish = true;
}

function Update() {
	// do texture setting here instead of ForceTexture() (otherwise it glitches)
	if( enqueuedTexture ) {
		renderer.material.mainTexture.Stop();
		renderer.material.mainTexture = enqueuedTexture;
		enqueuedTexture = null;
	}
	
	// can stop waiting if nothing is playing...
	if (waitFinish && !IsPlaying()) waitFinish = false;
	
	switch( true ) {
		case parentScript.IsBlocking():
			SetTexture( textures[action.block], true );
			break;
		case parentScript.IsAttacking():
			if (parentScript.GetAttack() == 1) SetTexture( textures[action.fire1], false );
			if (parentScript.GetAttack() == 2) SetTexture( textures[action.fire2], false );
			waitFinish = true;
			break;
		case parentScript.IsJumping():
			if (parentScript.IsMoving())
				SetTexture( (parentScript.IsMovingBackwards() ? textures[action.jumpBackward] : textures[action.jumpForward]), false );
			else
				SetTexture( textures[action.jump], false );
			break;
		case parentScript.IsMoving():
			SetTexture( (parentScript.IsMovingBackwards() ? textures[action.walkBackward] : textures[action.walkForward]), true );
			break;
		default:
			if( !waitFinish ) {
				SetTexture( textures[action.idle], true );
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
	if (!IsCurTex( tex )) ForceTexture( tex, loop );
}
function ForceTexture( tex : MovieTexture, loop ) {
	waitFinish = false;
	
	tex.loop = loop;
	tex.Play();
	
	enqueuedTexture = tex;
}