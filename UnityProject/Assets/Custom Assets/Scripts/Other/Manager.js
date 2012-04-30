
public var avatarPrefab : GameObject;
public var zipperFacePrefab : GameObject;

static var numPlayers : int = 2;
static var avatars : GameObject[];

function Awake() {	
	avatars = new GameObject[numPlayers];
	for( i = 0; i < numPlayers; i++ ) {
		var avatar : GameObject = Instantiate( avatarPrefab, Vector3( (2.0 * i), 4.0, 0.0 ), Quaternion.identity );
		
		switch( i ) {
			case 0:
				avatar.SendMessage( 'SetPlayerLetter', 'A' );
				break;
			case 1:
				avatar.SendMessage( 'SetPlayerLetter', 'B' );
				break;
			case 2:
				avatar.SendMessage( 'SetPlayerLetter', 'C' );
				break;
		}
		
		var zipperFace : GameObject = Instantiate( zipperFacePrefab, avatar.transform.position, Quaternion.identity );
		zipperFace.transform.parent = avatar.transform;
		
		avatars[i] = avatar;
	}
}