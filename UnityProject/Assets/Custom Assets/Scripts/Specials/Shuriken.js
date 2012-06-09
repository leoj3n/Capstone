
public var speed : float = 1.0;
public var direction : Vector3;
public var belongsToTeam : ControllerTeam;

private var enterTimes : int = 0;

function Start() {
	GameManager.instance.ignoreCollisionsWithTeam( collider, belongsToTeam );
}

function Update() {
	transform.position += (Time.deltaTime * speed * direction);
	transform.Rotate( Vector3.down * speed );
}

function OnCollisionEnter( collision : Collision ) {
	if (Global.isAvatar( collision.gameObject ))
		collision.transform.GetComponent( Avatar ).addHitForce( transform.position, (14.0 + collision.impactForceSum.magnitude), 4.0 );
	
	Destroy( gameObject );
}