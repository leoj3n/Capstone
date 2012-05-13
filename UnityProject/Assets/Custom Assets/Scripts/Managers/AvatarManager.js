
public var avatarPrefab : GameObject;
public var characterPrefabs : GameObject[];
public var expectedOrder : AvatarEnum; // just to expose the expected order in the Inspector

static var avatars : GameObject[];

function Awake() {
	instantiateAvatars();
}

function instantiateAvatars() {
	var avatarsTemp : Array = new Array(); // expandable arrays are easy to work with (but slow)
	
	for( var i = 0; i < ControllerID.Count; i++ ) {
		if (!GameManager.controllers[i].active) continue; // only instantiate for active controllers
		
		var avatar : GameObject = Instantiate( avatarPrefab, Vector3( (2.0 * i), 4.0, 0.0 ), Quaternion.LookRotation( Vector3.back ) );
		var avatarChild : GameObject = Instantiate( characterPrefabs[GameManager.controllers[i].avatar], avatar.transform.position, avatar.transform.rotation );
		avatarChild.transform.parent = avatar.transform;
		
		Global.bindAvatarToController( avatar, GameManager.controllers[i] ); // just sets a reference to the controller in avatar
		avatarsTemp.Push( avatar );
	}
	
	avatars = avatarsTemp.ToBuiltin( GameObject ); // convert to builtin for speed
}