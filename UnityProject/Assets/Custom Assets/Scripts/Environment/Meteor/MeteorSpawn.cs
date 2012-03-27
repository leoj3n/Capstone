using UnityEngine;
using System.Collections;
public class MeteorSpawnScript : MonoBehaviour {
 
 public GameObject MeteorPrefab = null;
 public float meteorTimer = 5.0f;
 public bool loop = true;
 public float MinMeteorSpawn = -25.0f;
 public float MaxMeteorSpawn = 25.0f;
 private float timerRemaining = 5.0f;
 private Vector3 spawnLoc;
 private Vector3 lastSpawn;
 private bool timerActive;
 
 // Use this for initialization
 void Start () {
  timerActive = true;
  timerRemaining = meteorTimer;
  spawnLoc = transform.position;
  spawnLoc.y = 40.0f;
  lastSpawn = spawnLoc;
 }
 
 // Update is called once per frame
 void Update () {
  if (timerActive)
  {
   timerRemaining -= Time.deltaTime;
  }
  
  if (timerRemaining < 0.0f)
  {
   		spawnLoc.x = Random.Range(MinMeteorSpawn, MaxMeteorSpawn);
   		while (spawnLoc.x == lastSpawn.x)
				spawnLoc.x = Random.Range(MinMeteorSpawn, MaxMeteorSpawn);
				
   		GameObject.Instantiate(MeteorPrefab, spawnLoc, Quaternion.identity);
   		timerRemaining = meteorTimer;
   		timerActive = loop;
		lastSpawn = spawnLoc;

  }
}
}