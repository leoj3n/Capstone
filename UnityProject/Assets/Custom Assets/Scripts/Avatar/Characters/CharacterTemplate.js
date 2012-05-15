
/*@script RequireComponent( TextureAtlasRenderer )
@script RequireComponent( MeshFilter )
@script RequireComponent( MeshRenderer )
@script RequireComponent( AudioSource )*/

class CharacterTemplate extends Avatar {
	public var walkSpeed : float = 6.0;
	public var jumpHeight : float = 2.0;
	public var orbPrefab : Rigidbody;
	public var sound : AudioClip[];
	public var expectedSounds : CharacterSound; // just for exposing expected order of sounds in inspector
	public var statsTexture : Texture2D;
	public var statsAtlas : TextAsset;
	
	function Awake() {}
	function Start() {}
	function Update() {
		// move transform so the character prefab is anchored at the feet
		transform.localPosition.y = Mathf.Lerp( transform.localPosition.y, (Global.getSize( gameObject ).y / 2), (Time.deltaTime * 20) );
	}
	function Reset() {}
	
	function AudioPlay( clip : CharacterSound ) {
		audio.clip = sound[clip];
		audio.Play();
	}
	
	function AudioPlayOneShot( clip : CharacterSound ) {
		audio.PlayOneShot( sound[clip] );
	}
	
	function AudioStop() {
		audio.Stop();
	}
	
	function Attack1() {}
	
	function Special1() {
		Debug.LogWarning( 'You must override the default template function "Special1()"' );
	}
	
	function Special2() {
		Debug.LogWarning( 'You must override the default template function "Special2()"' );
	}
	
	function Ultimate() {
		Debug.LogWarning( 'You must override the default template function "Ultimate()"' );
	}
}
