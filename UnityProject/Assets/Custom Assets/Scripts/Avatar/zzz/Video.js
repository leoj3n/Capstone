/*
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
private var current : action;

function Awake() {
	parentScript = transform.parent.GetComponent( Avatar );
}

function Start() {
	ForceTexture( action.intro, false ); // play avatar intro
	waitFinish = true;
}

function Update() {
	// can stop waiting if nothing is playing...
	if (waitFinish && !texIsPlaying()) waitFinish = false;
	
	switch( true ) {
		case parentScript.IsBlocking():
			SetTexture( action.intro, true );
			break;
		case parentScript.IsAttacking():
			if (parentScript.GetAttack() == 1) SetTexture( action.fire1, false );
			if (parentScript.GetAttack() == 2) SetTexture( action.fire2, false );
			waitFinish = true;
			break;
		case parentScript.IsJumping():
			if (parentScript.IsMoving())
				SetTexture( (parentScript.IsMovingBackwards() ? action.jumpBackward : action.jumpForward), false );
			else
				SetTexture( action.jump, false );
			break;
		case parentScript.IsMoving():
			SetTexture( (parentScript.IsMovingBackwards() ? action.walkBackward : action.walkForward), true );
			break;
		default:
			if( !waitFinish ) {
				SetTexture( action.idle, true );
			}
			break;
	}
}

function IsButtonDown( button ) {
	return Input.GetButtonDown( button + ' ' + parentScript.GetPlayerLetter() );
}

function texIsPlaying() {
	return true;
}

function SetTexture( act : action, loop : boolean ) {
	if (act != current) ForceTexture( act, loop );
}
function ForceTexture( act : action, loop : boolean ) {
	waitFinish = false;
	
	GetComponent( TextureAtlasLoader ).setCurrentAtlas( act );
	
	current = act;
}*/