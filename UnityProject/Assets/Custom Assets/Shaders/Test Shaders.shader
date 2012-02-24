Shader "Custom/Test Shaders" {
	FallBack "Diffuse"
}

/*
Shader "Custom/VideoAlpha" { // half of video is mask
	Properties {
		_MainTex( "Base (RGB)", 2D ) = "white" {}
		_AlphaOffsetX( "alpha offset x", float ) = 0.5
		_AlphaOffsetY( "alpha offset y", float ) = 0
		_Cutoff( "Cutoff", Range ( 0,1 ) ) = .5 // any pixel with an alpha less than this gets thrown out
		}
	SubShader {
		Tags { "Queue" = "Transparent" }
		ZWrite Off
		AlphaTest Less [_Cutoff]
		CGPROGRAM
			#pragma surface surf Lambert
			
			sampler2D _MainTex;
			float _AlphaOffsetX;
			float _AlphaOffsetY;
			
			struct Input {
				float2 uv_MainTex;
			};
			
			void surf( Input IN, inout SurfaceOutput o ) {
				half4 c = tex2D( _MainTex, IN.uv_MainTex );
				IN.uv_MainTex.x += _AlphaOffsetX;
				IN.uv_MainTex.y += _AlphaOffsetY;
				half4 d = tex2D( _MainTex, IN.uv_MainTex );
				o.Albedo = c.rgb;
				o.Alpha = (d.r * -1) + 1;
			}
		ENDCG
	}
	FallBack "Diffuse"
}
*/

/*
Shader "Custom/SplitAlpha" { // uses second video as alpha
	Properties {
		_MainTex( "Base (RGB)", 2D ) = "white" {}
		_Mask( "Culling Mask", 2D ) = "white" {}
		_Cutoff( "Cutoff", Range ( 0, 1 ) ) = .5
	}
	
	SubShader {
		Tags { "Queue" = "Transparent" }
		
		ZWrite Off
		Blend SrcAlpha OneMinusSrcAlpha
		
		Pass {
			CGPROGRAM
				// Upgrade NOTE: excluded shader from OpenGL ES 2.0 because it does not contain a surface program or both vertex and fragment programs.
				#pragma exclude_renderers gles
				#pragma fragment frag
				#include "UnityCG.cginc"
				
				sampler2D _MainTex;
				sampler2D _Mask;
				
				struct v2f {
					float4 pos : POSITION;
					float4 uv : TEXCOORD0;
					float4 uv2 : TEXCOORD1;
				};
				
				half4 frag( v2f i ) : COLOR { 
					half4 color = tex2D( _MainTex, i.uv.xy );
					half4 color2 = tex2D( _Mask, i.uv2.xy );
					
					return half4( color.r, color.g, color.b, color2.r );
				}
			ENDCG
		}
	}
	
	Fallback "Transparent/Diffuse"
}
*/

/*
Shader "Custom/SplitAlpha2" { // masks out green color
	Properties {
		_MainTex( "Base (RGB)", 2D ) = "black" {}
		_Cutoff( "Cutoff", Range ( 0, 1 ) ) = .5
	}

	SubShader {
		Tags { "Queue" = "Transparent" }
		
		ZWrite Off
		Blend SrcAlpha OneMinusSrcAlpha
		
		Pass {
			CGPROGRAM
				// Upgrade NOTE: excluded shader from OpenGL ES 2.0 because it does not contain a surface program or both vertex and fragment programs.
				#pragma exclude_renderers gles
				#pragma fragment frag
				#include "UnityCG.cginc"

				sampler2D _MainTex;
				
				struct v2f {
					float4 pos : POSITION;
					float4 uv : TEXCOORD0;
					float4 uv2 : TEXCOORD1;
				};
				
				half4 frag( v2f i ) : COLOR {
					half4 color = tex2D( _MainTex, i.uv.xy );
					
					if (color.g >= 0.55)
						return half4( 0, 0, 0, 0 ); // don't show
					else if (color.g >= 0.45)
						return half4( color.r, color.g, color.b, (1.0 - color.g) ); // the more green, the more transparent (+ desaturate)
					else
						return half4( color.r, color.g, color.b, 1 );
				}
			ENDCG
		}
	}
	Fallback "Transparent/Diffuse"
}
*/

/*
Shader "Custom/Mask" { //  supposed to mask out selected color
	Properties {
		_MainTex( "Base (RGB)", 2D ) = "white" {}
		_MaskCol( "Mask Color", Color )  = (1.0, 0.0, 0.0, 1.0)
	}
	
	SubShader {
		Tags { "Queue" = "Transparent" }
		
		ZWrite Off
		Blend SrcAlpha OneMinusSrcAlpha
		
		CGINCLUDE
			#include "UnityCG.cginc"
			
			half3 NormalizeColor( half3 color ) {
				//return color / max(dot(color, half3(1.0f/3.0f)), 0.0001);
				return color / dot( color, fixed3( 0.22, 0.707, 0.071 ) );
			}
			
			half4 MaskColor( half3 mCol, half3 cCol ) {
				half4 d = distance( NormalizeColor( mCol.rgb ), NormalizeColor( cCol.rgb ) );
				return (( d > 0.9f ) ? half4( 1.0 ) : half4( 0.0 ));
			}
		ENDCG
		
		Pass {
			//Cull Off Lighting Off Fog { Mode off } // ZWrite Off ZTest Always 
			CGPROGRAM
				// Upgrade NOTE: excluded shader from OpenGL ES 2.0 because it does not contain a surface program or both vertex and fragment programs.
				#pragma exclude_renderers gles
				//#pragma vertex vert_img 
				#pragma fragment frag
				//#pragma fragmentoption ARB_precision_hint_fastest
				#include "UnityCG.cginc"
				
				sampler2D _MainTex;
				float4 _MaskCol;
				
				struct v2f {
					float4 pos : POSITION;
					float4 uv : TEXCOORD0;
				};
				
				half4 frag( v2f i ) : COLOR {
					half4 col = tex2D( _MainTex, i.uv.xy );
					//half4 mask = MaskColor( _MaskCol.rgb, col.rgb );
					
					half4 d = distance( NormalizeColor( _MaskCol.rgb ), NormalizeColor( col.rgb ) );
					
					return half4( col.r, col.g, col.b, (d/2) );
					
					//return col * mask;
					//return mask;
				}
			ENDCG
		}
	}
	Fallback off
}
*/