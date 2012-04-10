
function Update () {
	var emitters : Component[] = GetComponentsInChildren( ParticleEmitter );
	for( var emitter : ParticleEmitter in emitters ) {
		emitter.maxEmission -= 2;
		emitter.minEmission -= 2;
	}
}