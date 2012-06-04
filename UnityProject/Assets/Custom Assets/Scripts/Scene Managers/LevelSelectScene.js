
class LevelSelectScene extends SceneManager {
	public var hudPrefab : GameObject;
	public var buttonTimeout : float = 1.0;
	public var texture : Texture2D;
	public var atlas : TextAsset;
	
	private var rotator : GameObject;
	private var degreesOfSeparation : float;
	private var rotations : Array;
	private var levelHUDs : Array;
	private var lastSelectTime : float;
	
	function SceneLoaded() {
		rotator = GameObject.Find( 'Rotator' );
		degreesOfSeparation = (360 / parseInt( LevelEnum.Count ));
		
		rotations = new Array();
		levelHUDs = new Array();
		for( var i = 0; i < LevelEnum.Count; i++ ) {
			var rot : Quaternion = Quaternion.Euler( (degreesOfSeparation * i), 0.0, 0.0 );
			var clone : GameObject = GameObject.Instantiate( hudPrefab, Vector3.zero, rot );
			clone.transform.parent = rotator.transform;
			
			var child : GameObject = clone.GetComponentInChildren( MeshFilter ).gameObject;
			var tar : Component = child.AddComponent( TextureAtlasRenderer );
			
			tar.texture = [texture];
			tar.atlas = [atlas];
			tar.isStatic = true;
			tar.staticFrame = i;
			
			rotations.Push( rot ); // TODO: convert to built-in arrays for speed increase
			levelHUDs.Push( clone );
		}
	}
	
	function Update() {
		var up : boolean;
		var down : boolean;
		
		if( (Time.time - lastSelectTime) < buttonTimeout ) {
			up = down = false;
		} else {
			var v : float = Global.getAxis( 'Vertical', GameManager.instance.readyControllers );
			up = (v > 0.1);
			down = (v < -0.1);
		}
		
		// set the current level levelHUD
		switch( true ) {
			case up:
				GameManager.instance.level = ((parseInt( GameManager.instance.level ) + 1) % parseInt( LevelEnum.Count ));
				break;
			case down:
				GameManager.instance.level = ((parseInt( GameManager.instance.level ) - 1) % parseInt( LevelEnum.Count ));
				if (GameManager.instance.level < 0) GameManager.instance.level = (parseInt( LevelEnum.Count ) - 1);
				break;
		}
		
		// do this AFTER setting the current level levelHUD
		if( up || down ) {
			lastSelectTime = Time.time;
			
			// play audio effects
			GameManager.instance.audioPlay( 'Swoosh', true );
		}
		
		// do the rotation to the current level levelHUD
		rotator.transform.rotation = Quaternion.Slerp( rotator.transform.rotation, 
			Quaternion.Inverse( rotations[GameManager.instance.level] ), (Time.deltaTime * 6) );
		
		// continue to current level or go back to Character Select
		switch( true ) {
			case Global.isButtonDown( 'A', GameManager.instance.readyControllers ):
				GameManager.instance.loadLevel( GameManager.instance.level );
				break;
			case Global.isButtonDown( 'B', GameManager.instance.readyControllers ):
				Application.LoadLevel( SceneEnum.CharacterSelect );
				break;
			case Global.isButtonDown( 'Back', GameManager.instance.readyControllers ):
				Application.LoadLevel( SceneEnum.Start );
				break;
		}
	}
	
	function OnGUI() {
		var halfScreenWidth : float = (Screen.width / 2);
		var halfScreenHeight : float = (Screen.height / 2);
		var width : float = 300.0;
		var height : float = 90.0;
		var halfWidth : float = (width / 2);
		var halfHeight : float = (height / 2);
		
		GUILayout.BeginArea( Rect( (halfScreenWidth - halfWidth), (Screen.height - (Screen.height * 0.05) - height), width, height ) );
						
			GUILayout.Box( 'Press [A] to play ' + GameManager.instance.level + '.' );
			GUILayout.Box( 'Press [B] to return to Character Select.' );
			GUILayout.Box( 'Press [Back] to return to the Main Menu.' );
			
		GUILayout.EndArea();
	}
}