#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = pointSize;
}

#endif

#ifdef FRAG


uniform float calories;
uniform sampler2D caloriesGradientTex;

void main() {
  gl_FragColor = texture2D(caloriesGradientTex, vec2(calories, 0.5));
}

#endif
