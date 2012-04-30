/*
public var attackType: String;
public var visible : boolean = false;	//Makes attack box visible if true

private var lifeTime : float = 0;
private var parentScript : Avatar;

private var totalRot : float; //total amount of degrees the attackBox should rotate during attack



//ATTACKS-- all ATTACK SETTINGS FOR EACH PLAYER are in the setAttackValues function
//punch
private static var punchPower : int; //amount of force
private static var punchStartTime : float; //if there is a delay before the attack box spawns
private static var punchLifeTime : float; //the length of time the attack takes to execute after the start time runs out
private static var punchPos : Vector3; //x and y local position relative to the parent
private static var punchScale : Vector3; //x and y local scale relative to the parent
private static var punchRot : Vector3; //amount rotated in the Z axis in degrees
private static var punchTranslate : Vector3; //amount to translate in x and y

//punch2
private static var punch2Power : int; //amount of force
private static var punch2StartTime : float; //if there is a delay before the attack box spawns
private static var punch2LifeTime : float; //the length of time the attack takes to execute after the start time runs out
private static var punch2Pos : Vector3; //x and y local position relative to the parent
private static var punch2Scale : Vector3; //x and y local scale relative to the parent
private static var punch2Rot : Vector3; //amount rotated in the Z axis in degrees
private static var punch2Translate : Vector3; //amount to translate in x and y

//kick

//kick2

@System.NonSerialized 
var pushPower : float = 0;

function Awake () {
	renderer.enabled = visible; //sets visibility of attack box
	attackType = "";
	parentScript = transform.parent.GetComponent( Avatar ); //get parent avatar
}
var temp : float;
function FixedUpdate(){

	if (lifeTime <= 0 && parentScript.attackType != "") //if attack was just activated and the last attack has finished
	{
		setAttackValues(parentScript.playerName); //reset all orginal values
		switch (parentScript.attackType){
			case 'punch':
				lifeTime = punchLifeTime;
				transform.Rotate(punchRot);
				transform.localScale.x = punchScale.x;
				transform.localScale.y = punchScale.y;
				transform.localPosition.x = punchPos.x;
				transform.localPosition.y = punchPos.y; 
				pushPower = punchPower;
				break;
			case 'punch2':
				lifeTime = punch2LifeTime;
				transform.Rotate(punchRot);
				transform.localScale.x = punch2Scale.x;
				transform.localScale.y = punch2Scale.y;
				transform.localPosition.x = punch2Pos.x;
				transform.localPosition.y = punch2Pos.y; 
				pushPower = punch2Power;
				break;
			default: 
				lifeTime = 0;
				pushPower = 0;
				break;
		}//switch

	}else if (lifeTime > 0 && parentScript.attackType != "") // else if attacking
	{ 
		//move attack box?
//		switch (parentScript.attackType){
//			case 'punch':
//				var rotationZ : float = totalRot*(Time.deltaTime/punchLifeTime); //how much to rotate from original punchRot
//				transform.Rotate(0,0,rotationZ); //never needs to rotate in x or y
//				transform.localPosition.y += punchTranslate.y*(Time.deltaTime/punchLifeTime);
//				break;
//			default: 
//				lifeTime = 0;
//				pushPower = 0;
//				break;
		//}//switch
		
		lifeTime -= Time.deltaTime; //decrement the lifeTime
		
		if (lifeTime <= 0) //if the time to live has run out
		{ 					
			parentScript.attackType = "recover"; //set to recover so that the Avatar script knows the attack is over
			gameObject.active  = false; //deactivate
		}
	}//end of else if attacking
	
}
var dir : float = 0;

//instead of giving each character their own variables, we just use the same varibles every time

function setAttackValues (playerName : String) //set values
{
	transform.rotation.z = 0;//set rotation in z back to 0
	
	if (playerName == "zipper face") //should be switch statement when we have more players
	{	
		//punch settings
		punchPower = 5000; 
		punchRot = Vector3(0,0,0);
		punchStartTime = 0; 
		punchLifeTime = .15; 
		punchPos = Vector3(-1.1,.4,0); 
		punchScale = Vector3(1.3,.1,1); 
		//for moving the attack box (not implemented right now)
		totalRot = 140; 
		punchTranslate = Vector3(0,-.5,0);
		//punch2 settings
		punch2Power = 2000; 
		punch2Rot = Vector3(0,0,0);
		punch2StartTime = 0; 
		punch2LifeTime = .15; 
		punch2Pos = Vector3(-1,.4,0); 
		punch2Scale = Vector3(1.2,.2,1); 
		//...
	}
}


function OnCollisionEnter(collision : Collision) {
	// Check if the collider we hit has a rigidbody
  	// Then apply the force		this.name.Substring( (this.name.Length - 3)
    for (var contact : ContactPoint in collision.contacts) {
    	 var contactName = contact.otherCollider.name;
		if (contactName != transform.parent.name && 		//if this is not the parent
			contact.otherCollider.name.Substring(0 , 6) == "Avatar") {   //and if it isnt a part of the level
			if (parentScript.facing == 'right')
				dir = 1;
			else
				dir = -1;
			var enemyScript = contact.otherCollider.gameObject.GetComponent(Avatar);
			enemyScript.hitForceX = pushPower * dir * Time.deltaTime;
			enemyScript.health -= 20;
			parentScript.attackRecovery += lifeTime;
			parentScript.attackType = "recover"; //set to recover so that the Avatar script knows the attack is over
			gameObject.active  = false; //deactivate
			return;
		}
	}
}
*/