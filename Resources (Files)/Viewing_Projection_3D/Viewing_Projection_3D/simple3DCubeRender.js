////////////////////////////////////////////////////////////////////////
//  A simple WebGL program to draw a 3D cube wirh basic interaction.
//

var gl;
var canvas;

var buf;
var indexBuf;
var aPositionLocation;
var uColorLocation;
var uPMatrixLocation;
var uMMatrixLocation;
var uVMatrixLocation;

/////////////////////
var cubeNormalBuf;
var spBuf;
var spIndexBuf;
var spNormalBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];
//////////////////////

var degree1 = 0.0;
var degree0 = 0.0;
var prevMouseX = 0.0;
var prevMouseY = 0.0;

// initialize model, view, and projection matrices
var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix

// specify camera/eye coordinate system parameters
let zoom = 2.0;
var eyePos = [0.0, 0.0, zoom];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

// Vertex shader code
const vertexShaderCode = `#version 300 es
in vec3 aPosition;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

varying vec3 fragNormal;
varying vec3 fragLightDir;
varying vec3 fragViewDir;

void main() {
  // Calculate the vertex position in eye space
  vec4 posInEyeSpace = uVMatrix * uMMatrix * vec4(aPosition, 1.0);
  
  // Pass the vertex position to the fragment shader
  fragNormal = normalize(cross(dFdx(posInEyeSpace.xyz), dFdy(posInEyeSpace.xyz)));
  
  // Calculate the light vector in eye space
  vec3 lightPosition = vec3(0.0, 1.0, 1.0); // Example light position
  vec3 lightDir = normalize(lightPosition - posInEyeSpace.xyz);
  fragLightDir = lightDir;
  
  // Calculate the view vector from the vertex to the camera
  fragViewDir = normalize(-posInEyeSpace.xyz);
  
  // Calculate the final position in clip space
  gl_Position = uPMatrix * posInEyeSpace;
}`;

// Fragment shader code
const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

precision mediump float;
varying vec3 fragNormal;
varying vec3 fragLightDir;
varying vec3 fragViewDir;
uniform vec3 ambientColor;
uniform vec3 lightColor;
uniform float ambientStrength;
uniform float specularStrength;
uniform float shininess;
uniform vec4 objColor;

