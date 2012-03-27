
public var gravityForce : Vector3;


function Update (){
	transform.Translate(gravityForce);
		
	if (transform.position.y < -50)
		Destroy(gameObject);

}


function OnCollisionEnter( collision : Collision ) {
/*
	// Check if the collider we hit has a rigidbody
  	// Then apply the force		this.name.Substring( (this.name.Length - 3)
    for (var contact : ContactPoint in collision.contacts) {
		if (contact.otherCollider.tag == "Player") {   //and if it isnt a part of the level
			var playerScript = contact.otherCollider.gameObject.GetComponent(Avatar);
			
			if (playerScript.facing == 'right')
				dir = 1;
			else
				dir = -1;
			playerScript.hitForceX = 5000 * dir * Time.deltaTime;
			playerScript.health -= 50;
		}
	}
*/
}


