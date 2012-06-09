
public var modifierPrefabs : GameObject[];
public var alertTexture : Texture2D;
public var random : boolean = true;

function Awake() {
	var modifier : int;
	
	if( random ) {
		modifier = Random.Range( 0, modifierPrefabs.Length );
	} else {
		modifier = ((GameManager.instance.lastModifier + 1) % modifierPrefabs.Length);
		if (modifier > (modifierPrefabs.Length - 1)) modifier = 0;
	}
	
	modifier = 3; // debug
	
	GameManager.instance.lastModifier = modifier;
	
	var object : GameObject = Instantiate( modifierPrefabs[modifier], transform.position, Quaternion.identity );
	object.transform.parent = transform;
}

function OnGUI() {
	var point = Camera.main.WorldToScreenPoint( transform.position );
	if( (point.y > Screen.height) ||
		((point.x < 0.0) || (point.x > Screen.width)) ) {
		
		var rect : Rect = Rect( Mathf.Clamp( point.x, -21.0, (Screen.width - 21.0) ), 
			Mathf.Max( 20.0, (Screen.height - point.y) ), 42.0, 60.0 );
		GUI.DrawTexture( rect, alertTexture );
	}
}

function Update() {
	Global.enforceBounds( transform );
	
	if (GameManager.instance.cutScenePlaying()) Destroy( gameObject );
}