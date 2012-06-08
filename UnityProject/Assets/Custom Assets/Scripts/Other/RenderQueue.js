
public var position : int = 2000;

function Update() {
	renderer.material.renderQueue = position;
}