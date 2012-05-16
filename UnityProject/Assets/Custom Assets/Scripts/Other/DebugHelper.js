
function Awake() {
	if( GameManager.instance == null ) {
		Global.debugScene = Application.loadedLevel;
		Application.LoadLevel( 0 );
	}
}