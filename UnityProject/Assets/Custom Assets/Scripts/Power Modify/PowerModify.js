
public var modifierPrefabs : GameObject[];
public var expectedModifies : PowerModifyEnum; // just to expose expected modifies in Inspector

private var modifier : PowerModifyEnum;

function Awake() {
	modifier = Random.Range( 0, PowerModifyEnum.Count );
	var object : GameObject = Instantiate( modifierPrefabs[modifier], transform.position, Quaternion.identity );
	object.transform.parent = transform;
}

function Update() {
	Global.enforceBounds( transform );
}