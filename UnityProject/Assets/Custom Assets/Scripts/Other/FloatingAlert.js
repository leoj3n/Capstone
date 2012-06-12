
public var riseRate : float = 4.0;
public var alertTextPrefab : GameObject; // a TextMesh component is expected to be attached to this object

private var alerts : Array;

function Start() {
	alerts = new Array();
}

function Update() {
	var expiredAlerts : Array = new Array();
	
	for( var alert : GameObject in alerts ) {
		if( alert == null ) {
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

// SendMessage( 'Alert', 'a message' ); can be used from other scripts
function Alert( message : String ) {
	alert( message );
}

// utility function for instantiating an alert
function alert( message : String, position : Vector3, parent : Transform ) {
	// create a new text object and set the starting height and text
	var textInstance : GameObject = Instantiate( alertTextPrefab );
	textInstance.transform.parent = parent;
	textInstance.transform.localPosition = position;
	
	textInstance.GetComponent( TextMesh ).text = message;
	
	alerts.Add( textInstance );
}
function alert( message : String, position : Vector3 ) {
	alert( message, position, null );
}
function alert( message : String ) {
	alert( message, transform.position );
}