using UnityEngine;
using System.Collections;

public class MainCameraScript : MonoBehaviour {
	
	public float magnitude = 2.0f;
	public Vector3 cameraSubject = new Vector3(0,5,0);
	
	private Vector3 cameraShakeSubject;
	private float shakeTimer;
	private float timerRemaining;
	private bool timerActive;
	private bool shakeDone;
	
	// Use this for initialization
	void Start () {
		transform.LookAt(cameraSubject);
		timerActive = false;
		shakeDone = true;
	}
	
	// Update is called once per frame
	void Update () {
		if (timerActive)
		{
			timerRemaining -= Time.deltaTime;
			cameraShakeSubject = cameraSubject;
			
			if (timerRemaining < 2/shakeTimer)
			{
				float temp = 1 - (timerRemaining/shakeTimer);
				cameraShakeSubject.x += Random.Range(magnitude * -temp, magnitude * temp); 
				cameraShakeSubject.y += Random.Range(magnitude * -temp, magnitude * temp); 
				cameraShakeSubject.z += Random.Range(magnitude * -temp, magnitude * temp); 
			}
			else
			{
				float temp = timerRemaining/shakeTimer;
				cameraShakeSubject.x += Random.Range(magnitude * -temp, magnitude * temp); 
				cameraShakeSubject.y += Random.Range(magnitude * -temp, magnitude * temp); 
				cameraShakeSubject.z += Random.Range(magnitude * -temp, magnitude * temp); 
			}
			transform.LookAt(cameraShakeSubject);
			cameraShakeSubject = cameraSubject;
			
			if (timerRemaining < 0.5f){
				timerActive = false;
				timerRemaining = shakeTimer;
			}
		}
		else if (!shakeDone)
		{
			transform.LookAt(cameraSubject);
			shakeDone = true;	
		}
	}
	
	public void CameraShake(float shakeTime) {
		timerRemaining = shakeTimer = shakeTime;
		timerActive = true;
		shakeDone = false;
	}
}
