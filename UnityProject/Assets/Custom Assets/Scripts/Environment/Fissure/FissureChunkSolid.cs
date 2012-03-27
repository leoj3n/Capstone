using UnityEngine;
using System.Collections;

public class FissureChunkSolidScript : MonoBehaviour {

	// Use this for initialization
	void Start () {
		this.rigidbody.useGravity = false;
	}
	
	// Update is called once per frame
	void Update () {
	}
	
	void OnCollisionEnter () {
		this.rigidbody.useGravity = true;
	}
	
}
