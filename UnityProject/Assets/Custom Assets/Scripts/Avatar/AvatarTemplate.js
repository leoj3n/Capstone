
class AvatarTemplate extends Avatar {
	public var walkSpeed : float = 6.0;
	public var jumpHeight : float = 2.0;
	public var orbPrefab : Rigidbody;
	public var sound : AudioClip[];
	public var expectedSounds : AvatarSound;
	public var anchorAtFeet : boolean = true;
	
	function Awake() {}
	function Start() {}
	function Update() {
		if (anchorAtFeet)
			transform.localPosition.y = Mathf.Lerp( transform.localPosition.y, (Global.getSize( gameObject ).y / 2), (Time.deltaTime * 20) );
	}
	function Reset() {}
	
	function AudioPlay( clip : AvatarSound ) {
		audio.clip = sound[clip];
		audio.Play();
	}
	
	function AudioPlayOneShot( clip : AvatarSound ) {
		audio.PlayOneShot( sound[clip] );
	}
	
	function AudioStop() {
		audio.Stop();
	}
	
	function attack1() {
		
	}
	
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