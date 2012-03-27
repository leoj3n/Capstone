using UnityEngine;
using System.Collections;

public class PlatformTileScript : MonoBehaviour {
	
	public GameObject FloorChunkPrefab = null;
	public GameObject FlyingFloorChunkPrefab = null;
	public float chunkYOffset = 0;
	
	public GameObject FissureChunkPrefab = null;
	public GameObject FissureChunkSolidPrefab = null;
	public int tileRow = 0;
	
	private Vector3 afterPos;
	private Vector3 chunkPos;
	
	public float resetTimer = 10.0f;
	private float timerRemaining;
	private bool timerActive;
	public float tileYOffset = 50.0f;
	private float tileYPos;
	
	// Use this for initialization
	void Start () {
		timerRemaining = resetTimer;
		timerActive = false;
		tileYPos = transform.position.y;
	}
	
	// Update is called once per frame
	void Update () {
		if (timerActive)
		{
			timerRemaining -= Time.deltaTime;
		}
		if (timerRemaining	< 0.0f)
		{
			afterPos = transform.position;
			this.transform.position = new Vector3(afterPos.x, tileYPos, afterPos.z);
			timerRemaining = resetTimer;
			timerActive = false;	
		}
	}
	
	 void OnTriggerEnter(Collider collision) {
		string tag = collision.gameObject.tag;
		
		if (tag == "Meteor")
		{
			// grab current position
			chunkPos = afterPos = transform.position;
			
			// offset position and start reset timer
			this.transform.position = new Vector3(afterPos.x, tileYOffset, afterPos.z);
			timerActive = true;
			
			// prep the chunk spawner
			afterPos.x -= 4.5f;
			afterPos.z -= 4.5f;
			chunkPos.y += chunkYOffset;
			
			// SPAWN 100 CHUNKS! (cue evil laugh)
			for (int i = 0; i < 10; i++)
			{
				chunkPos.x = afterPos.x + i;
				for (int j = 0; j < 10; j++)
				{
					chunkPos.z = afterPos.z + j;
					GameObject.Instantiate(FloorChunkPrefab, chunkPos, Quaternion.identity);
					if (Random.Range(0.0f, 1.0f) < 0.15f) 
						GameObject.Instantiate(FlyingFloorChunkPrefab, new Vector3(chunkPos.x,chunkPos.y+1f,chunkPos.z),Quaternion.identity);
				}
			}
		}
	}
	
	public void OpenFissure (int row) {
		if (row == tileRow)
		{
			chunkPos = afterPos = transform.position;
			
			Destroy(gameObject);
			
			afterPos.x -= 4.5f;
			afterPos.z -= 4.5f;
			
			chunkPos.y += chunkYOffset - 0.5f;
			
			for (int i = 0; i < 10; i++)
			{
				chunkPos.x = afterPos.x + i;
				for (int j = 0; j < 10; j++)
				{
					chunkPos.z = afterPos.z + j;
					
					if ((i > 0 && i < 9) || ((i == 0 || i == 9) && Random.value > 0.5f)) 
						GameObject.Instantiate(FissureChunkPrefab, chunkPos, Quaternion.identity);
					else
						GameObject.Instantiate(FissureChunkSolidPrefab, chunkPos, Quaternion.identity);
				}
			}
		}
	}
}
