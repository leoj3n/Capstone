
public var xOffset : float = 0.0;
public var yOffset : float = 0.0;
public var damping : float = 1.0;

function Update() {
	transform.position.x = Mathf.Lerp( transform.position.x, (Camera.main.transform.position.x + xOffset), (Time.deltaTime * damping));
	transform.position.y = Mathf.Lerp( transform.position.y, (Camera.main.transform.position.y + yOffset), (Time.deltaTime * damping));
}