using UnityEngine;
using System.Collections;

public class FloorChunkScript : MonoBehaviour {
	
	public GameObject particlesPrefab = null;
	public float lifeTimer = 10.0f;
	private float timerRemaining;
	
	// Use this for initialization
	void Start () {
		this.rigidbody.useGravity = false;
		timerRemaining = lifeTimer;
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		timerRemaining-=Time.deltaTime;
		if (timerRemaining	< 0.0f) 
		{
			GameObject.Instantiate(particlesPrefab, transform.position, transform.rotation);
			Destroy(gameObject);
		}
		if (transform.position.y < -50)
		{
			Destroy(gameObject);
		}
	}
	
	void OnCollisionEnter () {
		this.rigidbody.useGravity = true;
	}
}


