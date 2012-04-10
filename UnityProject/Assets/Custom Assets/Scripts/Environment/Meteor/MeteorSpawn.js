public var MeteorPrefab : GameObject = null;
public var meteorTimer : float = 5.0f;
public var loop : boolean = true;
public var MinMeteorSpawn : float = -25.0f;
public var MaxMeteorSpawn : float = 25.0f;
private var timerRemaining : float = 5.0f;
private var spawnLoc : Vector3;
private var lastSpawn : Vector3;
private var timerActive : boolean;

function Start() {
	timerActive = true;
	timerRemaining = meteorTimer;
	spawnLoc = transform.position;
	spawnLoc.y = 25.0f;
	spawnLoc.z += 2.0f;
	lastSpawn = spawnLoc;
}

function Update() {
	if (timerActive) timerRemaining -= Time.deltaTime;
	
	if( timerRemaining < 0.0f ) {
		spawnLoc.x = Random.Range( MinMeteorSpawn, MaxMeteorSpawn );
		
		while (spawnLoc.x == lastSpawn.x) spawnLoc.x = Random.Range( MinMeteorSpawn, MaxMeteorSpawn );
		
		GameObject.Instantiate( MeteorPrefab, spawnLoc, Quaternion.identity );
		timerRemaining = meteorTimer;
		timerActive = loop;
		lastSpawn = spawnLoc;
	}
}