
public var riseRate : float = 4.0;
public var riseHeight : float = 10.0;
public var textPrefab : GameObject; // a TextMesh component is expected to be attached to this object

private var alerts : Array;
private var initialHeight : float = 0.0;

function Start() {
	alerts = new Array();
}

// SendMessage( 'Alert', 'a message' ); can be used from other scripts
function Alert( message : String ) {
	alert( message );
}

function alert( message : String, position : Vector3, parent : Transform ) {
	// create a new text object and set the starting height and text
	var textInstance : GameObject = Instantiate( textPrefab );
	textInstance.transform.parent = parent;
	textInstance.transform.localPosition = (position + Vector3( 0.0, initialHeight, 0.0 ));
	
	textInstance.GetComponent( TextMesh ).text = message;
	
	alerts.Add( textInstance );
}
function alert( message : String, position : Vector3 ) {
	alert( message, position, null );
}
function alert( message : String ) {
	alert( message, transform.position );
}

function Update() {
	var expiredAlerts : Array = new Array();
	
	for( var alert : GameObject in alerts ) {
		if( (alert == null) || (alert.transform.localPosition.y > (initialHeight + riseHeight)) ) {
			expiredAlerts.Add( alert );
			continue;
		}
		
		// update position and lookat
		alert.transform.localPosition += Vector3( 0.0, (Time.deltaTime * riseRate), 0.0 );
		alert.transform.LookAt( alert.transform.position + Camera.main.transform.forward );
	}
	
	for( var expiredAlert : GameObject in expiredAlerts ) {
		alerts.Remove( expiredAlert );
		Destroy( expiredAlert );
	}
}