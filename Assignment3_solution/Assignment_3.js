////////////////////////////////////////////////////////////////////////
// Assignment 3 
// Name- Kantule Ritesh Ramdas
// Roll No- 210488


var gl;
var canvas;
var matrixStack = [];

var aPositionLocation;
var aTexCoordLocation;
var aNormalLocation;

var uVMatrixLocation;
var uMMatrixLocation;
var uPMatrixLocation;
var uNMatrixLocation;

var uEyePos;

var cubeMapPath = "texture_and_other_files/Nvidia_cubemap/";
var posx, posy, posz, negx, negy, negz;

var posx_file = cubeMapPath.concat("posx.jpg");
var posy_file = cubeMapPath.concat("posy.jpg");
var posz_file = cubeMapPath.concat("posz.jpg");
var negx_file = cubeMapPath.concat("negx.jpg");
var negy_file = cubeMapPath.concat("negy.jpg");
var negz_file = cubeMapPath.concat("negz.jpg");


var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var nMatrix = mat4.create(); // normal matrix
var pMatrix = mat4.create(); //projection matrix

var spBuf;
var spIndexBuf;
var spNormalBuf;
var spTexBuf;

var sqVertexIndexBuffer;
var sqVertexPositionBuffer;
var sqIndices;

var buf;
var indexBuf;
var cubeNormalBuf;
var cubeTexBuf;

var objVertexPositionBuffer;
var objVertexNormalBuffer;
var objVertexIndexBuffer;
var objTexPositionBuffer;

var spVerts = [];
var spIndicies = [];
var spNormals = [];
var spTexCoords = [];

var uTextureLocation;
var sampleTexture;

var lightDir = [-0.2, 0.9, 2.5];
var specularLight = [1.0, 1.0, 1.0, 1.0];
var shininess = 100.0;
var lightIntensity = 0.8;

var uLightDirLocation
var uSpecularLightLocation;
var uShininessLocation;
var uLightIntensityLocation;

var uObjectColorLocation;

var cubemapTextureLocation;
var cubemapTexture;

var rCubeTextureFile = "texture_and_other_files/rcube.png";
var rCubeTexture;

var woodTextureFile = "texture_and_other_files/wood_texture.jpg";
var woodTexture;

var uRegLocation;

var eyePos = [4.5, 1.5, 4.5]; // camera/eye position
var xCam = 0;
var yCam = 0;
var zCam = 0;

input_JSON = "texture_and_other_files/teapot.json";

var animation;
var degree = 0;

//////////////////////////////////////////////////////////////////////////

const phongVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uNMatrix;

out vec3 fragNormal;
out vec3 fragPosition;
out vec3 wNNormal;

void main() {
  mat4 projectionModelView;
  projectionModelView = uPMatrix * uVMatrix * uMMatrix;

  fragPosition = vec3(uMMatrix * vec4(aPosition, 1.0));
  fragNormal = vec3(uMMatrix * vec4(aNormal, 1.0));

  wNNormal = vec3(uNMatrix * vec4(aNormal, 1.0));

  // calculate clip space position
  gl_Position =  projectionModelView * vec4(aPosition, 1.0);
  gl_PointSize = 5.0;
}`;

const phongFragShaderCode = `#version 300 es
precision highp float;

in vec3 fragNormal;
in vec3 fragPosition;
in vec3 wNNormal;

uniform vec3 eyePos;
uniform vec3 lightDir;
uniform vec4 specularLight;
uniform float shininess;
uniform float lightIntensity;

uniform samplerCube cubeMap;

uniform vec4 objectColor;

out vec4 fragColor;

