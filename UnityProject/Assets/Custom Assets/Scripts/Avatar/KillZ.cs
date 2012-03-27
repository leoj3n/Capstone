using UnityEngine;
using System.Collections;

public class KillZScript : MonoBehaviour {

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}
	
	void OnCollisionEnter(Collision collision) {
		string tag = collision.gameObject.tag;
		if (tag == "Player")
		{
			collision.gameObject.transform.position = new Vector3(10, 40, 0);
		}
		else
		{
			Destroy(collision.gameObject);	
		}
	}
}
