private var mainTex : MovieTexture;
private var maskTex : MovieTexture;

public var testTex : MovieTexture;
public var testTexAlpha : MovieTexture;

function Start() {
	// these variables cannot be defined outside of start
	mainTex = renderer.material.mainTexture;
	maskTex = renderer.material.GetTexture( '_Mask' );
	
	// set looping to true and then play
	mainTex.loop = maskTex.loop = true;
	mainTex.Play();
	maskTex.Play();
}

function Update() {
	renderer.material.mainTexture = testTex;
	renderer.material.SetTexture( '_Mask', testTexAlpha );
	testTex.loop = testTexAlpha.loop = true;
	testTex.Play();
	testTexAlpha.Play();
}