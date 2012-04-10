Shader "Custom/VideoAlpha" { // half of video is mask
	Properties {
		_MainTex( "Base (RGB)", 2D ) = "white" {}
		_AlphaOffsetX( "alpha offset x", float ) = 0.5
		_AlphaOffsetY( "alpha offset y", float ) = 0
		_Cutoff( "Cutoff", Range ( 0,1 ) ) = 0 // increase to tighten the mask
		}
	SubShader {
		Tags { "Queue" = "Transparent" }
		ZWrite Off // don't need z-index
		AlphaTest Greater [_Cutoff]
		Blend SrcAlpha OneMinusSrcAlpha
		Pass {
			CGPROGRAM
				#pragma exclude_renderers gles
				#pragma fragment frag
				#include "UnityCG.cginc"
				
				sampler2D _MainTex;
				float _AlphaOffsetX;
				float _AlphaOffsetY;
				
				struct v2f {
					float4 pos : POSITION;
					float4 uv : TEXCOORD0;
				};
				
				half4 frag( v2f i ) : COLOR { 
					half4 colr1 = tex2D( _MainTex, i.uv.xy );
					i.uv.x += _AlphaOffsetX;
					i.uv.y += _AlphaOffsetY;
					half4 colr2 = tex2D( _MainTex, i.uv.xy );
					
					return half4( colr1.r, colr1.g, colr1.b, colr2.r );
				}
			ENDCG
		}
	}
	
	Fallback "Transparent/Diffuse"
}