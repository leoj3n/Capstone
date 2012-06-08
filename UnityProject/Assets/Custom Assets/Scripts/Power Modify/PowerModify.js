
public var modifierPrefabs : GameObject[];
public var random : boolean = true;

function Awake() {
	var modifier : int;
	
	if( random ) {
		modifier = Random.Range( 0, modifierPrefabs.Length );
	} else {
		modifier = ((GameManager.instance.lastModifier + 1) % modifierPrefabs.Length);
		if (modifier > (modifierPrefabs.Length - 1)) modifier = 0;
	}
	
	//modifier = 0; // debug
	
	GameManager.instance.lastModifier = modifier;
	
	var object : GameObject = Instantiate( modifierPrefabs[modifier], transform.position, Quaternion.identity );
	object.transform.parent = transform;
}

function Update() {
	Global.enforceBounds( transform );
}