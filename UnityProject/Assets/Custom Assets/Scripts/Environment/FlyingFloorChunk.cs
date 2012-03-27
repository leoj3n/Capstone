using UnityEngine;
using System.Collections;

public class FlyingFloorChunkScript : MonoBehaviour {
	
	public GameObject particlesPrefab = null;
	public float lifeTimer = 10.0f;
	private float timerRemaining;
	
	// Use this for initialization
	void Start () {
		this.rigidbody.AddForce(Random.Range(-500.0f,500.0f),Random.Range(500.0f,1500.0f),Random.Range(-500.0f,500.0f));
		timerRemaining = lifeTimer;
	}
	
	// Update is called once per frame
	void Update () {
		timerRemaining-=Time.deltaTime;
		if (timerRemaining	< 0.0f) 
		{
			GameObject.Instantiate(particlesPrefab, transform.position, transform.rotation);
			Destroy(gameObject);
		}
	}
}
