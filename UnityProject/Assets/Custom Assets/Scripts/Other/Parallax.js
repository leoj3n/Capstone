
public var xOffset : float = 0.0;
public var yOffset : float = 0.0;

function Update() {
	transform.position.x = (Camera.main.transform.position.x + xOffset);
	transform.position.y = (Camera.main.transform.position.y + yOffset);
}