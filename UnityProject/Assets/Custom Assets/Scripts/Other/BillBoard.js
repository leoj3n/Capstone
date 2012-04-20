
function Update() {
	transform.LookAt( Vector3( Camera.main.transform.position.x, transform.position.y, Camera.main.transform.position.z ) );
}