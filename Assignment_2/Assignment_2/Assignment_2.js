////////////////////////////////////////////////////////////////////////
//  A simple WebGL program to draw a 3D cube wirh basic interaction.
var gl;
var matrixStack = [];
var canvas;

//Variables for vertex shader locations
var aPositionLocation;

//Variables for fragment shader locations
var uColorLocation;
var uSpecularLightLocation;
var uAmbientLightLocation;

//Variables for shader program
var uPMatrixLocation;
var uMMatrixLocation;
var uVMatrixLocation;
var vNormalLocation;

//Variables for light
var ligtDirectionLocation;
var lightIntensityLocation;

//Variables for light
// Variables for light
var lightIntensity = 0.8;
var lightDir = [0.0, 0.5, 1.0];
var specularLight = [1.0, 1.0, 1.0, 1.0];
var ambientLight = [0.2, 0.2, 0.2, 1.0];

//Variables for buffers
var buf;
var indexBuf;
var cubeNormalBuf;
var spBuf;
var spIndexBuf;
var spNormalBuf;

//Variable for spher
var spVerts = [];
var spIndicies = [];
var spNormals = [];

var degreeX = [0.0, 0.0, 0.0];
var degreeY = [0.0, 0.0, 0.0];
var prevMouseX = 0.0;
var prevMouseY = 0.0;

// initialize model, view, and projection matrices
var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix

// specify camera/eye coordinate system parameters
var eyePos = [-0.2, 0.5, 3.0];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

var vertexShader;
var fragmentShader;
var zoomValue = 0.0;


// Phong Lighting Vertex shader code
const phongVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform vec3  eyePos;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

out vec3 v;
out vec3 eyeP;
out vec3 N;


void main() {
  v = vec3(mat3(uMMatrix) * aPosition);
  N = vec3(mat3(uMMatrix) * aNormal);
  eyeP = eyePos;

  mat4 projectionModelView;
	projectionModelView = uPMatrix * uVMatrix * uMMatrix;
  gl_Position = projectionModelView * vec4(aPosition,1.0);
  gl_PointSize = 5.0;
}`;

// Phong Lighting Fragment shader code
const phongFragShaderCode = `#version 300 es
precision mediump float;
in vec3 v;
in vec3 N;
in vec3 eyeP;

uniform vec4 objColor;
uniform vec3 sunLightDir;
uniform vec4 specularLight;
uniform vec4 ambientLight; // Ambient light color
uniform float lightIntensity;

out vec4 fragColor;

void main() {
  vec3 lightDir = sunLightDir;
  vec3 L = normalize(lightDir - v);
  vec3 E = normalize(-v);
  vec3 R = normalize(-reflect(L, N));

  vec4 Iamb = ambientLight * objColor; // Ambient light contribution
  vec4 Idiff = vec4(objColor.rgb * max(dot(N, L), 0.0) * lightIntensity, 1.0);
  vec4 Ispec = vec4(specularLight.rgb * pow(max(dot(R, E), 0.0), 5.0), 1.0);

  fragColor = Iamb + Idiff + Ispec;
}`;

// Vertex shader code
const gouraudVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform vec3 eyePos;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform vec3 sunLightDir;

uniform vec4 objColor;
uniform vec4 specularLight;
uniform vec4 ambientLight;

out vec4 vertexColor;
uniform float lightIntensity;

void main() {
  vec3 v = vec3(mat3(uMMatrix) * aPosition);
  vec3 N = vec3(mat3(uMMatrix) * aNormal);
  vec3 lightDir = sunLightDir;

  vec3 L = normalize(lightDir - v);
  vec3 E = normalize(-v);
  vec3 R = normalize(-reflect(L, N));

  vec4 Iamb = vec4(ambientLight.rgb * lightIntensity, 1.0);
  vec4 Idiff = vec4(objColor.rgb * max(dot(N, L), 0.0) * lightIntensity, 1.0);
  vec4 Ispec = vec4(specularLight.rgb * pow(max(dot(R, E), 0.0), 5.0) * lightIntensity, 1.0);
  
  vertexColor = Iamb + Idiff + Ispec;
  
  mat4 projectionModelView;
	projectionModelView = uPMatrix * uVMatrix * uMMatrix;
  gl_Position = projectionModelView * vec4(aPosition,1.0);
  gl_PointSize = 1.0;

}`;

// Fragment shader code
const goraudFragShaderCode = `#version 300 es
precision mediump float;
in vec4 vertexColor;

out vec4 fragColor;


void main() {
  // Ambient light contribution
  vec4 Iamb = vertexColor ;
  
  fragColor = Iamb;
}`;

const vertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform vec3 eyePos;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform vec3 sunLightDir;

