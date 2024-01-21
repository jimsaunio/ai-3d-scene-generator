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
    float depth = readDepth(tDepth, vUv);

    // Invert the depth and adjust mapping with different functions for whites and blacks
    float invertedDepth = 1.0 - depth;

    // Strengthen whites with a higher power
    float adjustedWhites = pow(invertedDepth, 5.0);

    // Strengthen blacks with a lower power
    float adjustedBlacks = pow(invertedDepth, 1.0);

    // Combine the adjusted values
    float adjustedDepth = mix(adjustedWhites, adjustedBlacks, invertedDepth);

    // Map depth values to colors
    vec3 color = vec3(adjustedDepth);

    gl_FragColor.rgb = color;
    gl_FragColor.a = 1.0;
}