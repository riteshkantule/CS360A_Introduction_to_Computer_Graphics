// Assignment 1
// Kantule Ritesh Ramdas
// 210488


var gl;
var canvas;
var aPositionLocation;
var uMMatrixLocation;
var uColorLocation;
var sqVertexPositionBuffer;
var sqVertexIndexBuffer;
var prevMouseX = 0;
var prevMouseY = 0;
var zAngle = 0.0;
var degree0 = 0.0;
var degree1 = 0.0;
var degree2 = 0.0;
var model = mat4.create();
var matrixStack = [];


let drawMode;
let uPointSizeLocation;
let pointSize = 10.0;

// boat Animation
// Define animation properties
let boatAnimationStartTime = null;
const boatAnimationDuration = 15000; // Time in milliseconds for one complete back-and-forth motion
const boatMovementAmplitude = 0.65; // Adjust the amplitude as needed



function changeDrawMode(param){
  if(param == 0)
    drawMode = gl.POINTS;
  else if(param == 1)
    drawMode = gl.LINE_LOOP;
  else
    drawMode = gl.TRIANGLE_FAN;
}

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;
uniform float uPointSize;  // Uniform for point size

void main() {
  gl_Position = uMMatrix * vec4(aPosition, 0.0, 1.0);
  gl_PointSize = uPointSize;  // Set the point size
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 uColor;

void main() {
  fragColor = uColor;
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
    drawMode = gl.TRIANGLE_FAN;
    // Get the uniform location for uPointSize
    uPointSizeLocation = gl.getUniformLocation(shaderProgram, "uPointSize");

    
  } catch (e) {}
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}
// SQUARE  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function initSquareBuffer() {
  // buffer for point locations
  const sqVertices = new Float32Array([
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;

  // buffer for point indices
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(mMatrix, color) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(uColorLocation, color);

  // now draw the square
  gl.drawElements(
    drawMode,
    sqVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

// TRIANGLE  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function initTriangleBuffer() {
  // buffer for point locations
  const triVertices = new Float32Array([
    0.0, 0.5, -0.5, -0.5, 0.5, -0.5
  ]);
  triVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triVertices, gl.STATIC_DRAW);
  triVertexPositionBuffer.itemSize = 2;
  triVertexPositionBuffer.numItems = 3;

  // buffer for point indices
  const triIndices = new Uint16Array([0, 1, 2]);
  triVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triIndices, gl.STATIC_DRAW);
  triVertexIndexBuffer.itemsize = 1;
  triVertexIndexBuffer.numItems = 3;
}

function drawTriangle(mMatrix, color) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, triVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    triVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triVertexIndexBuffer);

  gl.uniform4fv(uColorLocation, color);

  // now draw the triangle
  gl.drawElements(
    drawMode,
    triVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

// Circle !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function initCircleBuffer(radius, numSegments) {
  const circleVertices = [];
  circleVertices.push(0, 0); // Center vertex for circle

  for (let i = 0; i < numSegments + 1; i++) {
    const angle = (i / numSegments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    circleVertices.push(x, y);
  }

  const circleVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
  circleVertexPositionBuffer.itemSize = 2;
  circleVertexPositionBuffer.numItems = numSegments + 2; // +2 for center and numSegments+1 vertices

  const circleIndices = [];
  for (let i = 0; i < numSegments; i++) {
    circleIndices.push(0, i + 1, i + 2); // Using i + 1 and i + 2 due to the center vertex
  }

  const circleIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
  circleIndexBuffer.itemSize = 1;
  circleIndexBuffer.numItems = numSegments * 3; // numSegments triangles

  return {
    vertexBuffer: circleVertexPositionBuffer,
    indexBuffer: circleIndexBuffer,
  };
}

function drawCircle(mMatrix, radius, numSegments, color) {
  const buffers = initCircleBuffer(radius, numSegments);

  gl.useProgram(shaderProgram);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
  gl.vertexAttribPointer(aPositionLocation, buffers.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

  gl.uniform4fv(uColorLocation, color);

  // Draw the circle using triangle fan mode
  gl.drawElements(drawMode, buffers.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

// Animation Functions
function rotateObjectAroundCenter(model, rotationAngle, centerX, centerY) {
  pushMatrix(matrixStack, model);
  
  // Step 1: Translate the object's center to the origin
  model = mat4.translate(model, [centerX, centerY, 0.0]);

  // Step 2: Apply rotation around the origin
  model = mat4.rotate(model, rotationAngle, [0.0, 0.0, 1.0]);

  // Step 3: Translate the object back to its original position
  model = mat4.translate(model, [-centerX, -centerY, 0.0]);

  popMatrix(matrixStack);
  
  return model;
}

function moveBoatBackAndForth(model, amplitude, speed, currentTime) {
  // Calculate the horizontal offset based on time
  const xOffset = amplitude * Math.sin(speed * currentTime);

  // Apply the offset along the x-axis
  model = mat4.translate(model, [xOffset, 0.0, 0.0]);

  return model;
}
// Objects
function drawBird2(){
  // Birds 2

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.205, 0.69, 0]);
  model = mat4.scale(model, [0.02*0.8, 0.02*0.8, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.02+0.2, 0.7, 1.0]);
  model = mat4.scale(model, [0.09*0.8, 0.01*0.8, 1.0]);
  model = mat4.rotate(model, degToRad(210), [0, 0, 1]); 
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.2 + 0.050, 0.7, 1.0]);
  model = mat4.scale(model, [0.09*0.8, 0.01*0.8, 1.0]);
  model = mat4.rotate(model, degToRad(270), [0, 0, 1]); 
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

}