void main()
{
  //Calculate reflection
  vec3 worldNormal = normalize(wNNormal);
  vec3 eyeToSurfaceDir = normalize(fragPosition - eyePos);

  vec3 reflectedDir = reflect(eyeToSurfaceDir, worldNormal);

  vec4 cubeMapReflectColor = texture(cubeMap, reflectedDir);


  //Calculate phong color
  vec3 normal = normalize(fragNormal);
  eyeToSurfaceDir = normalize(-fragPosition);

  vec3 lightDirNormalized = normalize(lightDir - fragPosition);
  reflectedDir = reflect(-lightDirNormalized, normal);

  vec4 Iamb = vec4(objectColor.rgb * lightIntensity * 0.75, 1.0);
  vec4 Idiff = vec4(objectColor.rgb * lightIntensity * max(dot(normal, lightDirNormalized), 0.0), 1.0);
  vec4 Ispec = vec4(specularLight.rgb * lightIntensity * pow(max(dot(reflectedDir, eyeToSurfaceDir), 0.0), shininess), 1.0);

  vec4 phongColor = Iamb + Idiff + Ispec;

  //Final color

  vec4 finalColor = cubeMapReflectColor * 0.5 + phongColor * 0.8;

  fragColor = finalColor;
}`;

const reflectionVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform mat4 uNMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

out vec3 fragNormal;
out vec3 fragPosition;

void main() {
  mat4 projectionModelView;
	projectionModelView = uPMatrix * uVMatrix * uMMatrix;

  fragPosition = vec3(uMMatrix * vec4(aPosition, 1.0));
  fragNormal = vec3(uNMatrix * vec4(aNormal, 1.0));

  // calcuie clip space position
  gl_Position =  projectionModelView * vec4(aPosition, 1.0);
}`;

const reflectionFragShaderCode = `#version 300 es
precision highp float;

in vec3 fragNormal;
in vec3 fragPosition;

uniform samplerCube cubeMap;
uniform vec3 eyePos;

out vec4 fragColor;

void main() {
  vec3 worldNormal = normalize(fragNormal);
  vec3 eyeToSurfaceDir = normalize(fragPosition - eyePos);

  vec3 reflectedDir = reflect(eyeToSurfaceDir, worldNormal);

  vec4 cubeMapReflectColor = texture(cubeMap, reflectedDir);

  fragColor = cubeMapReflectColor;
}`;

const refractVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform mat4 uNMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

out vec3 fragNormal;
out vec3 fragPosition;

void main() {
  mat4 projectionModelView;
	projectionModelView = uPMatrix * uVMatrix * uMMatrix;

  fragPosition = vec3(uMMatrix * vec4(aPosition, 1.0));
  fragNormal = vec3(uNMatrix * vec4(aNormal, 1.0));

  // calcuie clip space position
  gl_Position =  projectionModelView * vec4(aPosition, 1.0);
}`;

const refractFragShaderCode = `#version 300 es
precision highp float;

in vec3 fragNormal;
in vec3 fragPosition;

uniform samplerCube cubeMap;
uniform vec3 eyePos;

out vec4 fragColor;

void main() {
  vec3 worldNormal = normalize(fragNormal);
  vec3 eyeToSurfaceDir = normalize(fragPosition - eyePos);

  vec3 refractedDir = refract(eyeToSurfaceDir, worldNormal, 0.82);

  vec4 cubeMapRefractionColor = texture(cubeMap, refractedDir);

  fragColor = cubeMapRefractionColor;
}`;

const textureVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoords;

uniform mat4 uMMatrix;
uniform mat4 uNMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

out vec2 fragTexCoords;

void main() {

  fragTexCoords = aTexCoords;

  mat4 projectionModelView;
  projectionModelView = uPMatrix * uVMatrix * uMMatrix;
  
  gl_Position = projectionModelView * vec4(aPosition, 1.0);
  gl_PointSize = 10.0;
}`;

const textureFragShaderCode = `#version 300 es
precision highp float;

in vec2 fragTexCoords;

uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
  fragColor = texture(uTexture, fragTexCoords);
}`;

const reflectTexVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoords;

uniform mat4 uMMatrix;
uniform mat4 uNMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

out vec3 fragNormal;
out vec3 fragPosition;
out vec2 fragTexCoords;

void main() {
  mat4 projectionModelView;
	projectionModelView = uPMatrix * uVMatrix * uMMatrix;

  fragPosition = vec3(uMMatrix * vec4(aPosition, 1.0));
  fragNormal = vec3(uNMatrix * vec4(aNormal, 1.0));

  fragTexCoords = aTexCoords;

  // calcuie clip space position
  gl_Position =  projectionModelView * vec4(aPosition, 1.0);
}`;

const reflectTexFragShaderCode = `#version 300 es
precision mediump float;

in vec3 fragNormal;
in vec3 fragPosition;
in vec2 fragTexCoords;

