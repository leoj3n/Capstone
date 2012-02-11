/*
@CustomEditor( Avatar )
class AvatarEditor extends Editor {
	private var _object : SerializedObject;
	private var _walkSpeed : SerializedProperty;
	
	function OnEnable() {
		_object = new SerializedObject( target );
		_walkSpeed = _object.FindProperty( 'walkSpeed' );
	}
	
	function OnInspectorGUI() {
		_object.Update();
		
		if( EditorGUILayout.Foldout( true, 'Avatar Parameters' ) ) {
			EditorGUILayout.PropertyField( _walkSpeed );
		}
		
		if (GUI.changed) EditorUtility.SetDirty( target ); // tell Unity the project need to be saved
		
		_object.ApplyModifiedProperties();
	}
}
*/