function drawBird3(){
  // Birds 3

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.223, 0.69+0.1, 0]);
  model = mat4.scale(model, [0.02*0.7, 0.02*0.7, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-(0.2 + 0.05), 0.7+0.1, 1.0]);
  model = mat4.scale(model, [0.09*0.7, 0.01*0.8, 1.0]);
  model = mat4.rotate(model, degToRad(210), [0, 0, 1]); 
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-(-0.02+0.2), 0.7+0.1, 1.0]);
  model = mat4.scale(model, [0.09*0.7, 0.01*0.7, 1.0]);
  model = mat4.rotate(model, degToRad(270), [0, 0, 1]); 
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

}

function drawBird(){
  // Birds
  // scaling
  // model = mat4.scale(model, scale);
  // // translation
  // model = mat4.translate(model, position);

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.0, 0.5, 0]);
  model = mat4.scale(model, [0.02, 0.02, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.03, 0.52, 1.0]);
  model = mat4.scale(model, [0.09, 0.01, 1.0]);
  model = mat4.rotate(model, degToRad(210), [0, 0, 1]); 
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [+0.055, 0.52, 1.0]);
  model = mat4.scale(model, [0.09, 0.01, 1.0]);
  model = mat4.rotate(model, degToRad(270), [0, 0, 1]); 
  drawTriangle(model, color);
  model = popMatrix(matrixStack);
}

function drawMountains(){
  // part 1
  color = [0.44, 0.25, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.60, -0.01, 0.0]);
  model = mat4.scale(model, [2.0, 0.6, 0.25]);
  model = mat4.rotate(model, degToRad(5), [0, 1, 0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // part 2
  color = [0.44, 0.25, 0.0, 0.7];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.42, 0.00, 0.0]);  // Translate to top vertex
  model = mat4.scale(model, [2.0, 0.6, 0.25]);
  model = mat4.rotate(model, degToRad(10), [0, 0, 1]);  // Apply rotation
  // model = mat4.translate(model, [0.0, -0.5, 0.0]);  // Translate back
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // Mountain 3
  // part 1
  color = [0.44, 0.25, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.60, -0.05, 0.0]);
  model = mat4.scale(model, [2.0, 0.6, 0.25]);
  model = mat4.rotate(model, degToRad(5), [0, 1, 0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // part 2
  color = [0.44, 0.25, 0.0, 0.7];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.725, -0.05, 0.0]);  // Translate to top vertex
  model = mat4.scale(model, [2.0, 0.6, 0.25]);
  model = mat4.rotate(model, degToRad(7), [0, 0, 1]);  // Apply rotation
  // model = mat4.translate(model, [0.0, -0.5, 0.0]);  // Translate back
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // Mountain 2
  // part 1
  color = [0.44, 0.25, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.0, 0.05, 0.0]);
  model = mat4.scale(model, [2.2, 0.6, 0.25]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);
  
  // part 2
  color = [0.44, 0.25, 0.0, 0.7];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.14, 0.055, 0.0]);  // Translate to top vertex
  model = mat4.scale(model, [2.2, 0.6, 0.25]);
  model = mat4.rotate(model, degToRad(7), [0, 0, 1]);  // Apply rotation
  // model = mat4.translate(model, [0.0, -0.5, 0.0]);  // Translate back
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // Clouds

  color = [1.0, 1.0, 1.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.85, 0.55, 0.0]);
  model = mat4.scale(model, [0.17, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 1.5, 20, color);
  model = popMatrix(matrixStack);

  color = [1.0, 1.0, 1.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.57, 0.52, 0.0]);
  model = mat4.scale(model, [0.17, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 1.0, 20, color);
  model = popMatrix(matrixStack);

  color = [1.0, 1.0, 1.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.4, 0.54, 0.0]);
  model = mat4.scale(model, [0.17, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.7, 20, color);
  model = popMatrix(matrixStack);
}