out vec3 posInEyeSpace;
out vec3 lightDir;
float lightIntensity = 0.8;

void main() {
  lightDir = sunLightDir - eyePos;
  posInEyeSpace = (mat3(uMMatrix) * aPosition - eyePos);

  mat4 projectionModelView;
  projectionModelView = uPMatrix * uVMatrix * uMMatrix;
  gl_Position = projectionModelView * vec4(aPosition, 1.0);
  gl_PointSize = 5.0;
}`;

// Fragment shader code
const fragShaderCode = `#version 300 es
precision mediump float;
in vec3 posInEyeSpace;

in vec3 lightDir;
uniform vec4 specularLight;
uniform vec4 objColor;
uniform float lightIntensity;

uniform vec4 ambientLight; // Add ambient light uniform

out vec4 fragColor;

void main() {
  vec3 normal = normalize(cross(dFdx(posInEyeSpace), dFdy(posInEyeSpace)));

  vec3 L = normalize(lightDir - posInEyeSpace);
  vec3 E = normalize(-posInEyeSpace);
  vec3 R = normalize(reflect(-L, normal));

  // Ambient light contribution
  vec4 Iamb = objColor * ambientLight;

  vec4 Idiff = vec4(objColor.rgb * max(dot(normal, L), 0.0) * lightIntensity, 1.0);
  vec4 Ispec = specularLight * pow(max(dot(R, E), 0.0), 10.0) * lightIntensity;

  fragColor = Iamb + Idiff + Ispec;
}`;

function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

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

function initShaders(vertexShader, fragmentShader) {
    shaderProgram = gl.createProgram();
  
    // attach the shaders
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    // link the shader program
    gl.linkProgram(shaderProgram);
  
    // check for compilation and linking status
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.log("Shader program failed to link.");
      console.log(gl.getProgramInfoLog(shaderProgram));
      return;
    }
  
    // finally use the program
    gl.useProgram(shaderProgram);
  
    // get locations of attributes and uniforms declared in the shader
    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    vNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    eyePositionLocation = gl.getUniformLocation(shaderProgram, "eyePos");
    ligtDirectionLocation = gl.getUniformLocation(shaderProgram, "sunLightDir");
    lightIntensityLocation = gl.getUniformLocation(shaderProgram, "lightIntensity");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    uColorLocation = gl.getUniformLocation(shaderProgram, "objColor");
    uSpecularLightLocation = gl.getUniformLocation(shaderProgram, "specularLight");
    uAmbientLightLocation = gl.getUniformLocation(shaderProgram, "ambientLight");
  
    // Check if attribute and uniform locations are valid before enabling them
    if (aPositionLocation !== -1) {
      gl.enableVertexAttribArray(aPositionLocation);
    } else {
      console.log("aPosition attribute not found in the shader.");
    }
  
    if (vNormalLocation !== -1) {
      gl.enableVertexAttribArray(vNormalLocation);
    } else {
      console.log("aNormal attribute not found in the shader.");
    }
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
  var nslices = 15;
  var nstacks = 15;
  var radius = 0.5;

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
  //gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    spBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

//   gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.vertexAttribPointer(
    vNormalLocation,
    spNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // Set the eye position uniform
  gl.uniform3fv(eyePositionLocation, eyePos);

  // Set uniform matrices here
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);

  // Set the object color uniform
  gl.uniform4fv(uColorLocation, color); // Assuming uColorLocation is the uniform location for the color

  // Set the light direction uniform
  gl.uniform3fv(ligtDirectionLocation, lightDir);
  gl.uniform4fv(uSpecularLightLocation, specularLight);
  gl.uniform4fv(uAmbientLightLocation, ambientLight);
  gl.uniform1f(lightIntensityLocation, lightIntensity);

  // Bind the index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);

  // Draw the sphere
  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

// Cube generation function with normals
function initCubeBuffer() {
  var vertices = [
    // Front face
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Back face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    // Top face
    -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Bottom face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    // Right face
    0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
    // Left face
    -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,
  ];
  buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  buf.itemSize = 3;
  buf.numItems = vertices.length / 3;

  var normals = [
    // Front face
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    // Back face
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    // Top face
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    // Bottom face
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
    // Right face
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    // Left face
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];
  cubeNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  cubeNormalBuf.itemSize = 3;
  cubeNormalBuf.numItems = normals.length / 3;


  var indices = [
    0,
    1,
    2,
    0,
    2,
    3, // Front face
    4,
    5,
    6,
    4,
    6,
    7, // Back face
    8,
    9,
    10,
    8,
    10,
    11, // Top face
    12,
    13,
    14,
    12,
    14,
    15, // Bottom face
    16,
    17,
    18,
    16,
    18,
    19, // Right face
    20,
    21,
    22,
    20,
    22,
    23, // Left face
  ];
  indexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  indexBuf.itemSize = 1;
  indexBuf.numItems = indices.length;
}

function drawCube(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(
    aPositionLocation,
    buf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.vertexAttribPointer(
    vNormalLocation,
    cubeNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // Set the eye position uniform
  gl.uniform3fv(eyePositionLocation, eyePos);

  // Set uniform matrices here
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);

  // Set the object color uniform
  gl.uniform4fv(uColorLocation, color); // Assuming uColorLocation is the uniform location for the color

  // Set the light direction uniform
  gl.uniform3fv(ligtDirectionLocation, lightDir);
  gl.uniform4fv(uSpecularLightLocation, specularLight);
  gl.uniform4fv(uAmbientLightLocation, ambientLight);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
  //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}

function updateZoom(value) {
    zoomValue = -value;
    // eyePos[2] = zoomValue;
  
    // Call drawScene to update the rendering
    drawScene(zoomValue);
}

function updateLightPosition(val) {
    lightDir = [Math.sin(degToRad(val)), 0.5, Math.cos(degToRad(val))];
    drawScene(zoomValue);
}

//////////////////////////////////////////////////////////////////////
//Main drawing routine
function drawScene(zoom) {
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);

  // set up the view matrix, multiply into the modelview matrix
  mat4.identity(vMatrix);
  vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

  //set up perspective projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

  //set up the model matrix
  mat4.identity(mMatrix);

  //Allowing to zoom in and zoom out
  mMatrix = mat4.translate(mMatrix, [0.0, 0.0, -zoom]);

  //Rotating the object
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(degreeX[0]), [0.0, 1.0, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degreeY[0]), [1.0, 0.0, 0.0]);

  //Creating new Leftmost Viewport
// ViewPort 1 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  gl.viewport(0, 0, 300, 300);
  gl.scissor(0, 0, 300, 300);
  gl.clearColor(0.5, 0.1, 0.45, 0.3);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Defining which shaders to use
  vertexShader = vertexShaderSetup(vertexShaderCode);
  fragmentShader = fragmentShaderSetup(fragShaderCode);

  initShaders(vertexShader, fragmentShader);

  //Drawing the sphere
  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0.0, 0.5, 0.0]);
  mMatirx = mat4.scale(mMatrix, [0.75, 0.75, 0.75]);

  var sphereColor = [0.1, 0.4, 0.9, 1.0];
  drawSphere(sphereColor);

  mMatrix = popMatrix(matrixStack);

  //Drawing the cube
  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0.0, -0.4, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(30), [0.0, 1.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [0.75, 1.0, 0.75]);

  var cubeColor = [0.5, 0.8, 0.1, 1.0];
  drawCube(cubeColor);

  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

// ViewPort 2 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //Creating new Middle Viewport
  gl.viewport(300, 0, 300, 300);
  gl.scissor(300, 0, 300, 300);
  gl.clearColor(0.75, 0.8, 0.95, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Defining which shaders to use
  vertexShader = vertexShaderSetup(gouraudVertexShaderCode);
  fragmentShader = fragmentShaderSetup(goraudFragShaderCode);

  initShaders(vertexShader, fragmentShader);

  //Rotating the object
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(degreeX[1]), [0.0, 1.0, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degreeY[1]), [1.0, 0.0, 0.0]);

  //Drawing the sphere

  mMatrix = mat4.translate(mMatrix, [0.0, 0.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [1.0, 1.0, 1.0]);

  sphereColor = [0.9, 0.1, 0.9, 1];
  drawSphere(sphereColor);

  //Drawing the cube
  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [-0.2, -0.85, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(30), [0.0, 1.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [0.75, 0.75, 0.75]);

  var cubeColor = [0.1, 0.9, 0.1, 1];
  drawCube(cubeColor);

  //Drawing the cube
  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0.4, 2.15, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(30), [0.0, 1.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [0.75, 0.75, 0.75]);

  var cubeColor = [0.1, 0.9, 0.1, 1];;
  drawCube(cubeColor);
  mMatrix = popMatrix(matrixStack);

  //Drawing the sphere
  
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.65, 2.2, 0.65]);
  mMatrix = mat4.scale(mMatrix, [0.6, 0.6, 0.6]);
  sphereColor = [0.9, 0.1, 0.9, 1.0];
  drawSphere(sphereColor);
  mMatrix = popMatrix(matrixStack);


  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

//Creating new Rightmost Viewport
// ViewPort 3 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  //Creating new Middle Viewport
  gl.viewport(600, 0, 300, 300);
  gl.scissor(600, 0, 300, 300);
  gl.clearColor(0.65, 0.5, 0.45, 0.7);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Defining which shaders to use
  vertexShader = vertexShaderSetup(phongVertexShaderCode);
  fragmentShader = fragmentShaderSetup(phongFragShaderCode);

  initShaders(vertexShader, fragmentShader);
  //Rotating the object

  mMatrix = mat4.rotate(mMatrix, degToRad(degreeX[2]), [0.0, 1.0, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degreeY[2]), [1.0, 0.0, 0.0]);

  mMatrix = mat4.scale(mMatrix, [0.7, 0.7, 0.7]);
  //Drawing the sphere
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.75, 0.0, 0.45]);
  mMatrix = mat4.scale(mMatrix, [0.7, 0.7, 0.7]);
  sphereColor = [0.9, 0.1, 0.3, 1];
  drawSphere(sphereColor);
  mMatrix = popMatrix(matrixStack);

  //Drawing the sphere
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.75, 0.0, -0.45]);
  mMatrix = mat4.scale(mMatrix, [0.7, 0.7, 0.7]);
  sphereColor = [0.1, 0.9, 0.9, 1];
  drawSphere(sphereColor);
  mMatrix = popMatrix(matrixStack);

  //Drawing the sphere
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.0, 1.05, 0.0]);
  mMatrix = mat4.scale(mMatrix, [1.0, 1.0, 1.0]);
  sphereColor = [1.0, 0.0, 0.0, 1];
  drawSphere(sphereColor);
  mMatrix = popMatrix(matrixStack);

  //Drawing the cube
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.0, -0.45, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(30), [0.0, 1.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [2.5, 0.2, 0.75]);
  var cubeColor = [0.1, 0.9, 0.1, 1];
  drawCube(cubeColor);
  mMatrix = popMatrix(matrixStack);

  //Drawing the cube
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.0, 0.45, 0.0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(30), [0.0, 1.0, 0.0]);
  mMatrix = mat4.scale(mMatrix, [2.5, 0.2, 0.75]);
  var cubeColor = [0.1, 0.9, 0.1, 1];
  drawCube(cubeColor);
  mMatrix = popMatrix(matrixStack);

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
    event.layerX <= canvas.width/3 &&
    event.layerX >= 0 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    var mouseX = event.clientX;
    var diffX1 = mouseX - prevMouseX;
    prevMouseX = mouseX;
    degreeX[0] = degreeX[0] + diffX1 / 5;

    var mouseY = canvas.height - event.clientY;
    var diffY2 = mouseY - prevMouseY;
    prevMouseY = mouseY;
    degreeY[0] = degreeY[0] - diffY2 / 5;

    drawScene(zoomValue);
  }
  else if (
    event.layerX <= 2 * canvas.width/3 &&
    event.layerX >= canvas.width/3 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    var mouseX = event.clientX;
    var diffX1 = mouseX - prevMouseX;
    prevMouseX = mouseX;
    degreeX[1] = degreeX[1] + diffX1 / 5;

    var mouseY = canvas.height - event.clientY;
    var diffY2 = mouseY - prevMouseY;
    prevMouseY = mouseY;
    degreeY[1] = degreeY[1] - diffY2 / 5;

    drawScene(zoomValue);
  }
  else if (
    event.layerX <= canvas.width &&
    event.layerX >= 2 * canvas.width / 3 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    var mouseX = event.clientX;
    var diffX1 = mouseX - prevMouseX; // Corrected variable name to diffX1
    prevMouseX = mouseX;
    degreeX[2] = degreeX[2] + diffX1 / 5; // Corrected variable name to diffX1
  
    var mouseY = canvas.height - event.clientY;
    var diffY2 = mouseY - prevMouseY;
    prevMouseY = mouseY;
    degreeY[2] = degreeY[2] - diffY2 / 5;
  
    drawScene(zoomValue);
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
  canvas = document.getElementById("Assignment_2");

  // ZOOM
  const zoomSlider = document.getElementById("zoomSlider");
  zoomSlider.addEventListener("input", function () {
    // Update zoomValue and eyePos based on slider value
    const newZoomValue = parseFloat(zoomSlider.value);
    updateZoom(newZoomValue);
  });

  const lightPositionSlider = document.getElementById("lightPositionSlider");
  lightPositionSlider.addEventListener("input", function () {
    // Update the light position based on the slider value
    const newLightPositionX = parseFloat(lightPositionSlider.value);
    updateLightPosition(newLightPositionX);
  });

  document.addEventListener("mousedown", onMouseDown, false);

  
  // initialize WebGL
  initGL(canvas);

  //initialize buffers for the square
  initCubeBuffer();
  //intialize buffers for the sphere
  initSphereBuffer();

  drawScene(0);
}