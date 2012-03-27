using UnityEngine;
using System.Collections;

public class FissureChunkScript : MonoBehaviour {
	
	private float dropTimer = 0;
	private float timerRemaining = 0;
	private bool timerActive;
	
	// Use this for initialization
	void Start () {
		this.rigidbody.useGravity = false;
		timerRemaining = dropTimer = Random.value;
		timerActive = true;
	}
	
	// Update is called once per frame
	void Update () {
		
		if (timerActive) timerRemaining -= Time.deltaTime;
		
		if (timerRemaining < 0.0f)
		{
			this.rigidbody.useGravity = true;
			timerRemaining = dropTimer;
			timerActive = false;
		}	
	}
}
