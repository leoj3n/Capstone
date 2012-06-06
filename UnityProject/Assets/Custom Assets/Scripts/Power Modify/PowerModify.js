
public var modifierPrefabs : GameObject[];
public var expectedModifiers : ModifierEnum; // just to expose expected modifies in Inspector
public var random : boolean = true;

function Awake() {
	var count : int = ModifierEnum.Count;
	var modifier : ModifierEnum;
	
	if( random ) {
		modifier = Random.Range( 0, count );
	} else {
		modifier = (parseInt( GameManager.instance.lastModifier + 1 ) % count);
		if (modifier > (count - 1)) modifier = 0;
	}
	
	GameManager.instance.lastModifier = modifier;
	
	var object : GameObject = Instantiate( modifierPrefabs[modifier], transform.position, Quaternion.identity );
	object.transform.parent = transform;
}

function Update() {
	Global.enforceBounds( transform );
}