function drawGargen(){
  // Bush 1

  color = [0.0, 0.55, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.15, -0.56, 0.0]);
  model = mat4.scale(model, [0.15, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.4, 20, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.55, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.15, -0.56, 0.0]);
  model = mat4.scale(model, [0.15, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.4, 20, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.75, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.0, -0.55, 0.0]);
  model = mat4.scale(model, [0.15, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.85, 20, color);
  model = popMatrix(matrixStack);

  // Bush 2

  color = [0.0, 0.65, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.93, -0.56, 0.0]);
  model = mat4.scale(model, [0.15, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.45, 20, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.75, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.80, -0.55, 0.0]);
  model = mat4.scale(model, [0.15, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.75, 20, color);
  model = popMatrix(matrixStack);

  // bush 3

  color = [0.0, 0.65, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [+0.15, -1.05, 0.0]);
  model = mat4.scale(model, [0.15*3, 0.10*3, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.45, 20, color);
  model = popMatrix(matrixStack);

  // bush 4

  color = [0.0, 0.65, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.85, -0.4, 0.0]);
  model = mat4.scale(model, [0.15, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.45, 20, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.75, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.98, -0.37, 0.0]);
  model = mat4.scale(model, [0.15, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.75, 20, color);
  model = popMatrix(matrixStack);

}

function drawHome(){
  // scaling
  const scaleFactor2 = 0.9; // Adjust the scaling factor as needed
  model = mat4.scale(model, [scaleFactor2, scaleFactor2, scaleFactor2]);
  
  // translation
  const translationX2 = 0.0; // Adjust the translation values as needed
  const translationY2 = -0.15;
  model = mat4.translate(model, [translationX2, translationY2, 0]);

  // walls
  color = [0.84, 0.90, 0.28, 0.5];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.5, -0.4, 0]);
  model = mat4.scale(model, [0.63, 0.3, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // roof sq
  color = [1.0, 0.0, 0.0, 0.9];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.5, -0.15, 0]);
  model = mat4.scale(model, [0.55, 0.20, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // triangel 1
  color = [1.0, 0.0, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.22, -0.15, 0.0]);
  model = mat4.scale(model, [0.35, 0.20, 0.25]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // triangel 2
  color = [1.0, 0.0, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.78, -0.15, 0.0]);
  model = mat4.scale(model, [0.35, 0.20, 0.25]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // window 1 
  color = [0.90, 0.80, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.7, -0.35, 0]);
  model = mat4.scale(model, [0.1, 0.1, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // window 2
  color = [0.90, 0.80, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.32, -0.35, 0]);
  model = mat4.scale(model, [0.1, 0.1, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // door 
  color = [0.90, 0.80, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.51, -0.425, 0]);
  model = mat4.scale(model, [0.13, 0.25, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

}

function drawCar(){
  // scaling
  const scaleFactor = 1.0; // Adjust the scaling factor as needed
  model = mat4.scale(model, [scaleFactor, scaleFactor, scaleFactor]);
  // translation
  const translationX = -0.25; // Adjust the translation values as needed
  const translationY = -0.2;
  model = mat4.translate(model, [translationX, translationY, 0]);

  // TOP

  color = [1.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.0, -0.5, 0]);
  model = mat4.scale(model, [0.25, 0.20, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // triangle 1

  color = [1.0, 0.0, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.125, -0.5, 0.0]);
  model = mat4.scale(model, [0.25, 0.20, 0.25]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // triangle 2

  color = [1.0, 0.0, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.125, -0.5, 0.0]);
  model = mat4.scale(model, [0.25, 0.20, 0.25]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // Tire_1

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.17, -0.61, 0.0]);
  // model = mat4.scale(model, [0.20, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.06, 20, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.0, 0.0, 0.5];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.17, -0.61, 0.0]);
  // model = mat4.scale(model, [0.20, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.045, 20, color);
  model = popMatrix(matrixStack);

  // Tire_2

  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.17, -0.61, 0.0]);
  // model = mat4.scale(model, [0.20, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.06, 20, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.0, 0.0, 0.5];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.17, -0.61, 0.0]);
  // model = mat4.scale(model, [0.20, 0.10, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.045, 20, color);
  model = popMatrix(matrixStack);


  // BOTTOM
  // scaling
  const scaleFactor1 = 1.0; // Adjust the scaling factor as needed
  model = mat4.scale(model, [scaleFactor1, scaleFactor1, scaleFactor1]);
  // translation
  const translationX1 = 0.0; // Adjust the translation values as needed
  const translationY1 = -0.30;
  model = mat4.translate(model, [translationX1, translationY1, 0]);

  color = [0.0, 0.0, 1.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.0, -0.25, 0]);
  model = mat4.scale(model, [0.50, 0.10, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // triangle 1

  color = [0.0, 0.0, 1.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.25, -0.25, 0.0]);
  model = mat4.scale(model, [0.20, 0.10, 0.25]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // triangle 2

  color = [0.0, 0.0, 1.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.25, -0.25, 0.0]);
  model = mat4.scale(model, [0.20, 0.10, 0.25]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);


}

function drawTree(){

  // Tree 3
  // block
  color = [0.3, 0.18, 0.11, 0.9];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.8, 0.1, 0.0]);
  model = mat4.scale(model, [0.03, 0.23, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);
  // Leaves
  color = [0.0, 0.7, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.8, 0.23, 0.0]);
  model = mat4.scale(model, [0.22, 0.20, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.8, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.8, 0.28, 0.0]);
  model = mat4.scale(model, [0.25, 0.23, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.9, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.8, 0.33, 0.0]);
  model = mat4.scale(model, [0.30, 0.25, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // Tree 1
  // block
  color = [0.3, 0.18, 0.11, 0.9];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.55, 0.1, 0.0]);
  model = mat4.scale(model, [0.05, 0.23, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);
  // Leaves
  color = [0.0, 0.7, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.55, 0.38, 0.0]);
  model = mat4.scale(model, [0.4, 0.35, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.8, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.55, 0.43, 0.0]);
  model = mat4.scale(model, [0.43, 0.35, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.9, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.55, 0.48, 0.0]);
  model = mat4.scale(model, [0.45, 0.35, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // Tree 2
  // block
  color = [0.3, 0.18, 0.11, 0.9];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.3, 0.1, 0.0]);
  model = mat4.scale(model, [0.03, 0.23, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);
  // Leaves
  color = [0.0, 0.7, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.3, 0.20, 0.0]);
  model = mat4.scale(model, [0.22, 0.20, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.8, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.3, 0.25, 0.0]);
  model = mat4.scale(model, [0.25, 0.23, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [0.0, 0.9, 0.0, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.3, 0.3, 0.0]);
  model = mat4.scale(model, [0.30, 0.25, 1.0]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);


}

