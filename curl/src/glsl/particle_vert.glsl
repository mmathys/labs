#pragma glslify: curl = require(glsl-curl-noise)

// varying vec2 vUv;
// varying vec3 vPosition;

uniform float time;
attribute float _index;

void main()
{
    float multiplier = -100.;

    //vec3 curlP = curl(position + (time));
    vec3 curlP = curl(position);

    //curlP.x = curlP.x * smoothstep(0., 200., curlP.z);
    curlP *= multiplier;

    //curlP.z = position.z;

    // curlP.y = abs(curlP.y);
    // curlP.y += 1. / _index;

    // vPosition = curlP;
    // vUv = uv;

    gl_PointSize = 1.;

    // transforming vec3 to vec4, because that's how matrices in 3d are vec4.
    vec4 position = vec4(curlP, 1.0);

    // translating with modelViewMatrix for rotation and scroll support!
    vec4 mvPosition = modelViewMatrix * position;

    // setting the gl_Position of points.
    gl_Position = projectionMatrix * mvPosition;
  }
