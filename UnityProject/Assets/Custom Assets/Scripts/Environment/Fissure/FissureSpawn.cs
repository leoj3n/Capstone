using UnityEngine;
using System.Collections;

public class FissureSpawnScript : MonoBehaviour {
	
	public int fissureRow = 0;
	public float fissureTimer = 10.0f;
	private float timerRemaining = 10.0f;
	private bool timerActive;
	private bool shakedCamera;
	public float cameraShakeMagnitude = 5.0f;
	
	// Use this for initialization
	void Start () {
		timerRemaining = fissureTimer;
		timerActive = true;
		shakedCamera = false;
		fissureRow = Random.Range(0,5);
	}
	
	// Update is called once per frame
	void Update () {
		if (timerActive) timerRemaining -= Time.deltaTime;
		
		if (timerRemaining < 1.0f && !shakedCamera)
		{
			GameObject cam = GameObject.FindGameObjectWithTag("MainCamera");
			MainCameraScript c = (MainCameraScript) cam.GetComponent(typeof(MainCameraScript));
			// start camera shake with magnitude cameraShakeMagnitude
			c.CameraShake(cameraShakeMagnitude);
			shakedCamera = true;	
		}
		
		if (timerRemaining < 0.0f)
		{
			GameObject[] fissureList = GameObject.FindGameObjectsWithTag("FloorTile");
			
			for (int i = 0; i < fissureList.Length; i++)
			{
				FloorTileScript f = (FloorTileScript) fissureList[i].GetComponent(typeof(FloorTileScript));
				f.OpenFissure(fissureRow);
			}
			
			timerRemaining = fissureTimer;
			timerActive = false;
			shakedCamera = true;
		}
	}
}