function drawRoad(){
  color = [0.3, 0.65, 0.03, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.65, -0.7, 0.0]);  // Translate to top vertex
  model = mat4.scale(model, [2.0, 1.5, 0.0]);
  model = mat4.rotate(model, degToRad(33), [0, 0, 1]);  // Apply rotation
  // model = mat4.translate(model, [0.0, -0.5, 0.0]);  // Translate back
  drawTriangle(model, color);
  model = popMatrix(matrixStack);
}

function drawRiver(){
  color = [0.0, 0.0, 0.95, 0.8];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.0, -0.15, 0]);
  model = mat4.scale(model, [2.0, 0.25, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);  
  
  color = [1.0, 1.0, 1.0, 0.5];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.30, -0.1, 0]);
  model = mat4.scale(model, [0.40, 0.002, 0.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  color = [1.0, 1.0, 1.0, 0.5];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.40, -0.2, 0]);
  model = mat4.scale(model, [0.40, 0.002, 0.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);
}

function drawGreenLand(){
  color = [0.0, 1.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.0, -0.5, 0]);
  model = mat4.scale(model, [2.0, 1.0, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);
}

function drawBoat(){

  if (boatAnimationStartTime === null) {
    boatAnimationStartTime = performance.now();
  }

  // Calculate time elapsed since animation started
  const currentTime = performance.now();
  const elapsedTime = currentTime - boatAnimationStartTime;

  // Calculate the horizontal offset based on time
  const xOffset = boatMovementAmplitude * Math.sin((elapsedTime / boatAnimationDuration) * Math.PI * 2);
  
  // scaling
  const scaleFactor2 = 1.0; // Adjust the scaling factor as needed
  model = mat4.scale(model, [scaleFactor2, scaleFactor2, scaleFactor2]);
  
  // translation
  const translationX2 = 0.0; // Adjust the translation values as needed
  const translationY2 = -0.2;
  model = mat4.translate(model, [translationX2, translationY2, 0]);

  model = mat4.translate(model, [xOffset, 0.0, 0.0]);

  // Red triangle
  color = [1.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.22-0.2, 0.22, 0.0]);
  model = mat4.scale(model, [0.2, 0.25, 1.0]);
  model = mat4.rotate(model, degToRad(270), [0, 0, 1]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // Rod
  color = [0.0, 0.0, 0.0, 0.75];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.13-0.2, 0.21, 0.0]);
  model = mat4.scale(model, [0.02, 0.27, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // Rope
  color = [0.0, 0.0, 0.0, 0.75];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.06-0.2, 0.21, 0.0]);
  model = mat4.rotate(model, degToRad(-28), [0, 0, 1]);
  model = mat4.scale(model, [0.01, 0.31, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);  

  // Base
  color = [1.0, 1.0, 0.8, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.125-0.2, 0.05, 0.0]);
  model = mat4.scale(model, [0.25, 0.05, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  color = [1.0, 1.0, 0.8, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.0-0.2, 0.05, 0.0]);
  model = mat4.scale(model, [0.05, 0.05, 1.0]);
  model = mat4.rotate(model, degToRad(180), [0, 0, 1]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  color = [1.0, 1.0, 0.8, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.25-0.2, 0.05, 0.0]);
  model = mat4.scale(model, [0.05, 0.05, 1.0]);
  model = mat4.rotate(model, degToRad(180), [0, 0, 1]);
  drawTriangle(model, color);
  model = popMatrix(matrixStack);

  // scaling
  const scaleFactor3 = 1.0; // Adjust the scaling factor as needed
  model = mat4.scale(model, [scaleFactor3, scaleFactor3, scaleFactor3]);
  
  // translation
  const translationX3 = 0.0; // Adjust the translation values as needed
  const translationY3 = +0.2;
  model = mat4.translate(model, [translationX3, translationY3, 0]);

  model = mat4.translate(model, [-xOffset, 0.0, 0.0]);
}

