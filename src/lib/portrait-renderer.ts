import { createPortraitMesh, portraitNeck, portraitLimits } from "./portrait-model";

const vertexSource = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
uniform vec2 u_turn;
varying vec2 v_uv;
varying float v_light;
void main() {
  float head = 1.0 - smoothstep(${portraitNeck.start}, ${portraitNeck.end}, a_uv.y);
  float yaw = u_turn.x;
  float pitch = u_turn.y;
  mat3 ry = mat3(cos(yaw), 0., -sin(yaw), 0., 1., 0., sin(yaw), 0., cos(yaw));
  mat3 rx = mat3(1., 0., 0., 0., cos(pitch), sin(pitch), 0., -sin(pitch), cos(pitch));
  vec3 pivot = vec3(0., ${portraitNeck.pivotY}, ${portraitNeck.pivotZ});
  vec3 rotated = ry * rx * (a_position - pivot) + pivot;
  vec3 position = mix(a_position, rotated, head);
  vec3 normal = normalize(mix(a_normal, ry * rx * a_normal, head));
  // Orthographic projection preserves the original facial proportions at rest.
  gl_Position = vec4(position.x, position.y / 1.25, -position.z * 0.2, 1.);
  vec3 light = normalize(vec3(-0.4, 0.45, 1.));
  v_light = 1.0 + 0.035 * (dot(normal, light) - dot(a_normal, light));
  v_uv = a_uv;
}`;

const fragmentSource = `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_uv;
varying float v_light;
void main() {
  vec4 color = texture2D(u_image, v_uv);
  if (color.a < 0.015) discard;
  gl_FragColor = vec4(color.rgb * v_light, color.a);
}`;

export type PortraitPose = { x: number; y: number };

/** Small, dependency-free WebGL renderer. All GPU resources belong to this instance. */
export function createPortraitRenderer(canvas: HTMLCanvasElement, artwork: HTMLImageElement) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "low-power" });
  if (!gl) throw new Error("WebGL unavailable");
  const shaders: WebGLShader[] = [];
  const buffers: WebGLBuffer[] = [];
  let program: WebGLProgram | null = null, texture: WebGLTexture | null = null;
  const dispose = () => {
    buffers.forEach(buffer => gl.deleteBuffer(buffer));
    shaders.forEach(shader => gl.deleteShader(shader));
    if (texture) gl.deleteTexture(texture);
    if (program) gl.deleteProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  };
  try {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Portrait shader unavailable");
      shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Portrait shader could not compile");
      return shader;
    };
    program = gl.createProgram();
    if (!program) throw new Error("Portrait program unavailable");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Portrait program could not link");
    gl.useProgram(program);
    const mesh = createPortraitMesh();
    const vertexBuffer = gl.createBuffer(), indexBuffer = gl.createBuffer();
    if (vertexBuffer) buffers.push(vertexBuffer);
    if (indexBuffer) buffers.push(indexBuffer);
    if (!vertexBuffer || !indexBuffer) throw new Error("Portrait geometry unavailable");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    for (const [name, size, offset] of [["a_position", 3, 0], ["a_normal", 3, 12], ["a_uv", 2, 24]] as const) {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 32, offset);
    }
    texture = gl.createTexture();
    if (!texture) throw new Error("Portrait texture unavailable");
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, artwork);
    gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
    const turn = gl.getUniformLocation(program, "u_turn");
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
    return {
      draw(pose: PortraitPose) {
        if (gl.isContextLost()) throw new Error("Portrait context lost");
        const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        gl.viewport(0, 0, width, height);
        gl.uniform2f(turn, pose.x * portraitLimits.yaw, pose.y * portraitLimits.pitch);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      },
      dispose,
    };
  } catch (error) { dispose(); throw error; }
}