uniform samplerCube cubeMap;
uniform vec3 eyePos;

uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
  vec3 worldNormal = normalize(fragNormal);
  vec3 eyeToSurfaceDir = normalize(fragPosition - eyePos);

  vec3 reflectedDir = reflect(eyeToSurfaceDir, worldNormal);

  vec4 cubeMapReflectColor = texture(cubeMap, reflectedDir);
  vec4 textureColor = texture(uTexture, fragTexCoords);

  fragColor = textureColor * 0.9 + vec4(cubeMapReflectColor.rgb * 0.5, 1.0);
}`;


// Push Pop Matrix

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

function initShaders(vertexShaderCode, fragShaderCode) {
  shaderProgram = gl.createProgram();

  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compiiion and linking status
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

function initCubeMap()
{
  const faceImages = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: cubeMapPath.concat("posx.jpg"),
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: cubeMapPath.concat("negx.jpg"),
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: cubeMapPath.concat("posy.jpg"),
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: cubeMapPath.concat("negy.jpg"),
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: cubeMapPath.concat("posz.jpg"),
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: cubeMapPath.concat("negz.jpg"),
    }
  ];

  cubemapTexture = gl.createTexture();
  gl.bindTexture (gl.TEXTURE_CUBE_MAP, cubemapTexture);
  faceImages.forEach((face) => {

    const { target, url } = face;
    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    //setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // load images
    const image = new Image();
    image.src = url;
    image.addEventListener("load", function () 
    {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
      gl.texImage2D(target, level, internalFormat, format, type, image); 
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(
    gl.TEXTURE_CUBE_MAP, 
    gl.TEXTURE_MIN_FILTER, 
    gl.LINEAR_MIPMAP_LINEAR
  );
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
      var utex = 1 - j / nstacks;
      var vtex = 1 - i / nslices;

      spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
      spNormals.push(xcood, ycoord, zcoord);
      spTexCoords.push(utex, vtex);
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

  // buffer for texture coordinates
  spTexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spTexCoords), gl.STATIC_DRAW);
  spTexBuf.itemSize = 2;
  spTexBuf.numItems = spTexCoords.length / 2;
}

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

  var texCoords = [
    // Front face
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Back face
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Top face
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Bottom face
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Right face
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Left face
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ];
  cubeTexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  cubeTexBuf.itemSize = 2;
  cubeTexBuf.numItems = texCoords.length / 2;

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

function initObject() {
  // XMLHttpRequest objects are used to interact with servers
  // It can be used to retrieve any type of data, not just XML.
  var request = new XMLHttpRequest();
  request.open("GET", input_JSON);
  // MIME: Multipurpose Internet Mail Extensions
  // It lets users exchange different kinds of data files
  request.overrideMimeType("application/json");
  request.onreadystatechange = function () {
    //request.readyState == 4 means operation is done
    if (request.readyState == 4) {
      ProcessObject(JSON.parse(request.responseText));
    }
  };
  request.send();
}

function ProcessObject(objData) {
  objVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexPositions),
    gl.STATIC_DRAW
  );
  objVertexPositionBuffer.itemSize = 3;
  objVertexPositionBuffer.numItems = objData.vertexPositions.length / 3;

  objVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexNormals),
    gl.STATIC_DRAW
  );
  objVertexNormalBuffer.itemSize = 3;
  objVertexNormalBuffer.numItems = objData.vertexNormals.length / 3;

  objTexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objTexPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexTextureCoords),
    gl.STATIC_DRAW
  );
  objTexPositionBuffer.itemSize = 2;
  objTexPositionBuffer.numItems = objData.vertexTextureCoords.length / 2;

  objVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(objData.indices),
    gl.STATIC_DRAW
  );
  objVertexIndexBuffer.itemSize = 1;
  objVertexIndexBuffer.numItems = objData.indices.length;
}

// Sphere
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

  gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
  gl.vertexAttribPointer(
    aTexCoordLocation,
    spTexBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation,
    spNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.uniform4fv(uObjectColorLocation, color);

  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation, false, nMatrix);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);

  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

// Cube
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

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
  gl.vertexAttribPointer(
    aTexCoordLocation,
    cubeTexBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation,
    cubeNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // Draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

  gl.uniform4fv(uObjectColorLocation, color);

  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation, false, nMatrix);

  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}
// Teapot
function drawObject(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.vertexAttribPointer(
    aNormalLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, objTexPositionBuffer);
  gl.vertexAttribPointer(
    aTexCoordLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.uniform4fv(uObjectColorLocation, color);

  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.uniformMatrix4fv(uNMatrixLocation, false, nMatrix);
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);

  gl.drawElements(
    gl.TRIANGLES,
    objVertexIndexBuffer.numItems,
    gl.UNSIGNED_INT,
    0
  );
}

// Texture initialization function
function initTextures(textureFile) {
  var tex = gl.createTexture();
  tex.image = new Image();
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
  tex.image.src = textureFile;
  return tex;
}

function handleTextureLoaded(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // use it to flip Y if needed
  gl.texImage2D(
    gl.TEXTURE_2D, // 2D texture
    0, // mipmap level
    gl.RGB, // internal format
    gl.RGB, // format
    gl.UNSIGNED_BYTE, // type of data
    texture.image // array or <img>
  );

  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );

  drawScene();
}

function reflectShader()
{
  shaderProgram = initShaders(reflectionVertexShaderCode, reflectionFragShaderCode);

  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoords");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uNMatrixLocation = gl.getUniformLocation(shaderProgram, "uNMatrix");

  uEyePos = gl.getUniformLocation(shaderProgram, "eyePos");

  //texture location in shader
  uCubeMapLocation = gl.getUniformLocation(shaderProgram, "cubeMap");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);

  gl.uniform3fv(uEyePos, eyePos);

  // for texture binding
  gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture); // bind the texture object to the texture unit
  gl.uniform1i(cubemapTextureLocation, 0); // pass the texture unit to the shader
}

function refractShader()
{
  shaderProgram = initShaders(refractVertexShaderCode, refractFragShaderCode);

  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoords");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uNMatrixLocation = gl.getUniformLocation(shaderProgram, "uNMatrix");

  uEyePos = gl.getUniformLocation(shaderProgram, "eyePos");

  //texture location in shader
  uCubeMapLocation = gl.getUniformLocation(shaderProgram, "cubeMap");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);

  gl.uniform3fv(uEyePos, eyePos);

  // for texture binding
  gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture); // bind the texture object to the texture unit
  gl.uniform1i(cubemapTextureLocation, 0); // pass the texture unit to the shader
}

function textureShader()
{
  initShaders(textureVertexShaderCode, textureFragShaderCode);

  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoords");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uNMatrixLocation = gl.getUniformLocation(shaderProgram, "uNMatrix");

  uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");

  gl.enableVertexAttribArray(aPositionLocation);
  //gl.enableVertexAttribArray(aNormalLocation);
  gl.enableVertexAttribArray(aTexCoordLocation);

  gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, sampleTexture); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 0); // pass the texture unit to the shader
}

function phongShader()
{
  initShaders(phongVertexShaderCode, phongFragShaderCode);

  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uNMatrixLocation = gl.getUniformLocation(shaderProgram, "uNMatrix");

  uLightDirLocation = gl.getUniformLocation(shaderProgram, "lightDir");
  uLightIntensityLocation = gl.getUniformLocation(shaderProgram, "lightIntensity");
  uObjectColorLocation = gl.getUniformLocation(shaderProgram, "objectColor");
  uEyePos = gl.getUniformLocation(shaderProgram, "eyePos");
  uShininessLocation = gl.getUniformLocation(shaderProgram, "shininess");
  uSpecularLightLocation = gl.getUniformLocation(shaderProgram, "specularLight");

  uCubeMapLocation = gl.getUniformLocation(shaderProgram, "cubeMap");

  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);

  gl.uniform3fv(uLightDirLocation, lightDir);
  gl.uniform1f(uLightIntensityLocation, lightIntensity);
  gl.uniform4fv(uSpecularLightLocation, specularLight);
  gl.uniform1f(uShininessLocation, shininess);

  gl.uniform3fv(uEyePos, eyePos);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
  gl.uniform1i(uCubeMapLocation, 0);
}
// Skybox drawing function
function drawSkybox()
{

  textureShader();

  //Back side of the cube
  gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
  gl.bindTexture(gl.TEXTURE_2D, negz); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0, 0, -163]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [120, 120, 207]);

  color = [0.0, 1.0, 1.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);

  // Front side of the cube
  gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
  gl.bindTexture(gl.TEXTURE_2D, posz); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0, 0, 163]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [120, 120, 207]);

  color = [0.0, 1.0, 1.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);

  // Left side of the cube

  gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
  gl.bindTexture(gl.TEXTURE_2D, negx); // bind the texture object to the texture unit
  gl.uniform1i(uRegLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [-163, 0, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(90), [0, 1, 0]);
  mMatrix = mat4.scale(mMatrix, [207, 120, 120]);

  color = [0.0, 1.0, 1.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);

  // Right side of the cube

  gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
  gl.bindTexture(gl.TEXTURE_2D, posx); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [163, 0, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(270), [0, 1, 0]);
  mMatrix = mat4.scale(mMatrix, [207, 120, 120]);

  color = [0.0, 1.0, 1.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);

  // Top side of the cube

  gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
  gl.bindTexture(gl.TEXTURE_2D, posy); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0, 120, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [1, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [207, 120, 207]);

  color = [0.0, 1.0, 1.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);

  // Bottom side of the cube

  gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
  gl.bindTexture(gl.TEXTURE_2D, negy); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 1); // pass the texture unit to the shader

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0, -120, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [1, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [207, 120, 207]);

  color = [0.0, 1.0, 1.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);
}

function reflectionTexShader()
{
  shaderProgram = initShaders(reflectTexVertexShaderCode, reflectTexFragShaderCode);

  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoords");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uNMatrixLocation = gl.getUniformLocation(shaderProgram, "uNMatrix");

  uEyePos = gl.getUniformLocation(shaderProgram, "eyePos");
  uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");

  //texture location in shader
  uCubeMapLocation = gl.getUniformLocation(shaderProgram, "cubeMap");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);
  gl.enableVertexAttribArray(aTexCoordLocation);

  gl.uniform3fv(uEyePos, eyePos);
  
  // for texture binding
  gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture); // bind the texture object to the texture unit
  gl.uniform1i(cubemapTextureLocation, 0); // pass the texture unit to the shader

  gl.activeTexture(gl.TEXTURE1); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, sampleTexture); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 1); 
}

function drawTable()
{
  //Table top
  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [0.0, 0.0, 0.5]);
  mMatrix = mat4.scale(mMatrix, [5.0, 0.3, 3.0]);

  color = [0.0, 1.0, 0.0, 1.0];

  reflectionTexShader();

  drawSphere(color);

  mMatrix = popMatrix(matrixStack);

  //Table legs
  textureShader();

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [-2.0, -1.5, 1.5]);
  mMatrix = mat4.scale(mMatrix, [0.3, 3.0, 0.3]);

  color = [0.0, 1.0, 0.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [-2.0, -1.5, -0.5]);
  mMatrix = mat4.scale(mMatrix, [0.3, 3.0, 0.3]);

  color = [0.0, 1.0, 0.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [2.0, -1.5, 1.5]);
  mMatrix = mat4.scale(mMatrix, [0.3, 3.0, 0.3]);

  color = [0.0, 1.0, 0.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);

  mMatrix = mat4.translate(mMatrix, [2.0, -1.5, -0.5]);
  mMatrix = mat4.scale(mMatrix, [0.3, 3.0, 0.3]);

  color = [0.0, 1.0, 0.0, 1.0];

  drawCube(color);

  mMatrix = popMatrix(matrixStack);
}

//////////////////////////////////////////////////////////////////////
//The main drawing routine
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearColor(0.8, 0.8, 0.8, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  //set up the model matrix
  mat4.identity(mMatrix);
  mat4.identity(nMatrix);

  // set up the view matrix, multiply into the modelview matrix
  mat4.identity(vMatrix);

  if(animation)
    window.cancelAnimationFrame(animation);

  var animate = function()
  {
    degree -= 0.35;
    eyePos = [5.0 * Math.sin(degToRad(degree)), 2.0, 5.0 * Math.cos(degToRad(degree))];

    vMatrix = mat4.lookAt(eyePos, [xCam, yCam, zCam], [0, 1, 0], vMatrix);

    //set up projection matrix
    mat4.identity(pMatrix);
    mat4.perspective(60, 1.0, 0.01, 1000, pMatrix);

    drawSkybox();

    // Table
    pushMatrix(matrixStack, mMatrix);
    color = [0.0, 1.0, 0.0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.0, 0.0, 0.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(0), [1, 0, 0]);
    mMatrix = mat4.scale(mMatrix, [1.1, 1.1, 1.1]);
    nMatrix = mat4.transpose(mat4.inverse(mMatrix));
    sampleTexture = woodTexture;
    textureShader();
    drawTable(color);
    mMatrix = mat4.translate(mMatrix, [0.0, -0.2, 0.0]);
    mMatrix = popMatrix(matrixStack);

    // Teapot
    pushMatrix(matrixStack, mMatrix);
    color = [0.8, 0.2, 0.8, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.0, 1.1, 0.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(0), [1, 0, 0]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.1, 0.1]);
    pushMatrix(matrixStack, mMatrix);
    nMatrix = mat4.transpose(mat4.inverse(mMatrix));
    mMatrix = popMatrix(matrixStack);
    reflectShader();
    drawObject(color);
    mMatrix = popMatrix(matrixStack);

    // Mirror Sphere(Green)
    pushMatrix(matrixStack, mMatrix);
    color = [0.1, 0.9, 0.3, 1.0];
    mMatrix = mat4.translate(mMatrix, [-1.0, 0.45, 1.8]);
    mMatrix = mat4.rotate(mMatrix, degToRad(0), [1, 0, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
    pushMatrix(matrixStack, mMatrix);
    nMatrix = mat4.transpose(mat4.inverse(mMatrix));
    mMatrix = popMatrix(matrixStack);
    phongShader();
    drawSphere(color);
    mMatrix = popMatrix(matrixStack);

    // Metal Sphere(Purple)
    pushMatrix(matrixStack, mMatrix);
    color = [0.8, 0.2, 0.8, 1.0];
    mMatrix = mat4.translate(mMatrix, [-0.1, 0.37, 2.3]);
    mMatrix = mat4.rotate(mMatrix, degToRad(0), [1, 0, 0]);
    mMatrix = mat4.scale(mMatrix, [0.20, 0.20, 0.20]);
    pushMatrix(matrixStack, mMatrix);
    nMatrix = mat4.transpose(mat4.inverse(mMatrix));
    mMatrix = popMatrix(matrixStack);
    phongShader();
    drawSphere(color);
    mMatrix = popMatrix(matrixStack);

    // Glass Cube
    pushMatrix(matrixStack, mMatrix);
    color = [0.0, 1.0, 0.0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.9, 0.7, 1.9]);
    mMatrix = mat4.rotate(mMatrix, degToRad(60), [0, -1, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.75, 0.5]);
    pushMatrix(matrixStack, mMatrix);
    nMatrix = mat4.transpose(mat4.inverse(mMatrix));
    mMatrix = popMatrix(matrixStack);
    refractShader();
    drawCube(color);
    mMatrix = popMatrix(matrixStack);

    // Rubix Cube
    pushMatrix(matrixStack, mMatrix);
    color = [0.0, 1.0, 0.0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.3, 0.45, 1.5]);
    mMatrix = mat4.rotate(mMatrix, degToRad(60), [0, 1, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
    pushMatrix(matrixStack, mMatrix);
    nMatrix = mat4.transpose(mat4.inverse(mMatrix));
    mMatrix = popMatrix(matrixStack);
    sampleTexture = rCubeTexture;
    textureShader();
    drawCube(color);
    mMatrix = popMatrix(matrixStack);

    animation = window.requestAnimationFrame(animate);
    };

  animate();
}

// This is the entry point from the html
function webGLStart() {
  canvas = document.getElementById("Assignment_3");

  initGL(canvas);

  //initialize buffers for the square
  initSphereBuffer();
  initCubeBuffer();
  initObject();

  rCubeTexture = initTextures(rCubeTextureFile);
  woodTexture = initTextures(woodTextureFile);

  posx = initTextures(posx_file);
  posy = initTextures(posy_file);
  posz = initTextures(posz_file);
  negx = initTextures(negx_file);
  negy = initTextures(negy_file);
  negz = initTextures(negz_file);

  initCubeMap();
  drawScene();
}
