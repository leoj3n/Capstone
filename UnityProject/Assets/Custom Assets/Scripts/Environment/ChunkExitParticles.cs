using UnityEngine;
using System.Collections;

public class ChunkExitParticles : MonoBehaviour {
	
	public float liveTime = 1.5f;
	private float timerRemaining;
	
	// Use this for initialization
	void Start () {
		timerRemaining = liveTime;
	}
	
	// Update is called once per frame
	void Update () {
		timerRemaining -= Time.deltaTime;
		if (timerRemaining	< 0.0f)
		{
			Destroy(gameObject);	
		}
	}
}
