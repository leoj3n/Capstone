var avatarA : Avatar;
var avatarB : Avatar;


function Update () {
	if (this.name == "Healthp1")
		this.guiTexture.pixelInset.width = avatarA.health;
	else //if this is player 2's health bar
		this.guiTexture.pixelInset.width = avatarB.health;
}