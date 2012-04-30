
class AvatarTemplate extends Avatar {
	public var walkSpeed : float = 6.0;
	public var jumpHeight : float = 2.0;
	public var jumpSound : AudioClip;
	public var orbPrefab : Rigidbody;
	
	function Awake() {}
	function Start() {}
	function Update() { /*Debug.Log( jumping );*/ }
	function Reset() {}
	
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