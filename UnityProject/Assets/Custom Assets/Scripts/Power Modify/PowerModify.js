
public var modifierPrefabs : GameObject[];
public var expectedModifies : PowerModifyEnum; // just to expose expected modifies in Inspector

private var modify : PowerModifyEnum;

function Awake() {
	modify = Random.Range( 0, PowerModifyEnum.Count );
}

function getModifyType() : PowerModifyEnum {
	return modify;
}