function drawSun(sunRotation){
  color = [1.0, 1.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.6, 0.8, 0.0]);
  model = mat4.scale(model, [0.1, 0.1, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.9, 20, color);
  model = popMatrix(matrixStack);
  
  // Draw the rays
  color_fan = [1.0, 1.0, 0.0, 1.0];
  model = mat4.translate(model, [-0.65, 0.8, 0.0]);
  for(let i = 0; i < 360; i += 45)
  {
    pushMatrix(matrixStack, model);
    const angle = (i / 45) * Math.PI * 2;
    model = rotateObjectAroundCenter(model, angle + sunRotation, 0.05, 0.0);
    model = mat4.translate(model, [0.05 * Math.cos(angle), 0.05 * Math.sin(angle), 0.0]);
    model = mat4.rotate(model, degToRad(i + 90), [0.0, 0.0, 1.0]);
    model = mat4.scale(model, [0.01, 0.3, 1.0]);
    drawTriangle(model, color_fan);
    model = popMatrix(matrixStack);
  }
  model = mat4.translate(model, [+0.65, -0.8, 0.0]);
}

function drawWindmill(windmillRotation)
{
  // windmill 1
  // Draw the base
  color = [0.0, 0.0, 0.0, 0.8];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.7, -0.15, 0.0]);
  model = mat4.scale(model, [0.03, 0.4, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // Draw the fans
  color_fan = [0.4, 0.4, 0.0, 1.0];
  model = mat4.translate(model, [0.65, 0.05, 0.0]);
  for(let i = 0; i < 360; i += 90)
  {
    pushMatrix(matrixStack, model);
    const angle =((i / 90) * Math.PI * 2);
    model = rotateObjectAroundCenter(model, angle + windmillRotation, 0.05, 0.0);
    model = mat4.translate(model, [0.05 * Math.cos(angle), 0.05 * Math.sin(angle), 0.0]);
    model = mat4.rotate(model, degToRad(i + 90), [0.0, 0.0, 1.0]);
    model = mat4.scale(model, [0.05, 0.35, 1.0]);
    drawTriangle(model, color_fan);
    model = popMatrix(matrixStack);
  }
  model = mat4.translate(model, [-0.65, -0.05, 0.0]);

  //Draw the wheel
  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.70, 0.05, 0.0]);
  model = mat4.scale(model, [0.03, 0.03, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.9, 20, color);
  model = popMatrix(matrixStack);

  // windmill  2

  // Draw the base
  color = [0.0, 0.0, 0.0, 0.8];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.4, -0.15, 0.0]);
  model = mat4.scale(model, [0.03, 0.4, 1.0]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // Draw the fans
  color_fan = [0.4, 0.4, 0.0, 1.0];
  model = mat4.translate(model, [-0.45, 0.05, 0.0]);
  for(let i = 0; i < 360; i += 90)
  {
    pushMatrix(matrixStack, model);
    const angle = ((i / 90) * Math.PI * 2);
    model = rotateObjectAroundCenter(model, angle + windmillRotation, 0.05, 0.0);
    model = mat4.translate(model, [0.05 * Math.cos(angle), 0.05 * Math.sin(angle), 0.0]);
    model = mat4.rotate(model, degToRad(i + 90), [0.0, 0.0, 1.0]);
    model = mat4.scale(model, [0.05, 0.35, 1.0]);
    drawTriangle(model, color_fan);
    model = popMatrix(matrixStack);
  }
  model = mat4.translate(model, [0.45, -0.05, 0.0]);

  //Draw the wheel
  color = [0.0, 0.0, 0.0, 1.0];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [-0.40, 0.05, 0.0]);
  model = mat4.scale(model, [0.03, 0.03, 0.25]);
  // drawCircle(model, 0.05, 20, color);
  drawCircle(model, 0.9, 20, color);
  model = popMatrix(matrixStack);

}

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearColor(1.0, 1.0, 1.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // set the model matrix to identity first
  mat4.identity(model);

  // global rotation along z-axis, controlled by mouse
  model = mat4.rotate(model, degToRad(zAngle), [0, 0, 1]);
  // global rotation along z-axis, controlled by key press
  model = mat4.rotate(model, degToRad(degree2), [0, 0, 1]);

  // Sky
  color = [0.52, 0.80, 0.92, 1];
  pushMatrix(matrixStack, model);
  model = mat4.translate(model, [0.0, 0.5, 0]);
  model = mat4.scale(model, [2.0, 1.0, 0.25]);
  drawSquare(model, color);
  model = popMatrix(matrixStack);

  // Sun
  const sunRotation = (performance.now() / 6000) * Math.PI * 2;
  drawSun(sunRotation);

  // Mountain 
  drawMountains();

  // Bird
  drawBird();
  drawBird2();
  drawBird3();

  // Green Land
  drawGreenLand();

  // Road
  drawRoad();

  // Tree
  drawTree();

  // River
  drawRiver();

  // Boat
  drawBoat();

  // Windmill
  const windmillRotation = (performance.now() / 2000) * Math.PI * 2;
  drawWindmill(windmillRotation);

  // Garden
  drawGargen();

  // Home 
  drawHome();
  
  // Car
  drawCar();

  // Animation
  requestAnimationFrame(drawScene);
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
    var diffX = mouseX - prevMouseX;
    zAngle = zAngle + diffX / 5;
    prevMouseX = mouseX;

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

function onKeyPress(event) {
  var keyCode = event.keyCode;

  switch (keyCode) {
    case 82: //'r'
      if (event.shiftKey) {
        degree1 -= 10;
      } else {
        degree1 += 10;
      }
      break;
    case 69: //'e'
      if (event.shiftKey) {
        degree0 -= 10;
      } else {
        degree0 += 10;
      }
      break;
    case 84: //'t'
      if (event.shiftKey) {
        degree2 -= 10;
      } else {
        degree2 += 10;
      }
      break;
  }
  drawScene();
}

// This is the entry point from the html
function webGLStart() {
  canvas = document.getElementById("Assignment_1");
  document.addEventListener("mousedown", onMouseDown, false);
  document.addEventListener("keydown", onKeyPress, false);

  initGL(canvas);
  shaderProgram = initShaders();

  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);

  //initialize buffers for the square
  initSquareBuffer();
  initTriangleBuffer();
  initCircleBuffer();

  //now draw the scene
  drawScene();
}
