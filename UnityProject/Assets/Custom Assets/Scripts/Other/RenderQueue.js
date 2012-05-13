
public var position : int = 2000;

function Awake() {
	renderer.material.renderQueue = position;
}