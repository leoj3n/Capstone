
function Update() {
	var emitters : Component[] = GetComponentsInChildren( ParticleEmitter );
	for( var emitter : ParticleEmitter in emitters ) {
		var reduction : float = (emitter.maxEmission * Time.deltaTime);
		emitter.maxEmission -= reduction;
		emitter.minEmission -= reduction;
	}
}