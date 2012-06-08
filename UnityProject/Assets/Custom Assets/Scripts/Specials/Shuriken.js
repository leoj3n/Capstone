
public var speed : float = 1.0;
public var direction : Vector3;
public var belongsToTeam : ControllerTeam;

function Start() {
	GameManager.instance.ignoreCollisionsWithTeam( collider, belongsToTeam );
}

function Update() {
	transform.position += (Time.deltaTime * speed * direction);
	transform.Rotate( Vector3.down * speed );
}

function OnCollisionEnter( collision : Collision ) {
	if (Global.isAvatar( collision.gameObject ))
		collision.transform.GetComponent( Avatar ).addHitForce( transform.position, collision.impactForceSum.magnitude, 2.0 );
	
	Destroy( gameObject );
}