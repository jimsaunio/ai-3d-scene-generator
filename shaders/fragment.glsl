#include <packing>

varying vec2 vUv;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;

float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
    return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

void main() {
				//vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
    float depth = readDepth(tDepth, vUv);
  // Invert the depth and adjust mapping
    float invertedDepth = 1.0 - depth;
    float adjustedDepth = pow(invertedDepth, 2.0); // Higher power for more contrast

    // Map depth values to colors
    vec3 color = vec3(adjustedDepth);

    gl_FragColor.rgb = color;
    gl_FragColor.a = 1.0;
}