void main() {
  // Normalize vectors
  vec3 normal = normalize(fragNormal);
  vec3 lightDir = normalize(fragLightDir);
  vec3 viewDir = normalize(fragViewDir);
  
  // Calculate diffuse reflection
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * lightColor;
  
  // Calculate specular reflection
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
  vec3 specular = specularStrength * spec * lightColor;
  
  // Calculate ambient reflection
  vec3 ambient = ambientStrength * ambientColor;
  
  // Combine the components to get the final color
  vec3 result = (ambient + diffuse + specular) * objColor.rgb;
  
  FragColor = vec4(result, objColor.a);

}`;

function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function fragmentShaderSetup(fragShaderCode) {
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders() {
  shaderProgram = gl.createProgram();

  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compilation and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  gl.useProgram(shaderProgram);

  return shaderProgram;
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2"); // the graphics webgl2 context
    gl.viewportWidth = canvas.width; // the width of the canvas
    gl.viewportHeight = canvas.height; // the height
  } catch (e) {}
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

// New sphere initialization function
function initSphere(nslices, nstacks, radius) {
  for (var i = 0; i <= nslices; i++) {
    var angle = (i * Math.PI) / nslices;
    var comp1 = Math.sin(angle);
    var comp2 = Math.cos(angle);

    for (var j = 0; j <= nstacks; j++) {
      var phi = (j * 2 * Math.PI) / nstacks;
      var comp3 = Math.sin(phi);
      var comp4 = Math.cos(phi);

      var xcood = comp4 * comp1;
      var ycoord = comp2;
      var zcoord = comp3 * comp1;

      spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
      spNormals.push(xcood, ycoord, zcoord);
    }
  }

  // now compute the indices here
  for (var i = 0; i < nslices; i++) {
    for (var j = 0; j < nstacks; j++) {
      var id1 = i * (nstacks + 1) + j;
      var id2 = id1 + nstacks + 1;

      spIndicies.push(id1, id2, id1 + 1);
      spIndicies.push(id2, id2 + 1, id1 + 1);
    }
  }
}

function initSphereBuffer() {
  var nslices = 50;
  var nstacks = 50;
  var radius = 1.0;

  initSphere(nslices, nstacks, radius);

  // buffer for vertices
  spBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
  spBuf.itemSize = 3;
  spBuf.numItems = spVerts.length / 3;

  // buffer for indices
  spIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(spIndicies),
    gl.STATIC_DRAW
  );
  spIndexBuf.itemsize = 1;
  spIndexBuf.numItems = spIndicies.length;

  // buffer for normals
  spNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
  spNormalBuf.itemSize = 3;
  spNormalBuf.numItems = spNormals.length / 3;
}

function drawSphere(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    spBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // Set uniform matrices here
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);

  // Set the object color uniform
  gl.uniform4fv(uColorLocation, color); // Assuming uColorLocation is the uniform location for the color

  // Bind the index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);

  // Draw the sphere
  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearColor(0.9, 0.9, 0.95, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Set up the view matrix, multiply into the modelview matrix
  mat4.identity(vMatrix);
  vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

  // Set up perspective projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(100, 1.0, 0.1, 1000, pMatrix);

  // Set up the model matrix for the cube
  mat4.identity(mMatrix);

  // Apply transformations for the cube
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [1, 0, 0]);

  // Draw the cube
  var cubeColor = [0.5, 0.0, 0, 1]; // specify color for the cube
  drawSphere(cubeColor);

  // Set up the sphere model matrix (if needed)
  mat4.identity(mMatrix);
  // Apply transformations for the sphere (if needed)

  // Set uniform matrices for the sphere
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);

  // Bind and draw the sphere
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(aPositionLocation, spBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);

  // Set texture related bindings and uniforms if needed

  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

function onMouseDown(event) {
  document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener("mouseup", onMouseUp, false);
  document.addEventListener("mouseout", onMouseOut, false);

  if (
    event.layerX <= canvas.width &&
    event.layerX >= 0 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    prevMouseX = event.clientX;
    prevMouseY = canvas.height - event.clientY;
  }
}

function onMouseMove(event) {
  // make mouse interaction only within canvas
  if (
    event.layerX <= canvas.width &&
    event.layerX >= 0 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    var mouseX = event.clientX;
    var diffX1 = mouseX - prevMouseX;
    prevMouseX = mouseX;
    degree0 = degree0 + diffX1 / 5;

    var mouseY = canvas.height - event.clientY;
    var diffY2 = mouseY - prevMouseY;
    prevMouseY = mouseY;
    degree1 = degree1 - diffY2 / 5;

    drawScene();
  }
}

function onMouseUp(event) {
  document.removeEventListener("mousemove", onMouseMove, false);
  document.removeEventListener("mouseup", onMouseUp, false);
  document.removeEventListener("mouseout", onMouseOut, false);
}

function onMouseOut(event) {
  document.removeEventListener("mousemove", onMouseMove, false);
  document.removeEventListener("mouseup", onMouseUp, false);
  document.removeEventListener("mouseout", onMouseOut, false);
}

// This is the entry point from the html
function webGLStart() {
  canvas = document.getElementById("simple3DCubeRender");
  document.addEventListener("mousedown", onMouseDown, false);

  // initialize WebGL
  initGL(canvas);

  // initialize shader program
  shaderProgram = initShaders();

  //get locations of attributes and uniforms declared in the shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uColorLocation = gl.getUniformLocation(shaderProgram, "objColor");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);

  //initialize buffers for the square
  // initCubeBuffer();
  initSphereBuffer();

  drawScene();
}
