(() => {
  'use strict';

  const {
    REST_NODES_3D,
    THIEF_BONES_3D,
    buildGummyBearMesh,
    buildThiefManMesh,
    buildTorusMesh,
    buildCylinderMesh,
    buildSphereMesh
  } = window.GummyApp;

  // Minimal fast 4x4 column-major matrix helpers
  function mat4Identity(out = new Float32Array(16)) {
    out.fill(0);
    out[0] = out[5] = out[10] = out[15] = 1;
    return out;
  }

  function mat4Perspective(out, fovyRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovyRad * 0.5);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    return out;
  }

  function mat4LookAt(out, eye, target, up) {
    let zx = eye[0] - target[0];
    let zy = eye[1] - target[1];
    let zz = eye[2] - target[2];
    let len = Math.hypot(zx, zy, zz) || 1;
    zx /= len; zy /= len; zz /= len;

    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;
    len = Math.hypot(xx, xy, xz) || 1;
    xx /= len; xy /= len; xz /= len;

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1;
    return out;
  }

  function mat4Multiply(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    for (let col = 0; col < 4; col++) {
      const b0 = b[col * 4];
      const b1 = b[col * 4 + 1];
      const b2 = b[col * 4 + 2];
      const b3 = b[col * 4 + 3];
      out[col * 4]     = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3;
      out[col * 4 + 1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
      out[col * 4 + 2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3;
      out[col * 4 + 3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
    }
    return out;
  }

  function mat4Invert(out, m) {
    const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
    const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
    const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
    const m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];

    const b00 = m00 * m11 - m01 * m10;
    const b01 = m00 * m12 - m02 * m10;
    const b02 = m00 * m13 - m03 * m10;
    const b03 = m01 * m12 - m02 * m11;
    const b04 = m01 * m13 - m03 * m11;
    const b05 = m02 * m13 - m03 * m12;
    const b06 = m20 * m31 - m21 * m30;
    const b07 = m20 * m32 - m22 * m30;
    const b08 = m20 * m33 - m23 * m30;
    const b09 = m21 * m32 - m22 * m31;
    const b10 = m21 * m33 - m23 * m31;
    const b11 = m22 * m33 - m23 * m32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return mat4Identity(out);
    det = 1.0 / det;

    out[0] = (m11 * b11 - m12 * b10 + m13 * b09) * det;
    out[1] = (m02 * b10 - m01 * b11 - m03 * b09) * det;
    out[2] = (m31 * b05 - m32 * b04 + m33 * b03) * det;
    out[3] = (m22 * b04 - m21 * b05 - m23 * b03) * det;
    out[4] = (m12 * b08 - m10 * b11 - m13 * b07) * det;
    out[5] = (m00 * b11 - m02 * b08 + m03 * b07) * det;
    out[6] = (m32 * b02 - m30 * b05 - m33 * b01) * det;
    out[7] = (m20 * b05 - m22 * b02 + m23 * b01) * det;
    out[8] = (m10 * b10 - m11 * b08 + m13 * b06) * det;
    out[9] = (m01 * b08 - m00 * b10 - m03 * b06) * det;
    out[10] = (m30 * b04 - m31 * b02 + m33 * b00) * det;
    out[11] = (m21 * b02 - m20 * b04 - m23 * b00) * det;
    out[12] = (m11 * b07 - m10 * b09 - m12 * b06) * det;
    out[13] = (m00 * b09 - m01 * b07 + m02 * b06) * det;
    out[14] = (m31 * b01 - m30 * b03 - m32 * b00) * det;
    out[15] = (m20 * b03 - m21 * b01 + m22 * b00) * det;
    return out;
  }

  function mat4FromTRS(out, tx, ty, tz, rx, ry, rz, sx, sy, sz) {
    const cx = Math.cos(rx), sxr = Math.sin(rx);
    const cy = Math.cos(ry), syr = Math.sin(ry);
    const cz = Math.cos(rz), szr = Math.sin(rz);

    out[0] = (cy * cz) * sx;
    out[1] = (cy * szr) * sx;
    out[2] = (-syr) * sx;
    out[3] = 0;

    out[4] = (sxr * syr * cz - cx * szr) * sy;
    out[5] = (sxr * syr * szr + cx * cz) * sy;
    out[6] = (sxr * cy) * sy;
    out[7] = 0;

    out[8] = (cx * syr * cz + sxr * szr) * sz;
    out[9] = (cx * syr * szr - sxr * cz) * sz;
    out[10] = (cx * cy) * sz;
    out[11] = 0;

    out[12] = tx;
    out[13] = ty;
    out[14] = tz;
    out[15] = 1;
    return out;
  }

  // Align cylinder (+Y axis) from point A to point B with radius r
  function mat4AlignBeam(out, ax, ay, az, bx, by, bz, radius) {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.hypot(dx, dy, dz) || 0.001;
    const ux = dx / len;
    const uy = dy / len;
    const uz = dz / len;

    // Orthonormal basis with Y = u
    let refX = Math.abs(uy) > 0.92 ? 1 : 0;
    let refY = 0;
    let refZ = Math.abs(uy) > 0.92 ? 0 : 1;

    let xx = uy * refZ - uz * refY;
    let xy = uz * refX - ux * refZ;
    let xz = ux * refY - uy * refX;
    const xLen = Math.hypot(xx, xy, xz) || 1;
    xx /= xLen; xy /= xLen; xz /= xLen;

    const zx = xx * uy - xy * ux;
    const zy = xy * uz - xz * uy;
    const zz = xz * ux - xx * uz;

    out[0] = xx * radius; out[1] = xy * radius; out[2] = xz * radius; out[3] = 0;
    out[4] = ux * len;    out[5] = uy * len;    out[6] = uz * len;    out[7] = 0;
    out[8] = zx * radius; out[9] = zy * radius; out[10] = zz * radius; out[11] = 0;
    out[12] = (ax + bx) * 0.5;
    out[13] = (ay + by) * 0.5;
    out[14] = (az + bz) * 0.5;
    out[15] = 1;
    return out;
  }

  function mat4Copy(out, src) {
    out.set(src);
    return out;
  }

  function mat4TranslateInPlace(m, tx, ty, tz) {
    m[12] += m[0] * tx + m[4] * ty + m[8] * tz;
    m[13] += m[1] * tx + m[5] * ty + m[9] * tz;
    m[14] += m[2] * tx + m[6] * ty + m[10] * tz;
    m[15] += m[3] * tx + m[7] * ty + m[11] * tz;
    return m;
  }

  function mat4RotXInPlace(m, rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    for (let i = 0; i < 4; i++) {
      const c1 = m[4 + i];
      const c2 = m[8 + i];
      m[4 + i] = c1 * c + c2 * s;
      m[8 + i] = -c1 * s + c2 * c;
    }
    return m;
  }

  function mat4RotYInPlace(m, rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    for (let i = 0; i < 4; i++) {
      const c0 = m[i];
      const c2 = m[8 + i];
      m[i] = c0 * c - c2 * s;
      m[8 + i] = c0 * s + c2 * c;
    }
    return m;
  }

  function mat4RotZInPlace(m, rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    for (let i = 0; i < 4; i++) {
      const c0 = m[i];
      const c1 = m[4 + i];
      m[i] = c0 * c + c1 * s;
      m[4 + i] = -c0 * s + c1 * c;
    }
    return m;
  }

  function mat4ScaleInPlace(m, sx, sy, sz) {
    for (let i = 0; i < 4; i++) {
      m[i] *= sx;
      m[4 + i] *= sy;
      m[8 + i] *= sz;
    }
    return m;
  }

  function compileShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || 'Shader compile error');
    }
    return sh;
  }

  function createProgram(gl, vsSrc, fsSrc) {
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'Program link error');
    }
    return prog;
  }

  // =========================================================================
  // SHADER 1: GPU-Skinned 3D Soft-Body Subsurface-Scattering Gummy Bear
  // =========================================================================
  const BEAR_VS = `#version 300 es
  precision highp float;
  precision highp int;

  layout(location = 0) in vec3 aPos;
  layout(location = 1) in vec3 aNormal;
  layout(location = 2) in float aPart;
  layout(location = 3) in vec4 aJoints;
  layout(location = 4) in vec4 aWeights;

  uniform mat4 uViewProj;
  uniform vec3 uRestNodes[18];
  uniform vec3 uNodes[18];
  uniform mat3 uBearRot;
  uniform float uScale;
  uniform float uBellyBulge;
  uniform float uCheeky;
  uniform int uShadowPass;

  out vec3 vWorldPos;
  out vec3 vNormal;
  out vec3 vLocalPos;
  out float vPart;

  void main() {
    vec3 pos = aPos;
    vec3 norm = aNormal;

    // Subtle Traitor Cue #1: Gentle gummy belly fullness after eating a bear
    if (uBellyBulge > 0.001 && aPart < 0.5) {
      vec3 dB = (pos - vec3(0.0, -0.24, 0.22)) / vec3(0.45, 0.40, 0.35);
      float wBelly = exp(-dot(dB, dB) * 1.65) * smoothstep(-0.06, 0.22, pos.z);
      vec3 bulgeDir = normalize(vec3(pos.x * 0.68, (pos.y + 0.24) * 0.34 - 0.03, 1.0));
      pos += bulgeDir * (uBellyBulge * 0.22 * wBelly);
      norm = normalize(norm + bulgeDir * (uBellyBulge * 0.32 * wBelly));
    }

    // Subtle Traitor Cue #2: Faint smug eye squint when cheeky
    if (uCheeky > 0.01 && aPart > 0.5 && aPart < 1.5 && pos.y > 0.59) {
      float eyeCy = 0.655;
      pos.y = eyeCy + (pos.y - eyeCy) * (1.0 - 0.24 * uCheeky);
    }

    vec3 skinned = vec3(0.0);
    for (int k = 0; k < 4; k++) {
      int idx = int(aJoints[k] + 0.5);
      float w = aWeights[k];
      vec3 localOff = (pos - uRestNodes[idx]) * uScale;
      skinned += w * (uNodes[idx] + uBearRot * localOff);
    }

    if (uShadowPass == 1) {
      vec3 lightDir = normalize(vec3(0.32, 1.0, 0.25));
      float t = max(0.0, (skinned.y - 0.018) / lightDir.y);
      vec3 shadowPos = vec3(skinned.x - lightDir.x * t, 0.018, skinned.z - lightDir.z * t);
      vWorldPos = shadowPos;
      vNormal = uBearRot * norm;
      vLocalPos = pos;
      vPart = aPart;
      gl_Position = uViewProj * vec4(shadowPos, 1.0);
      return;
    }

    vWorldPos = skinned;
    vNormal = normalize(uBearRot * norm);
    vLocalPos = pos;
    vPart = aPart;
    gl_Position = uViewProj * vec4(skinned, 1.0);
  }`;

  const BEAR_FS = `#version 300 es
  precision highp float;
  precision highp int;

  in vec3 vWorldPos;
  in vec3 vNormal;
  in vec3 vLocalPos;
  in float vPart;

  uniform vec3 uCamPos;
  uniform vec3 uFlavorRgb;
  uniform vec3 uCoreRgb;
  uniform float uFrozen;
  uniform float uSugarCoat;
  uniform float uIsGold;
  uniform float uIsWhite;
  uniform float uNeonMode;
  uniform float uCheeky;
  uniform float uHeat;
  uniform float uIsGhost;
  uniform float uMegaLevel;
  uniform int uShadowPass;

  out vec4 fragColor;

  void main() {
    if (vPart > 1.5 && uCheeky < 0.08) {
      discard;
    }

    if (uShadowPass == 1) {
      if (vNormal.y < 0.0) discard;
      float sAlpha = uIsGhost > 0.5 ? 0.05 : (uNeonMode > 0.5 ? 0.32 : 0.14);
      fragColor = vec4(0.22, 0.10, 0.30, sAlpha);
      return;
    }

    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vWorldPos);
    vec3 L1 = normalize(vec3(0.42, 0.86, 0.38));
    vec3 L2 = normalize(vec3(-0.58, 0.45, -0.52));

    // Glossy bead eyes, candy nose & subtle cheeky Traitor smirk/brows (part 1 & 2)
    if (vPart > 0.5) {
      vec3 H = normalize(L1 + V);
      float spec = pow(max(dot(N, H), 0.0), 90.0);
      float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      vec3 darkBerry = mix(vec3(0.10, 0.03, 0.08), vec3(0.45, 0.78, 0.98), uFrozen * 0.65);
      vec3 col = darkBerry + vec3(1.0) * spec * 0.95 + vec3(0.4) * rim * 0.25;
      float partAlpha = vPart > 1.5 ? smoothstep(0.08, 0.45, uCheeky) * 0.78 : (uIsGhost > 0.5 ? 0.65 : 1.0);
      fragColor = vec4(col, partAlpha);
      return;
    }

    vec3 baseCol = uFlavorRgb;
    vec3 coreCol = uCoreRgb;

    // 24K Gold metallic-gummy shimmer
    if (uIsGold > 0.5) {
      float metallicBands = 0.5 + 0.5 * sin(dot(N, vec3(3.2, 5.1, 2.4)));
      baseCol = mix(vec3(0.95, 0.62, 0.06), vec3(1.0, 0.88, 0.34), metallicBands);
      coreCol = vec3(1.0, 0.97, 0.75);
    }

    // Exclusive Blessed White Gummy Bear pearlescent milky-opalescent sheen
    if (uIsWhite > 0.5) {
      baseCol = vec3(0.94, 0.96, 1.0);
      coreCol = vec3(1.0, 0.99, 0.90);
    }

    // Cryo ice-crystal tint
    if (uFrozen > 0.01) {
      baseCol = mix(baseCol, vec3(0.46, 0.86, 1.0), uFrozen * 0.68);
      coreCol = mix(coreCol, vec3(0.88, 0.98, 1.0), uFrozen * 0.78);
    }

    // Heat Laser molten glow
    if (uHeat > 0.02) {
      baseCol = mix(baseCol, vec3(1.0, 0.32, 0.04), uHeat * 0.72);
      coreCol = mix(coreCol, vec3(1.0, 0.92, 0.42), uHeat * 0.85);
    }

    // Wrap diffuse + Subsurface Scattering (SSS) internal gelatin transmission
    float wrapDiff = clamp((dot(N, L1) + 0.55) / 1.55, 0.0, 1.0);
    float fillDiff = clamp((dot(N, L2) + 0.4) / 1.4, 0.0, 1.0) * 0.35;

    // Light scattering through the back & belly core of the gummy bear
    float backScatter = pow(clamp(dot(V, -(L1 + N * 0.42)), 0.0, 1.0), 2.4);
    float thickness = 1.0 - clamp(length(vLocalPos.xz) * 1.15, 0.0, 0.85);
    float innerGlow = (0.35 + 0.65 * thickness) * (0.45 + 0.55 * max(dot(N, V), 0.0));

    vec3 shadowTint = uIsWhite > 0.5 ? vec3(0.75, 0.78, 0.89) : baseCol * 0.62;
    vec3 jellyColor = mix(shadowTint, baseCol, clamp(wrapDiff + fillDiff, 0.0, 1.0));
    jellyColor = mix(jellyColor, coreCol, clamp(innerGlow * 0.62 + backScatter * 0.55, 0.0, 0.92));

    // Fresnel candy rim & dual wet specular coat
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);
    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);
    float specBroad = pow(max(dot(N, H1), 0.0), 22.0) * 0.32;
    float specWet = pow(max(dot(N, H1), 0.0), 115.0) * (0.88 + uFrozen * 0.45 + uIsGold * 0.4 + uIsWhite * 0.28);
    float specRim = pow(max(dot(N, H2), 0.0), 48.0) * 0.28;

    vec3 rimTint = uIsWhite > 0.5 ? vec3(1.0, 0.92, 0.68) : mix(baseCol, vec3(1.0), 0.65);
    vec3 finalRgb = jellyColor
      + rimTint * fresnel * (0.42 + uFrozen * 0.4 + uIsWhite * 0.16 + uIsGhost * 0.55)
      + vec3(1.0, 0.98, 0.99) * (specBroad + specWet + specRim);

    // Mega-Bear fused prismatic rim shimmer
    if (uMegaLevel > 0.5) {
      vec3 megaGlow = 0.5 + 0.5 * cos(vLocalPos.y * 4.5 + vec3(0.0, 2.1, 4.2));
      finalRgb += megaGlow * fresnel * 0.38;
    }

    // Optional Sour Sugar Coating crystal sparkles
    if (uSugarCoat > 0.5) {
      vec3 cell = floor(vLocalPos * 62.0);
      float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float glint = step(0.84, h) * pow(max(dot(N, H1), 0.0), 6.0);
      finalRgb = mix(finalRgb, vec3(1.0), 0.14 + glint * 0.75 + fresnel * 0.22);
    }

    // Very faint cheeky blush on the Traitor bear right after a meal
    if (uCheeky > 0.08) {
      vec3 cOff = vec3(abs(vLocalPos.x) - 0.24, vLocalPos.y - 0.52, vLocalPos.z - 0.28) * vec3(4.5, 6.0, 4.5);
      float blush = exp(-dot(cOff, cOff) * 1.9) * uCheeky * 0.15;
      finalRgb = mix(finalRgb, vec3(1.0, 0.26, 0.54), blush);
    }

    // Neon Rave glow boost
    if (uNeonMode > 0.5) {
      finalRgb += baseCol * (0.24 + fresnel * 0.45);
    }

    float alpha = mix(0.90, 0.96, fresnel + uFrozen * 0.2 + uSugarCoat * 0.06);
    if (uIsGhost > 0.5) {
      alpha = mix(0.32, 0.68, fresnel);
    }
    fragColor = vec4(finalRgb, clamp(alpha, 0.0, 1.0));
  }`;

  // =========================================================================
  // SHADER 2: 3D Candy Studio Stage, Arena Props, Stripes, Beams & Particles
  // =========================================================================
  const STAGE_VS = `#version 300 es
  precision highp float;
  precision highp int;

  layout(location = 0) in vec3 aPos;
  layout(location = 1) in vec3 aNormal;
  layout(location = 2) in vec2 aUv;

  uniform mat4 uViewProj;
  uniform mat4 uModel;

  out vec3 vWorldPos;
  out vec3 vNormal;
  out vec2 vUv;

  void main() {
    vec4 wp = uModel * vec4(aPos, 1.0);
    vWorldPos = wp.xyz;
    vNormal = normalize(mat3(uModel) * aNormal);
    vUv = aUv;
    gl_Position = uViewProj * wp;
  }`;

  const STAGE_FS = `#version 300 es
  precision highp float;
  precision highp int;

  in vec3 vWorldPos;
  in vec3 vNormal;
  in vec2 vUv;

  uniform vec3 uCamPos;
  uniform vec4 uColor;
  uniform vec3 uColor2;
  uniform int uStyle; // 0=solid/lit, 1=floor grid, 2=peppermint stripes, 3=unlit glow, 4=glass rail
  uniform float uTime;
  uniform float uNeonMode;

  out vec4 fragColor;

  void main() {
    if (uStyle == 1) {
      // Candy Studio Floor with soft tile grid & distance fade
      vec2 grid = abs(fract(vWorldPos.xz * 0.5 - 0.5) - 0.5) / fwidth(vWorldPos.xz * 0.5);
      float line = 1.0 - min(min(grid.x, grid.y), 1.0);
      float dist = length(vWorldPos.xz);
      float radialFade = 1.0 - smoothstep(9.0, 22.0, dist);

      if (uNeonMode > 0.5) {
        vec3 base = vec3(0.07, 0.04, 0.13);
        vec3 neonLine = mix(vec3(0.75, 0.18, 0.95), vec3(0.12, 0.82, 1.0), clamp(vWorldPos.x * 0.05 + 0.5, 0.0, 1.0));
        vec3 col = base + neonLine * line * 0.42 * radialFade;
        fragColor = vec4(col, 1.0);
      } else {
        vec3 checkerA = vec3(0.99, 0.96, 0.98);
        vec3 checkerB = vec3(0.95, 0.91, 0.97);
        float chk = mod(floor(vWorldPos.x * 0.5) + floor(vWorldPos.z * 0.5), 2.0);
        vec3 base = mix(checkerA, checkerB, chk * 0.65 * radialFade);
        vec3 lineCol = vec3(0.86, 0.78, 0.92);
        vec3 col = mix(base, lineCol, line * 0.45 * radialFade);
        fragColor = vec4(col, 1.0);
      }
      return;
    }

    if (uStyle == 3) {
      fragColor = uColor;
      return;
    }

    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vWorldPos);
    vec3 L = normalize(vec3(0.42, 0.86, 0.38));

    if (uStyle == 4) {
      float fres = pow(1.0 - abs(dot(N, V)), 2.2);
      vec3 col = uColor.rgb + vec3(0.35) * fres;
      fragColor = vec4(col, uColor.a + fres * 0.22);
      return;
    }

    vec3 base = uColor.rgb;
    if (uStyle == 2) {
      float stripe = step(0.5, fract(vUv.x * 8.0 + vUv.y * 2.0 - uTime * 0.35));
      base = mix(uColor.rgb, uColor2, stripe);
    }

    float diff = 0.42 + 0.58 * max(dot(N, L), 0.0);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 48.0) * 0.45;
    vec3 rgb = base * diff + vec3(1.0) * spec;
    if (uNeonMode > 0.5) {
      rgb += base * 0.22;
    }
    fragColor = vec4(rgb, uColor.a);
  }`;

  // =========================================================================
  // SHADER 3: GPU-Skinned Sculpted 3D Humanoid Bear-Thief (Green / Blue / Red)
  // =========================================================================
  const THIEF_VS = `#version 300 es
  precision highp float;
  precision highp int;

  layout(location = 0) in vec3 aPos;
  layout(location = 1) in vec3 aNormal;
  layout(location = 2) in float aPart;
  layout(location = 3) in vec4 aJoints;
  layout(location = 4) in vec4 aWeights;

  uniform mat4 uViewProj;
  uniform mat4 uBones[13];
  uniform int uShadowPass;

  out vec3 vWorldPos;
  out vec3 vNormal;
  out vec3 vLocalPos;
  out float vPart;

  void main() {
    vec4 restP = vec4(aPos, 1.0);
    vec3 skinnedPos = vec3(0.0);
    vec3 skinnedNorm = vec3(0.0);
    for (int k = 0; k < 4; k++) {
      int idx = int(aJoints[k] + 0.5);
      float w = aWeights[k];
      mat4 B = uBones[idx];
      skinnedPos += w * (B * restP).xyz;
      skinnedNorm += w * (mat3(B) * aNormal);
    }

    if (uShadowPass == 1) {
      vec3 lightDir = normalize(vec3(0.32, 1.0, 0.25));
      float t = max(0.0, (skinnedPos.y - 0.016) / lightDir.y);
      vec3 shadowPos = vec3(skinnedPos.x - lightDir.x * t, 0.016, skinnedPos.z - lightDir.z * t);
      vWorldPos = shadowPos;
      vNormal = skinnedNorm;
      vLocalPos = aPos;
      vPart = aPart;
      gl_Position = uViewProj * vec4(shadowPos, 1.0);
      return;
    }

    vWorldPos = skinnedPos;
    vNormal = normalize(skinnedNorm);
    vLocalPos = aPos;
    vPart = aPart;
    gl_Position = uViewProj * vec4(skinnedPos, 1.0);
  }`;

  const THIEF_FS = `#version 300 es
  precision highp float;
  precision highp int;

  in vec3 vWorldPos;
  in vec3 vNormal;
  in vec3 vLocalPos;
  in float vPart;

  uniform vec3 uCamPos;
  uniform vec3 uSkinMain;
  uniform vec3 uSkinDark;
  uniform vec3 uSkinLight;
  uniform vec3 uEyeGlow;
  uniform float uIsGoldenMan;
  uniform float uIsObtuseMan;
  uniform float uNeonMode;
  uniform float uAlpha;
  uniform int uShadowPass;

  out vec4 fragColor;

  void main() {
    if (uShadowPass == 1) {
      if (vNormal.y < -0.15) discard;
      fragColor = vec4(0.18, 0.08, 0.26, (uNeonMode > 0.5 ? 0.36 : 0.18) * uAlpha);
      return;
    }

    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vWorldPos);
    vec3 L1 = normalize(vec3(0.42, 0.86, 0.38));
    vec3 L2 = normalize(vec3(-0.58, 0.45, -0.52));

    // Expressive glowing eyes (part 1)
    if (vPart > 0.5 && vPart < 1.5) {
      vec3 H = normalize(L1 + V);
      float spec = pow(max(dot(N, H), 0.0), 75.0);
      fragColor = vec4(uEyeGlow + vec3(0.45) * spec, 1.0);
      return;
    }

    // Pupils, fierce/mischievous sculpted brows & smirk (part 2)
    if (vPart >= 1.5) {
      vec3 H = normalize(L1 + V);
      float spec = pow(max(dot(N, H), 0.0), 60.0) * 0.45;
      vec3 darkFeature = mix(vec3(0.04, 0.03, 0.06), uSkinDark * 0.35, 0.4);
      fragColor = vec4(darkFeature + vec3(spec), 1.0);
      return;
    }

    // Sculpted 3D Muscular Skin + Tonal Athletic Runner Shorts & Sneakers
    vec3 baseCol = uSkinMain;
    vec3 shadowCol = uSkinDark;
    float specPower = 34.0;
    float specStrength = 0.36;

    if (uIsGoldenMan > 0.5) {
      float metallicBands = 0.5 + 0.5 * sin(dot(N, vec3(3.6, 5.2, 2.8)));
      baseCol = mix(vec3(0.96, 0.66, 0.08), vec3(1.0, 0.92, 0.42), metallicBands);
      shadowCol = vec3(0.58, 0.34, 0.03);
      specPower = 68.0;
      specStrength = 0.82;
    }

    // Athletic / Celestial shorts region (hips to mid-thigh in rest space)
    if (vLocalPos.y > 1.92 && vLocalPos.y < 2.78 && abs(vLocalPos.x) < 0.72) {
      if (uIsGoldenMan > 0.5) {
        baseCol = vec3(0.98, 0.98, 1.0);
        shadowCol = vec3(0.76, 0.79, 0.88);
        specPower = 28.0;
        specStrength = 0.28;
        if (vLocalPos.y > 2.70 || abs(abs(vLocalPos.x) - 0.56) < 0.055) {
          baseCol = vec3(1.0, 0.84, 0.22);
          shadowCol = vec3(0.74, 0.50, 0.06);
        }
      } else if (uIsObtuseMan > 0.5) {
        baseCol = vec3(0.14, 0.16, 0.28);
        shadowCol = vec3(0.06, 0.07, 0.14);
        specPower = 22.0;
        specStrength = 0.26;
        // Bold ~134-degree obtuse-angle chevron emblem + belt trim!
        float obtuseChevron = abs(vLocalPos.y - (2.22 + abs(vLocalPos.x) * 0.42));
        if (vLocalPos.y > 2.68 || obtuseChevron < 0.075) {
          baseCol = vec3(1.0, 0.66, 0.14);
          shadowCol = vec3(0.68, 0.34, 0.04);
        }
      } else {
        baseCol = uSkinDark * 0.78;
        shadowCol = uSkinDark * 0.42;
        specPower = 18.0;
        specStrength = 0.18;
        // Crisp athletic waistband & side racing stripe
        if (vLocalPos.y > 2.70 || abs(abs(vLocalPos.x) - 0.56) < 0.055) {
          baseCol = mix(uSkinLight, vec3(0.98), 0.55);
          shadowCol = uSkinMain;
        }
      }
    } else if (vLocalPos.y < 0.33) {
      // Sculpted running sneakers / celestial white-gold footwear
      if (vLocalPos.y < 0.085 || uIsGoldenMan > 0.5) {
        baseCol = vec3(0.97, 0.98, 1.0);
        shadowCol = vec3(0.74, 0.76, 0.84);
        if (uIsGoldenMan > 0.5 && abs(vLocalPos.z - 0.14) < 0.05) {
          baseCol = vec3(1.0, 0.84, 0.22);
        }
      } else {
        baseCol = mix(uSkinDark * 0.72, uSkinMain, 0.25);
        shadowCol = uSkinDark * 0.38;
        if (abs(vLocalPos.z - 0.14) < 0.045) {
          baseCol = mix(uSkinLight, vec3(1.0), 0.5);
        }
      }
      specPower = 42.0;
      specStrength = 0.42;
    }

    float wrapDiff = clamp((dot(N, L1) + 0.42) / 1.42, 0.0, 1.0);
    float fillDiff = clamp((dot(N, L2) + 0.35) / 1.35, 0.0, 1.0) * 0.32;
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.6);

    vec3 H1 = normalize(L1 + V);
    float spec = pow(max(dot(N, H1), 0.0), specPower) * specStrength;

    vec3 col = mix(shadowCol, baseCol, clamp(wrapDiff + fillDiff * 0.55, 0.0, 1.0));
    col += uSkinLight * fresnel * 0.42 + vec3(1.0, 0.99, 0.97) * spec;

    if (uNeonMode > 0.5) {
      col += uSkinMain * (0.18 + fresnel * 0.32);
    }

    fragColor = vec4(col, uAlpha);
  }`;

  class GummyRenderer3D {
    constructor(canvas, world) {
      this.canvas = canvas;
      this.world = world;
      const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true });
      if (!gl) {
        throw new Error('WebGL2 is required for 3D Gummy Bounce.');
      }
      this.gl = gl;
      this.dpr = 1;
      this.neonMode = false;

      // Orbit Camera State
      this.cam = {
        yaw: 0.0,
        pitch: 0.36,
        distance: 18.2,
        target: [0, 2.3, 0],
        eye: [0, 8.4, 17.0],
        fov: (46 * Math.PI) / 180
      };

      this.projMat = new Float32Array(16);
      this.viewMat = new Float32Array(16);
      this.viewProjMat = new Float32Array(16);
      this.invViewProjMat = new Float32Array(16);
      this.modelMat = new Float32Array(16);

      this.initShaders();
      this.initGeometries();
    }

    initShaders() {
      const gl = this.gl;
      this.bearProg = createProgram(gl, BEAR_VS, BEAR_FS);
      this.bearLocs = {
        uViewProj: gl.getUniformLocation(this.bearProg, 'uViewProj'),
        uRestNodes: gl.getUniformLocation(this.bearProg, 'uRestNodes[0]'),
        uNodes: gl.getUniformLocation(this.bearProg, 'uNodes[0]'),
        uBearRot: gl.getUniformLocation(this.bearProg, 'uBearRot'),
        uScale: gl.getUniformLocation(this.bearProg, 'uScale'),
        uShadowPass: gl.getUniformLocation(this.bearProg, 'uShadowPass'),
        uCamPos: gl.getUniformLocation(this.bearProg, 'uCamPos'),
        uFlavorRgb: gl.getUniformLocation(this.bearProg, 'uFlavorRgb'),
        uCoreRgb: gl.getUniformLocation(this.bearProg, 'uCoreRgb'),
        uFrozen: gl.getUniformLocation(this.bearProg, 'uFrozen'),
        uSugarCoat: gl.getUniformLocation(this.bearProg, 'uSugarCoat'),
        uIsGold: gl.getUniformLocation(this.bearProg, 'uIsGold'),
        uIsWhite: gl.getUniformLocation(this.bearProg, 'uIsWhite'),
        uNeonMode: gl.getUniformLocation(this.bearProg, 'uNeonMode'),
        uBellyBulge: gl.getUniformLocation(this.bearProg, 'uBellyBulge'),
        uCheeky: gl.getUniformLocation(this.bearProg, 'uCheeky'),
        uHeat: gl.getUniformLocation(this.bearProg, 'uHeat'),
        uIsGhost: gl.getUniformLocation(this.bearProg, 'uIsGhost'),
        uMegaLevel: gl.getUniformLocation(this.bearProg, 'uMegaLevel')
      };

      this.restNodesFlat = new Float32Array(REST_NODES_3D.length * 3);
      REST_NODES_3D.forEach((rn, i) => {
        this.restNodesFlat[i * 3] = rn.rx;
        this.restNodesFlat[i * 3 + 1] = rn.ry;
        this.restNodesFlat[i * 3 + 2] = rn.rz;
      });

      this.stageProg = createProgram(gl, STAGE_VS, STAGE_FS);
      this.stageLocs = {
        uViewProj: gl.getUniformLocation(this.stageProg, 'uViewProj'),
        uModel: gl.getUniformLocation(this.stageProg, 'uModel'),
        uCamPos: gl.getUniformLocation(this.stageProg, 'uCamPos'),
        uColor: gl.getUniformLocation(this.stageProg, 'uColor'),
        uColor2: gl.getUniformLocation(this.stageProg, 'uColor2'),
        uStyle: gl.getUniformLocation(this.stageProg, 'uStyle'),
        uTime: gl.getUniformLocation(this.stageProg, 'uTime'),
        uNeonMode: gl.getUniformLocation(this.stageProg, 'uNeonMode')
      };

      this.thiefProg = createProgram(gl, THIEF_VS, THIEF_FS);
      this.thiefLocs = {
        uViewProj: gl.getUniformLocation(this.thiefProg, 'uViewProj'),
        uBones: gl.getUniformLocation(this.thiefProg, 'uBones[0]'),
        uShadowPass: gl.getUniformLocation(this.thiefProg, 'uShadowPass'),
        uCamPos: gl.getUniformLocation(this.thiefProg, 'uCamPos'),
        uSkinMain: gl.getUniformLocation(this.thiefProg, 'uSkinMain'),
        uSkinDark: gl.getUniformLocation(this.thiefProg, 'uSkinDark'),
        uSkinLight: gl.getUniformLocation(this.thiefProg, 'uSkinLight'),
        uEyeGlow: gl.getUniformLocation(this.thiefProg, 'uEyeGlow'),
        uIsGoldenMan: gl.getUniformLocation(this.thiefProg, 'uIsGoldenMan'),
        uIsObtuseMan: gl.getUniformLocation(this.thiefProg, 'uIsObtuseMan'),
        uNeonMode: gl.getUniformLocation(this.thiefProg, 'uNeonMode'),
        uAlpha: gl.getUniformLocation(this.thiefProg, 'uAlpha')
      };
      this.thiefWorldMats = Array.from({ length: 13 }, () => new Float32Array(16));
      this.thiefBoneUniforms = new Float32Array(13 * 16);
      this.thiefScratchMat = new Float32Array(16);
      this.thiefCharMat = new Float32Array(16);
    }

    createStageVAO(mesh) {
      const gl = this.gl;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

      const normBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

      const uvBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

      const idxBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

      gl.bindVertexArray(null);
      return { vao, count: mesh.indices.length };
    }

    initGeometries() {
      const gl = this.gl;

      // 1. Sculpted 3D Gummy Bear VAO
      const bearMesh = buildGummyBearMesh();
      this.bearVAO = gl.createVertexArray();
      this.bearIndexCount = bearMesh.indexCount;
      gl.bindVertexArray(this.bearVAO);

      const uploadAttr = (loc, data, size) => {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      };

      uploadAttr(0, bearMesh.positions, 3);
      uploadAttr(1, bearMesh.normals, 3);
      uploadAttr(2, bearMesh.parts, 1);
      uploadAttr(3, bearMesh.joints, 4);
      uploadAttr(4, bearMesh.weights, 4);

      const ebo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bearMesh.indices, gl.STATIC_DRAW);
      gl.bindVertexArray(null);

      // 1b. Sculpted 3D Athletic Humanoid Bear-Thief VAO
      const thiefMesh = buildThiefManMesh();
      this.thiefVAO = gl.createVertexArray();
      this.thiefIndexCount = thiefMesh.indexCount;
      gl.bindVertexArray(this.thiefVAO);

      uploadAttr(0, thiefMesh.positions, 3);
      uploadAttr(1, thiefMesh.normals, 3);
      uploadAttr(2, thiefMesh.parts, 1);
      uploadAttr(3, thiefMesh.joints, 4);
      uploadAttr(4, thiefMesh.weights, 4);

      const thiefEbo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, thiefEbo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, thiefMesh.indices, gl.STATIC_DRAW);
      gl.bindVertexArray(null);

      // 2. Stage Quad (XZ horizontal unit quad [-1, 1])
      this.quadVAO = this.createStageVAO({
        positions: new Float32Array([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1]),
        normals: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
        uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        indices: new Uint16Array([0, 2, 1, 0, 3, 2])
      });

      // 3. Stage Props (Torus Hoop, Thin Ring, Cylinder, Sphere)
      this.hoopVAO = this.createStageVAO(buildTorusMesh(1.0, 0.11, 38, 14));
      this.thinRingVAO = this.createStageVAO(buildTorusMesh(1.0, 0.035, 36, 10));
      this.cylVAO = this.createStageVAO(buildCylinderMesh(1, 1, 1, 26));
      this.sphereVAO = this.createStageVAO(buildSphereMesh(1, 12, 18));
    }

    syncSize() {
      const rect = this.canvas.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * this.dpr));
      const h = Math.max(1, Math.round(rect.height * this.dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this.aspect = w / h;
      this.updateCameraMatrices();
    }

    resetCamera() {
      this.cam.yaw = 0.0;
      this.cam.pitch = 0.36;
      this.cam.distance = 18.2;
      this.updateCameraMatrices();
    }

    orbitCamera(dYaw, dPitch) {
      this.cam.yaw += dYaw;
      this.cam.pitch = Math.max(0.08, Math.min(1.28, this.cam.pitch + dPitch));
      this.updateCameraMatrices();
    }

    zoomCamera(delta) {
      this.cam.distance = Math.max(8.5, Math.min(28.5, this.cam.distance + delta));
      this.updateCameraMatrices();
    }

    updateCameraMatrices() {
      const { yaw, pitch, distance, target, eye, fov } = this.cam;
      const cp = Math.cos(pitch);
      eye[0] = target[0] + Math.sin(yaw) * cp * distance;
      eye[1] = target[1] + Math.sin(pitch) * distance;
      eye[2] = target[2] + Math.cos(yaw) * cp * distance;

      mat4Perspective(this.projMat, fov, this.aspect || 1.5, 0.25, 90.0);
      mat4LookAt(this.viewMat, eye, target, [0, 1, 0]);
      mat4Multiply(this.viewProjMat, this.projMat, this.viewMat);
      mat4Invert(this.invViewProjMat, this.viewProjMat);
    }

    screenToRay(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = 1 - ((clientY - rect.top) / rect.height) * 2;

      const inv = this.invViewProjMat;
      const unproj = (z) => {
        const x = inv[0] * ndcX + inv[4] * ndcY + inv[8] * z + inv[12];
        const y = inv[1] * ndcX + inv[5] * ndcY + inv[9] * z + inv[13];
        const pz = inv[2] * ndcX + inv[6] * ndcY + inv[10] * z + inv[14];
        const w = inv[3] * ndcX + inv[7] * ndcY + inv[11] * z + inv[15] || 1;
        return [x / w, y / w, pz / w];
      };

      const nearPt = unproj(-1);
      const farPt = unproj(1);
      const dx = farPt[0] - nearPt[0];
      const dy = farPt[1] - nearPt[1];
      const dz = farPt[2] - nearPt[2];
      const len = Math.hypot(dx, dy, dz) || 1;
      return {
        orig: nearPt,
        dir: [dx / len, dy / len, dz / len]
      };
    }

    // Intersect screen ray with plane through refPoint facing camera
    projectOntoCameraPlane(clientX, clientY, refPoint) {
      const { orig, dir } = this.screenToRay(clientX, clientY);
      const fwdX = this.cam.target[0] - this.cam.eye[0];
      const fwdY = this.cam.target[1] - this.cam.eye[1];
      const fwdZ = this.cam.target[2] - this.cam.eye[2];
      const denom = dir[0] * fwdX + dir[1] * fwdY + dir[2] * fwdZ;
      if (Math.abs(denom) < 1e-5) return [...refPoint];
      const t = ((refPoint[0] - orig[0]) * fwdX + (refPoint[1] - orig[1]) * fwdY + (refPoint[2] - orig[2]) * fwdZ) / denom;
      const bx = this.world.boundsX - 0.35;
      const bz = this.world.boundsZ - 0.35;
      return [
        Math.max(-bx, Math.min(bx, orig[0] + dir[0] * t)),
        Math.max(0.35, Math.min(this.world.ceilingY - 0.8, orig[1] + dir[1] * t)),
        Math.max(-bz, Math.min(bz, orig[2] + dir[2] * t))
      ];
    }

    drawMesh(vaoObj, modelMat, style, r, g, b, a = 1.0, c2 = [1, 1, 1]) {
      const gl = this.gl;
      gl.uniformMatrix4fv(this.stageLocs.uModel, false, modelMat);
      gl.uniform1i(this.stageLocs.uStyle, style);
      gl.uniform4f(this.stageLocs.uColor, r, g, b, a);
      gl.uniform3f(this.stageLocs.uColor2, c2[0], c2[1], c2[2]);
      gl.bindVertexArray(vaoObj.vao);
      gl.drawElements(gl.TRIANGLES, vaoObj.count, gl.UNSIGNED_SHORT, 0);
    }

    computeThiefSkinMatrices(gm) {
      const W = this.thiefWorldMats;
      const s = gm.stridePhase;
      const t = gm.animTime || 0;
      const isRed = gm.variant === 'red';

      if (gm.phase === 'yellow_gift') {
        // Cheerful Yellow Man celebration hop after gifting you a gummy bear!
        const hop = Math.abs(Math.sin(t * 10.5)) * 0.34;
        const sway = Math.sin(t * 8.0) * 0.10;

        mat4Identity(W[0]);
        mat4TranslateInPlace(W[0], gm.x, 2.54 + hop, gm.z);
        mat4RotYInPlace(W[0], gm.yaw + sway * 0.5);
        mat4RotXInPlace(W[0], -0.06);
        mat4RotZInPlace(W[0], sway);

        mat4Copy(W[1], W[0]);
        mat4TranslateInPlace(W[1], 0, 0.50, 0);
        mat4RotXInPlace(W[1], -0.08);

        mat4Copy(W[2], W[1]);
        mat4TranslateInPlace(W[2], 0, 1.40, 0);
        mat4RotZInPlace(W[2], -sway * 0.8);

        for (const side of [-1, 1]) {
          const upIdx = side < 0 ? 3 : 5;
          const loIdx = side < 0 ? 4 : 6;
          const wave = Math.sin(t * 14.0 + side) * 0.24;
          mat4Copy(W[upIdx], W[1]);
          mat4TranslateInPlace(W[upIdx], side * 0.74, 1.01, 0);
          mat4RotXInPlace(W[upIdx], -2.42 + wave * 0.4);
          mat4RotZInPlace(W[upIdx], (side < 0 ? 0.65 : -0.65) + wave * 0.5);

          mat4Copy(W[loIdx], W[upIdx]);
          mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
          mat4RotYInPlace(W[loIdx], side < 0 ? 0.35 : -0.35);
        }

        for (const side of [-1, 1]) {
          const thIdx = side < 0 ? 7 : 10;
          const shIdx = side < 0 ? 8 : 11;
          const ftIdx = side < 0 ? 9 : 12;
          const kick = Math.sin(t * 10.5 + (side < 0 ? 0 : Math.PI)) * 0.28;

          mat4Copy(W[thIdx], W[0]);
          mat4TranslateInPlace(W[thIdx], side * 0.38, -0.05, 0);
          mat4RotXInPlace(W[thIdx], kick - 0.12);
          mat4RotZInPlace(W[thIdx], side * 0.08);

          mat4Copy(W[shIdx], W[thIdx]);
          mat4TranslateInPlace(W[shIdx], side * 0.02, -1.18, 0);
          mat4RotXInPlace(W[shIdx], 0.32 + Math.max(0, -kick) * 0.5);

          mat4Copy(W[ftIdx], W[shIdx]);
          mat4TranslateInPlace(W[ftIdx], 0, -1.18, 0);
          mat4RotXInPlace(W[ftIdx], 0.12);
        }
      } else if (gm.phase === 'yellow_beaten') {
        // Cartoon ragdoll tumble while the Obtuse Man pummels the Yellow Man!
        const bounce = Math.abs(Math.sin(t * 17.5)) * 0.52;
        mat4Identity(W[0]);
        mat4TranslateInPlace(W[0], gm.x, 1.18 + bounce, gm.z);
        mat4RotYInPlace(W[0], gm.yaw + Math.sin(t * 9.5) * 0.65);
        mat4RotXInPlace(W[0], -1.12 + Math.sin(t * 20.0) * 0.36);
        mat4RotZInPlace(W[0], Math.cos(t * 15.5) * 0.48);

        mat4Copy(W[1], W[0]);
        mat4TranslateInPlace(W[1], 0, 0.50, 0);
        mat4RotXInPlace(W[1], 0.22 + Math.sin(t * 23.0) * 0.18);
        mat4RotYInPlace(W[1], Math.cos(t * 18.0) * 0.32);

        mat4Copy(W[2], W[1]);
        mat4TranslateInPlace(W[2], 0, 1.40, 0);
        mat4RotXInPlace(W[2], Math.sin(t * 25.0) * 0.28);

        for (const side of [-1, 1]) {
          const upIdx = side < 0 ? 3 : 5;
          const loIdx = side < 0 ? 4 : 6;
          mat4Copy(W[upIdx], W[1]);
          mat4TranslateInPlace(W[upIdx], side * 0.74, 1.01, 0);
          mat4RotXInPlace(W[upIdx], -1.75 + Math.sin(t * 22.0 + side * 1.6) * 0.78);
          mat4RotZInPlace(W[upIdx], side < 0 ? 0.72 : -0.72);

          mat4Copy(W[loIdx], W[upIdx]);
          mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
          mat4RotYInPlace(W[loIdx], (side < 0 ? 0.85 : -0.85) + Math.cos(t * 20.0 + side) * 0.35);
        }

        for (const side of [-1, 1]) {
          const thIdx = side < 0 ? 7 : 10;
          const shIdx = side < 0 ? 8 : 11;
          const ftIdx = side < 0 ? 9 : 12;
          const flail = Math.sin(t * 21.0 + (side < 0 ? 0 : 2.2));

          mat4Copy(W[thIdx], W[0]);
          mat4TranslateInPlace(W[thIdx], side * 0.38, -0.05, 0);
          mat4RotXInPlace(W[thIdx], -0.88 + flail * 0.62);
          mat4RotZInPlace(W[thIdx], side * 0.18);

          mat4Copy(W[shIdx], W[thIdx]);
          mat4TranslateInPlace(W[shIdx], side * 0.02, -1.18, 0);
          mat4RotXInPlace(W[shIdx], 0.65 + Math.max(0, -flail) * 0.65);

          mat4Copy(W[ftIdx], W[shIdx]);
          mat4TranslateInPlace(W[ftIdx], 0, -1.18, 0);
          mat4RotXInPlace(W[ftIdx], flail * 0.25);
        }
      } else {
        const isFlee = gm.phase === 'flee';
        const strideAmp = isRed || isFlee ? 0.94 : 0.80;
        const bob = Math.abs(Math.sin(s)) * (isRed || isFlee ? 0.34 : 0.28);
        const pelvisFwd = isFlee ? 0.28 : isRed ? 0.24 : 0.14;
        const hipRoll = Math.sin(s) * 0.08;
        const torsoTwist = -Math.sin(s) * (isRed || isFlee ? 0.22 : 0.16);
        const chestFwd = isFlee ? 0.18 : isRed ? 0.15 : 0.10;

        // 0: Pelvis root at pivot (0, 2.65, 0) -> world
        mat4Identity(W[0]);
        mat4TranslateInPlace(W[0], gm.x, 2.52 + bob, gm.z);
        mat4RotYInPlace(W[0], gm.yaw);
        mat4RotXInPlace(W[0], pelvisFwd);
        mat4RotZInPlace(W[0], hipRoll);

        // 1: Chest / Ribcage at offset (0, 3.15 - 2.65, 0) = (0, 0.50, 0)
        mat4Copy(W[1], W[0]);
        mat4TranslateInPlace(W[1], 0, 0.50, 0);
        mat4RotXInPlace(W[1], chestFwd);
        mat4RotYInPlace(W[1], torsoTwist);

        // 2: Head & Neck at offset (0, 4.55 - 3.15, 0) = (0, 1.40, 0)
        mat4Copy(W[2], W[1]);
        mat4TranslateInPlace(W[2], 0, 1.40, 0);
        mat4RotXInPlace(W[2], -(pelvisFwd + chestFwd) * 0.72);
        mat4RotYInPlace(W[2], -torsoTwist * 0.65);

        // 3 & 4: Left Arm; 5 & 6: Right Arm (shoulder offsets (+-0.74, 4.16 - 3.15, 0))
        const carrying = Boolean(gm.capturedBears && gm.capturedBears.length > 0);
        for (const side of [-1, 1]) {
          const upIdx = side < 0 ? 3 : 5;
          const loIdx = side < 0 ? 4 : 6;
          mat4Copy(W[upIdx], W[1]);
          mat4TranslateInPlace(W[upIdx], side * 0.74, 1.01, 0);

          if (carrying) {
            // Both muscular arms raised overhead & forward cradling the stolen gummy bear!
            mat4RotXInPlace(W[upIdx], -2.38);
            mat4RotZInPlace(W[upIdx], side < 0 ? 1.16 : -1.16);

            mat4Copy(W[loIdx], W[upIdx]);
            mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
            mat4RotYInPlace(W[loIdx], side < 0 ? 0.62 : -0.62);
          } else if (isFlee) {
            // Panicked flailing arms while fleeing!
            const ph = side < 0 ? s + Math.PI : s;
            mat4RotXInPlace(W[upIdx], -2.15 + Math.sin(ph) * 0.55);
            mat4RotZInPlace(W[upIdx], side < 0 ? 0.78 : -0.78);

            mat4Copy(W[loIdx], W[upIdx]);
            mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
            mat4RotYInPlace(W[loIdx], side < 0 ? 0.45 : -0.45);
          } else {
            // Powerful athletic runner arm pump (opposite phase to legs)
            const ph = side < 0 ? s + Math.PI : s;
            const armSwing = -Math.sin(ph) * (isRed ? 1.02 : 0.82) - 0.15;
            const elbBend = 1.18 + Math.max(0, Math.sin(ph)) * 0.35;

            mat4RotXInPlace(W[upIdx], armSwing);
            mat4RotZInPlace(W[upIdx], side < 0 ? 1.28 : -1.28);

            mat4Copy(W[loIdx], W[upIdx]);
            mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
            mat4RotYInPlace(W[loIdx], side < 0 ? elbBend : -elbBend);
          }
        }

        // 7,8,9: Left Leg; 10,11,12: Right Leg (hip offsets (+-0.38, -0.05, 0) from pelvis)
        for (const side of [-1, 1]) {
          const thIdx = side < 0 ? 7 : 10;
          const shIdx = side < 0 ? 8 : 11;
          const ftIdx = side < 0 ? 9 : 12;
          const ph = side < 0 ? s : s + Math.PI;

          const hipSwing = -Math.sin(ph) * strideAmp - pelvisFwd * 0.85;
          const kneeBend = 0.28 + Math.max(0, -Math.cos(ph)) * (isRed || isFlee ? 1.28 : 1.08);
          const ankleFlex = -Math.sin(ph) * 0.25 - 0.10;

          mat4Copy(W[thIdx], W[0]);
          mat4TranslateInPlace(W[thIdx], side * 0.38, -0.05, 0);
          mat4RotXInPlace(W[thIdx], hipSwing);

          mat4Copy(W[shIdx], W[thIdx]);
          mat4TranslateInPlace(W[shIdx], side * 0.02, -1.18, 0);
          mat4RotXInPlace(W[shIdx], kneeBend);

          mat4Copy(W[ftIdx], W[shIdx]);
          mat4TranslateInPlace(W[ftIdx], 0, -1.18, 0);
          mat4RotXInPlace(W[ftIdx], ankleFlex);
        }
      }

      // Multiply each joint world matrix by InverseBind = Translate(-restPivot)
      const tmp = this.thiefScratchMat;
      for (let i = 0; i < 13; i++) {
        const piv = THIEF_BONES_3D[i].pivot;
        mat4Copy(tmp, W[i]);
        mat4TranslateInPlace(tmp, -piv[0], -piv[1], -piv[2]);
        this.thiefBoneUniforms.set(tmp, i * 16);
      }
    }

    drawGreenMan(gm) {
      const gl = this.gl;
      this.computeThiefSkinMatrices(gm);

      let skinMain;
      let skinDark;
      let skinLight;
      let eyeGlow;
      if (gm.variant === 'red') {
        skinMain = [0.92, 0.15, 0.19];
        skinDark = [0.46, 0.05, 0.09];
        skinLight = [1.00, 0.50, 0.32];
        eyeGlow = [1.00, 0.88, 0.26];
      } else if (gm.variant === 'yellow') {
        skinMain = [1.00, 0.84, 0.08];
        skinDark = [0.58, 0.38, 0.02];
        skinLight = [1.00, 0.97, 0.56];
        eyeGlow = [1.00, 1.00, 0.90];
      } else if (gm.variant === 'purple') {
        skinMain = [0.58, 0.16, 0.94];
        skinDark = [0.26, 0.05, 0.48];
        skinLight = [0.86, 0.54, 1.00];
        eyeGlow = [0.98, 0.90, 1.00];
      } else if (gm.variant === 'blue') {
        skinMain = [0.12, 0.50, 0.96];
        skinDark = [0.05, 0.22, 0.56];
        skinLight = [0.45, 0.82, 1.00];
        eyeGlow = [0.86, 0.98, 1.00];
      } else {
        skinMain = [0.12, 0.78, 0.29];
        skinDark = [0.05, 0.42, 0.15];
        skinLight = [0.40, 0.96, 0.52];
        eyeGlow = [1.00, 0.97, 0.48];
      }

      gl.useProgram(this.thiefProg);
      gl.uniformMatrix4fv(this.thiefLocs.uViewProj, false, this.viewProjMat);
      gl.uniformMatrix4fv(this.thiefLocs.uBones, false, this.thiefBoneUniforms);
      gl.uniform3fv(this.thiefLocs.uCamPos, this.cam.eye);
      gl.uniform3fv(this.thiefLocs.uSkinMain, skinMain);
      gl.uniform3fv(this.thiefLocs.uSkinDark, skinDark);
      gl.uniform3fv(this.thiefLocs.uSkinLight, skinLight);
      gl.uniform3fv(this.thiefLocs.uEyeGlow, eyeGlow);
      gl.uniform1f(this.thiefLocs.uIsGoldenMan, 0.0);
      gl.uniform1f(this.thiefLocs.uIsObtuseMan, 0.0);
      gl.uniform1f(this.thiefLocs.uNeonMode, this.neonMode ? 1.0 : 0.0);
      gl.uniform1f(this.thiefLocs.uAlpha, 1.0);
      gl.bindVertexArray(this.thiefVAO);

      // 1. Planar 3D Humanoid Floor Shadow
      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      gl.uniform1i(this.thiefLocs.uShadowPass, 1);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);

      // 2. Full Sculpted 3D Character Pass
      gl.uniform1i(this.thiefLocs.uShadowPass, 0);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
    }

    computeObtuseManSkinMatrices(om) {
      const W = this.thiefWorldMats;
      const s = om.stridePhase;
      const isBeatdown = om.phase === 'beatdown';
      const punchT = om.animTime * 22.5;

      const bob = isBeatdown ? Math.abs(Math.sin(punchT)) * 0.14 - 0.16 : Math.abs(Math.sin(s)) * 0.30;
      const pelvisFwd = isBeatdown ? 0.22 : 0.18;
      const hipRoll = isBeatdown ? Math.sin(punchT) * 0.06 : Math.sin(s) * 0.12;
      const chestFwd = isBeatdown ? 0.26 : 0.16;
      const torsoTwist = isBeatdown ? Math.sin(punchT) * 0.46 : -Math.sin(s) * 0.24;

      // Pose in local character space first, then apply wide 1.58x Obtuse Man world transform (zero shear!)
      mat4Identity(W[0]);
      mat4TranslateInPlace(W[0], 0, 2.50 + bob, 0);
      mat4RotXInPlace(W[0], pelvisFwd);
      mat4RotZInPlace(W[0], hipRoll);

      mat4Copy(W[1], W[0]);
      mat4TranslateInPlace(W[1], 0, 0.50, 0);
      mat4RotXInPlace(W[1], chestFwd);
      mat4RotYInPlace(W[1], torsoTwist);

      mat4Copy(W[2], W[1]);
      mat4TranslateInPlace(W[2], 0, 1.40, 0);
      mat4RotXInPlace(W[2], isBeatdown ? -0.10 : -(pelvisFwd + chestFwd) * 0.65);
      mat4RotYInPlace(W[2], -torsoTwist * 0.65);

      // Wide ~135-degree obtuse-angled brawler arms!
      for (const side of [-1, 1]) {
        const upIdx = side < 0 ? 3 : 5;
        const loIdx = side < 0 ? 4 : 6;
        mat4Copy(W[upIdx], W[1]);
        mat4TranslateInPlace(W[upIdx], side * 0.74, 1.01, 0);

        if (isBeatdown) {
          const ph = side < 0 ? punchT : punchT + Math.PI;
          const armSwing = -1.22 - Math.sin(ph) * 0.92;
          const elbBend = 0.62 + Math.max(0, -Math.sin(ph)) * 0.55;

          mat4RotXInPlace(W[upIdx], armSwing);
          mat4RotZInPlace(W[upIdx], side < 0 ? 0.72 : -0.72);

          mat4Copy(W[loIdx], W[upIdx]);
          mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
          mat4RotYInPlace(W[loIdx], side < 0 ? elbBend : -elbBend);
        } else {
          const ph = side < 0 ? s + Math.PI : s;
          const armSwing = -Math.sin(ph) * 0.90 - 0.25;
          const elbBend = 0.68 + Math.max(0, Math.sin(ph)) * 0.28;

          mat4RotXInPlace(W[upIdx], armSwing);
          mat4RotZInPlace(W[upIdx], side < 0 ? 0.82 : -0.82);

          mat4Copy(W[loIdx], W[upIdx]);
          mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
          mat4RotYInPlace(W[loIdx], side < 0 ? elbBend : -elbBend);
        }
      }

      // Wide-stanced stomping brute legs
      for (const side of [-1, 1]) {
        const thIdx = side < 0 ? 7 : 10;
        const shIdx = side < 0 ? 8 : 11;
        const ftIdx = side < 0 ? 9 : 12;

        mat4Copy(W[thIdx], W[0]);
        mat4TranslateInPlace(W[thIdx], side * 0.42, -0.05, 0);

        if (isBeatdown) {
          mat4RotXInPlace(W[thIdx], -0.45);
          mat4RotZInPlace(W[thIdx], side * 0.16);

          mat4Copy(W[shIdx], W[thIdx]);
          mat4TranslateInPlace(W[shIdx], side * 0.02, -1.18, 0);
          mat4RotXInPlace(W[shIdx], 0.58);

          mat4Copy(W[ftIdx], W[shIdx]);
          mat4TranslateInPlace(W[ftIdx], 0, -1.18, 0);
          mat4RotXInPlace(W[ftIdx], -0.12);
        } else {
          const ph = side < 0 ? s : s + Math.PI;
          const hipSwing = -Math.sin(ph) * 0.86 - pelvisFwd * 0.85;
          const kneeBend = 0.28 + Math.max(0, -Math.cos(ph)) * 1.15;
          const ankleFlex = -Math.sin(ph) * 0.22 - 0.08;

          mat4RotXInPlace(W[thIdx], hipSwing);
          mat4RotZInPlace(W[thIdx], side * 0.08);

          mat4Copy(W[shIdx], W[thIdx]);
          mat4TranslateInPlace(W[shIdx], side * 0.02, -1.18, 0);
          mat4RotXInPlace(W[shIdx], kneeBend);

          mat4Copy(W[ftIdx], W[shIdx]);
          mat4TranslateInPlace(W[ftIdx], 0, -1.18, 0);
          mat4RotXInPlace(W[ftIdx], ankleFlex);
        }
      }

      const charMat = this.thiefCharMat;
      mat4Identity(charMat);
      mat4TranslateInPlace(charMat, om.x, 0, om.z);
      mat4RotYInPlace(charMat, om.yaw);
      mat4ScaleInPlace(charMat, 1.58, 1.06, 1.32);

      const tmp = this.thiefScratchMat;
      for (let i = 0; i < 13; i++) {
        const piv = THIEF_BONES_3D[i].pivot;
        mat4Copy(tmp, W[i]);
        mat4TranslateInPlace(tmp, -piv[0], -piv[1], -piv[2]);
        mat4Multiply(tmp, charMat, tmp);
        this.thiefBoneUniforms.set(tmp, i * 16);
      }
    }

    drawObtuseMan(om) {
      const gl = this.gl;
      this.computeObtuseManSkinMatrices(om);

      gl.useProgram(this.thiefProg);
      gl.uniformMatrix4fv(this.thiefLocs.uViewProj, false, this.viewProjMat);
      gl.uniformMatrix4fv(this.thiefLocs.uBones, false, this.thiefBoneUniforms);
      gl.uniform3fv(this.thiefLocs.uCamPos, this.cam.eye);
      gl.uniform3fv(this.thiefLocs.uSkinMain, [0.28, 0.36, 0.64]);
      gl.uniform3fv(this.thiefLocs.uSkinDark, [0.11, 0.14, 0.30]);
      gl.uniform3fv(this.thiefLocs.uSkinLight, [0.58, 0.72, 1.00]);
      gl.uniform3fv(this.thiefLocs.uEyeGlow, [1.00, 0.58, 0.12]);
      gl.uniform1f(this.thiefLocs.uIsGoldenMan, 0.0);
      gl.uniform1f(this.thiefLocs.uIsObtuseMan, 1.0);
      gl.uniform1f(this.thiefLocs.uNeonMode, this.neonMode ? 1.0 : 0.0);
      gl.uniform1f(this.thiefLocs.uAlpha, 1.0);
      gl.bindVertexArray(this.thiefVAO);

      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      gl.uniform1i(this.thiefLocs.uShadowPass, 1);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);

      gl.uniform1i(this.thiefLocs.uShadowPass, 0);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
    }

    computeGoldenManSkinMatrices(gm) {
      const W = this.thiefWorldMats;
      const t = gm.animTime;
      const hoverBob = Math.sin(t * 3.2) * 0.16;
      const sway = Math.sin(t * 1.9) * 0.04;

      // 0: Pelvis root levitating at (gm.x, gm.y + 2.52 + hoverBob, gm.z)
      mat4Identity(W[0]);
      mat4TranslateInPlace(W[0], gm.x, gm.y + 2.52 + hoverBob, gm.z);
      mat4RotYInPlace(W[0], gm.yaw + sway * 0.5);
      mat4RotXInPlace(W[0], -0.04);
      mat4RotZInPlace(W[0], sway * 0.35);

      // 1: Chest / Ribcage
      mat4Copy(W[1], W[0]);
      mat4TranslateInPlace(W[1], 0, 0.50, 0);
      mat4RotXInPlace(W[1], -0.05);

      // 2: Head & Neck gazing benevolently down at the arena
      mat4Copy(W[2], W[1]);
      mat4TranslateInPlace(W[2], 0, 1.40, 0);
      mat4RotXInPlace(W[2], 0.16);

      // 3..6: Arms — outstretched offering palms before bestowing, raised celestial V-pose on ascent!
      const offering = !gm.hasBestowed;
      for (const side of [-1, 1]) {
        const upIdx = side < 0 ? 3 : 5;
        const loIdx = side < 0 ? 4 : 6;
        mat4Copy(W[upIdx], W[1]);
        mat4TranslateInPlace(W[upIdx], side * 0.74, 1.01, 0);

        if (offering) {
          mat4RotXInPlace(W[upIdx], -1.35);
          mat4RotZInPlace(W[upIdx], side < 0 ? 1.18 : -1.18);

          mat4Copy(W[loIdx], W[upIdx]);
          mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
          mat4RotYInPlace(W[loIdx], side < 0 ? 0.25 : -0.25);
        } else {
          mat4RotXInPlace(W[upIdx], -2.35);
          mat4RotZInPlace(W[upIdx], side < 0 ? 0.76 : -0.76);

          mat4Copy(W[loIdx], W[upIdx]);
          mat4TranslateInPlace(W[loIdx], side * 0.70, 0, 0);
          mat4RotYInPlace(W[loIdx], side < 0 ? 0.32 : -0.32);
        }
      }

      // 7..12: Serene levitation legs (one knee softly bent, one extended with pointed toes)
      for (const side of [-1, 1]) {
        const thIdx = side < 0 ? 7 : 10;
        const shIdx = side < 0 ? 8 : 11;
        const ftIdx = side < 0 ? 9 : 12;

        const hipAngle = side < 0 ? -0.34 : -0.08;
        const kneeBend = side < 0 ? 0.68 : 0.20;
        const anklePoint = 0.28 + Math.sin(t * 2.5 + side) * 0.05;

        mat4Copy(W[thIdx], W[0]);
        mat4TranslateInPlace(W[thIdx], side * 0.38, -0.05, 0);
        mat4RotXInPlace(W[thIdx], hipAngle);
        mat4RotZInPlace(W[thIdx], side * -0.05);

        mat4Copy(W[shIdx], W[thIdx]);
        mat4TranslateInPlace(W[shIdx], side * 0.02, -1.18, 0);
        mat4RotXInPlace(W[shIdx], kneeBend);

        mat4Copy(W[ftIdx], W[shIdx]);
        mat4TranslateInPlace(W[ftIdx], 0, -1.18, 0);
        mat4RotXInPlace(W[ftIdx], anklePoint);
      }

      const tmp = this.thiefScratchMat;
      for (let i = 0; i < 13; i++) {
        const piv = THIEF_BONES_3D[i].pivot;
        mat4Copy(tmp, W[i]);
        mat4TranslateInPlace(tmp, -piv[0], -piv[1], -piv[2]);
        this.thiefBoneUniforms.set(tmp, i * 16);
      }
    }

    drawGoldenMan(gm) {
      const gl = this.gl;
      this.computeGoldenManSkinMatrices(gm);

      gl.useProgram(this.thiefProg);
      gl.uniformMatrix4fv(this.thiefLocs.uViewProj, false, this.viewProjMat);
      gl.uniformMatrix4fv(this.thiefLocs.uBones, false, this.thiefBoneUniforms);
      gl.uniform3fv(this.thiefLocs.uCamPos, this.cam.eye);
      gl.uniform3fv(this.thiefLocs.uSkinMain, [1.00, 0.78, 0.16]);
      gl.uniform3fv(this.thiefLocs.uSkinDark, [0.58, 0.35, 0.04]);
      gl.uniform3fv(this.thiefLocs.uSkinLight, [1.00, 0.96, 0.72]);
      gl.uniform3fv(this.thiefLocs.uEyeGlow, [1.00, 0.99, 0.88]);
      gl.uniform1f(this.thiefLocs.uIsGoldenMan, 1.0);
      gl.uniform1f(this.thiefLocs.uIsObtuseMan, 0.0);
      gl.uniform1f(this.thiefLocs.uNeonMode, this.neonMode ? 1.0 : 0.0);
      gl.uniform1f(this.thiefLocs.uAlpha, 1.0);
      gl.bindVertexArray(this.thiefVAO);

      // Planar floor shadow while near arena
      if (gm.y < 13.0) {
        gl.disable(gl.CULL_FACE);
        gl.depthMask(false);
        gl.uniform1i(this.thiefLocs.uShadowPass, 1);
        gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
        gl.depthMask(true);
        gl.enable(gl.CULL_FACE);
      }

      gl.uniform1i(this.thiefLocs.uShadowPass, 0);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
    }

    drawBossObtuseMan(bs) {
      const gl = this.gl;
      this.computeObtuseManSkinMatrices({
        x: bs.x,
        z: bs.z,
        yaw: bs.yaw,
        stridePhase: bs.stridePhase,
        animTime: bs.animTime,
        phase: 'charge'
      });
      // Scale all bone matrices around boss root (bs.x, 0, bs.z) by bs.scale
      const s = bs.scale || 1.85;
      const scaleMat = new Float32Array(16);
      mat4Identity(scaleMat);
      mat4TranslateInPlace(scaleMat, bs.x, 0, bs.z);
      mat4ScaleInPlace(scaleMat, s, s, s);
      mat4TranslateInPlace(scaleMat, -bs.x, 0, -bs.z);
      const tmp = this.thiefScratchMat;
      for (let i = 0; i < 13; i++) {
        const slice = this.thiefBoneUniforms.subarray(i * 16, (i + 1) * 16);
        mat4Multiply(tmp, scaleMat, slice);
        this.thiefBoneUniforms.set(tmp, i * 16);
      }

      const f = bs.hitFlash || 0;
      const skinMain = [0.62 + f * 0.38, 0.14 + f * 0.72, 0.28 + f * 0.62];
      const skinDark = [0.28 + f * 0.4, 0.05 + f * 0.4, 0.12 + f * 0.4];
      const skinLight = [1.0, 0.48 + f * 0.52, 0.42 + f * 0.58];
      const eyeGlow = [1.0, 0.92, 0.18];

      gl.useProgram(this.thiefProg);
      gl.uniformMatrix4fv(this.thiefLocs.uViewProj, false, this.viewProjMat);
      gl.uniformMatrix4fv(this.thiefLocs.uBones, false, this.thiefBoneUniforms);
      gl.uniform3fv(this.thiefLocs.uCamPos, this.cam.eye);
      gl.uniform3fv(this.thiefLocs.uSkinMain, skinMain);
      gl.uniform3fv(this.thiefLocs.uSkinDark, skinDark);
      gl.uniform3fv(this.thiefLocs.uSkinLight, skinLight);
      gl.uniform3fv(this.thiefLocs.uEyeGlow, eyeGlow);
      gl.uniform1f(this.thiefLocs.uIsGoldenMan, 0.0);
      gl.uniform1f(this.thiefLocs.uIsObtuseMan, 1.0);
      gl.uniform1f(this.thiefLocs.uNeonMode, this.neonMode ? 1.0 : 0.0);
      gl.uniform1f(this.thiefLocs.uAlpha, 1.0);
      gl.bindVertexArray(this.thiefVAO);

      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      gl.uniform1i(this.thiefLocs.uShadowPass, 1);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);

      gl.uniform1i(this.thiefLocs.uShadowPass, 0);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
    }

    drawSurvivalThief(th) {
      const gl = this.gl;
      this.computeGreenManSkinMatrices({
        x: th.x,
        z: th.z,
        yaw: th.yaw,
        stridePhase: th.stridePhase,
        animTime: th.animTime,
        phase: th.phase,
        variant: th.variant === 'ghost' ? 'blue' : th.variant,
        capturedBears: th.targetBear ? [th.targetBear] : []
      });

      let skinMain, skinDark, skinLight, eyeGlow;
      let alpha = 1.0;
      if (th.variant === 'ghost') {
        skinMain = [0.68, 0.94, 1.0];
        skinDark = [0.34, 0.58, 0.78];
        skinLight = [0.95, 1.0, 1.0];
        eyeGlow = [0.35, 1.0, 0.92];
        alpha = 0.34 + 0.24 * Math.sin(th.flickerPhase || 0);
      } else if (th.variant === 'red') {
        skinMain = [0.96, 0.14, 0.18];
        skinDark = [0.54, 0.05, 0.09];
        skinLight = [1.0, 0.48, 0.42];
        eyeGlow = [1.0, 0.94, 0.28];
      } else {
        skinMain = [0.12, 0.78, 0.29];
        skinDark = [0.05, 0.42, 0.15];
        skinLight = [0.40, 0.96, 0.52];
        eyeGlow = [1.00, 0.97, 0.48];
      }

      gl.useProgram(this.thiefProg);
      gl.uniformMatrix4fv(this.thiefLocs.uViewProj, false, this.viewProjMat);
      gl.uniformMatrix4fv(this.thiefLocs.uBones, false, this.thiefBoneUniforms);
      gl.uniform3fv(this.thiefLocs.uCamPos, this.cam.eye);
      gl.uniform3fv(this.thiefLocs.uSkinMain, skinMain);
      gl.uniform3fv(this.thiefLocs.uSkinDark, skinDark);
      gl.uniform3fv(this.thiefLocs.uSkinLight, skinLight);
      gl.uniform3fv(this.thiefLocs.uEyeGlow, eyeGlow);
      gl.uniform1f(this.thiefLocs.uIsGoldenMan, 0.0);
      gl.uniform1f(this.thiefLocs.uIsObtuseMan, 0.0);
      gl.uniform1f(this.thiefLocs.uNeonMode, this.neonMode ? 1.0 : 0.0);
      gl.uniform1f(this.thiefLocs.uAlpha, alpha);
      gl.bindVertexArray(this.thiefVAO);

      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      gl.uniform1i(this.thiefLocs.uShadowPass, 1);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);

      gl.uniform1i(this.thiefLocs.uShadowPass, 0);
      gl.drawElements(gl.TRIANGLES, this.thiefIndexCount, gl.UNSIGNED_INT, 0);
    }

    drawBearHat(bear, hatId, timeSec) {
      if (!hatId || hatId === 'none') return;
      const head = bear.nodes[2];
      if (!head) return;
      const s = bear.scale;
      const upX = bear.rotMat[3];
      const upY = bear.rotMat[4];
      const upZ = bear.rotMat[5];
      const hx = head.x + upX * (0.48 * s);
      const hy = head.y + upY * (0.48 * s);
      const hz = head.z + upZ * (0.48 * s);

      if (hatId === 'halo') {
        mat4FromTRS(this.modelMat, hx, hy + 0.28 * s, hz, Math.PI * 0.5, timeSec * 2.2, 0, 0.38 * s, 0.38 * s, 0.38 * s);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.86, 0.18, 0.95);
      } else if (hatId === 'crown') {
        mat4FromTRS(this.modelMat, hx, hy + 0.08 * s, hz, 0, timeSec * 0.8, 0, 0.30 * s, 0.24 * s, 0.30 * s);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 1.0, 0.78, 0.08, 1.0);
        mat4FromTRS(this.modelMat, hx, hy + 0.22 * s, hz, Math.PI * 0.5, timeSec * 0.8, 0, 0.32 * s, 0.32 * s, 0.32 * s);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.94, 0.38, 1.0);
      } else if (hatId === 'tophat') {
        mat4FromTRS(this.modelMat, hx, hy + 0.02 * s, hz, 0, 0, 0, 0.42 * s, 0.06 * s, 0.42 * s);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.12, 0.10, 0.18, 1.0);
        mat4FromTRS(this.modelMat, hx, hy + 0.26 * s, hz, 0, 0, 0, 0.26 * s, 0.44 * s, 0.26 * s);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.16, 0.14, 0.24, 1.0);
        mat4FromTRS(this.modelMat, hx, hy + 0.10 * s, hz, 0, 0, 0, 0.275 * s, 0.08 * s, 0.275 * s);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.98, 0.20, 0.42, 1.0);
      } else if (hatId === 'party') {
        mat4FromTRS(this.modelMat, hx, hy + 0.24 * s, hz, 0, 0, 0, 0.26 * s, 0.46 * s, 0.26 * s);
        this.drawMesh(this.cylVAO, this.modelMat, 2, 1.0, 0.24, 0.68, 1.0, [0.22, 0.92, 1.0]);
        mat4FromTRS(this.modelMat, hx, hy + 0.50 * s, hz, 0, 0, 0, 0.11 * s, 0.11 * s, 0.11 * s);
        this.drawMesh(this.sphereVAO, this.modelMat, 3, 1.0, 0.88, 0.18, 1.0);
      } else if (hatId === 'wizard') {
        mat4FromTRS(this.modelMat, hx, hy + 0.02 * s, hz, 0, 0, 0, 0.46 * s, 0.06 * s, 0.46 * s);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.28, 0.14, 0.78, 1.0);
        mat4FromTRS(this.modelMat, hx, hy + 0.28 * s, hz, 0.14, 0, 0, 0.24 * s, 0.52 * s, 0.24 * s);
        this.drawMesh(this.cylVAO, this.modelMat, 2, 0.34, 0.16, 0.86, 1.0, [1.0, 0.88, 0.22]);
      }
    }

    render(timeSec) {
      const gl = this.gl;
      const w = this.world;
      this.updateCameraMatrices();

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      if (this.neonMode) {
        gl.clearColor(0.05, 0.025, 0.10, 1.0);
      } else {
        gl.clearColor(0.985, 0.945, 0.975, 1.0);
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // 1. Draw Candy Studio Floor & Arena Props (Opaque / Stage Pass)
      gl.useProgram(this.stageProg);
      gl.uniformMatrix4fv(this.stageLocs.uViewProj, false, this.viewProjMat);
      gl.uniform3fv(this.stageLocs.uCamPos, this.cam.eye);
      gl.uniform1f(this.stageLocs.uTime, timeSec);
      gl.uniform1f(this.stageLocs.uNeonMode, this.neonMode ? 1.0 : 0.0);

      // Floor
      gl.disable(gl.CULL_FACE);
      mat4FromTRS(this.modelMat, 0, 0, 0, 0, 0, 0, 32, 1, 32);
      this.drawMesh(this.quadVAO, this.modelMat, 1, 1, 1, 1, 1);

      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      // 3D Trampoline Pad
      if (w.trampoline.enabled) {
        const tr = w.trampoline;
        const pScale = 1 + tr.pulse * 0.12;
        // Rim
        mat4FromTRS(this.modelMat, tr.x, 0.15, tr.z, 0, 0, 0, tr.radius * pScale, 0.28, tr.radius * pScale);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.62, 0.18, 0.98, 1.0);
        // Bouncy neon-berry membrane
        mat4FromTRS(this.modelMat, tr.x, 0.20 + tr.pulse * 0.16, tr.z, 0, 0, 0, tr.radius * 0.86 * pScale, 0.22, tr.radius * 0.86 * pScale);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 1.0, 0.22, 0.68, 1.0);
      }

      // 3D Peppermint Sweeper Bar
      if (w.sweeper.enabled) {
        const sw = w.sweeper;
        // Center hub
        mat4FromTRS(this.modelMat, sw.x, 0.48, sw.z, 0, 0, 0, 0.62, 0.96, 0.62);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.95, 0.2, 0.45, 1.0);

        const ca = Math.cos(sw.angle);
        const sa = Math.sin(sw.angle);
        mat4AlignBeam(
          this.modelMat,
          sw.x - ca * sw.halfLen, sw.y, sw.z - sa * sw.halfLen,
          sw.x + ca * sw.halfLen, sw.y, sw.z + sa * sw.halfLen,
          sw.radius
        );
        this.drawMesh(this.cylVAO, this.modelMat, 2, 1.0, 0.16, 0.36, 1.0, [1.0, 0.97, 0.98]);
      }

      // 3D Floating Candy Hoops + Candy Support Posts
      for (const h of w.hoops) {
        if (!h.enabled) continue;
        const r = h.radius * (1 + h.pulse * 0.16);
        mat4FromTRS(this.modelMat, h.x, h.y, h.z, 0, 0, 0, r, r, r);
        this.drawMesh(this.hoopVAO, this.modelMat, 2, 1.0, 0.68, 0.04, 1.0, [1.0, 0.96, 0.76]);

        // Vertical lollipop stand pole down to floor
        const poleH = Math.max(0.2, h.y - r);
        mat4AlignBeam(this.modelMat, h.x, 0, h.z, h.x, poleH, h.z, 0.09);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.88, 0.78, 0.92, 1.0);
      }

      // Subtle arena corner posts & low glass bumper rails so 3D room bounds are clear
      const bx = w.boundsX;
      const bz = w.boundsZ;
      for (const [cx, cz] of [[-bx, -bz], [bx, -bz], [-bx, bz], [bx, bz]]) {
        mat4AlignBeam(this.modelMat, cx, 0, cz, cx, 2.4, cz, 0.14);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.82, 0.65, 0.95, 0.85);
      }
      // Top bumper rails
      mat4AlignBeam(this.modelMat, -bx, 1.1, -bz, bx, 1.1, -bz, 0.07);
      this.drawMesh(this.cylVAO, this.modelMat, 4, 0.78, 0.58, 0.98, 0.42);
      mat4AlignBeam(this.modelMat, -bx, 1.1, -bz, -bx, 1.1, bz, 0.07);
      this.drawMesh(this.cylVAO, this.modelMat, 4, 0.78, 0.58, 0.98, 0.42);
      mat4AlignBeam(this.modelMat, bx, 1.1, -bz, bx, 1.1, bz, 0.07);
      this.drawMesh(this.cylVAO, this.modelMat, 4, 0.78, 0.58, 0.98, 0.42);

      // 3D Pinball Bumpers & Launch Pads
      if (w.bumpers && w.bumpers.enabled) {
        for (const post of w.bumpers.posts) {
          const ps = 1 + post.pulse * 0.22;
          const [cr, cg, cb] = post.color;
          // Striped arcade bumper body
          mat4FromTRS(this.modelMat, post.x, post.height * 0.5, post.z, 0, timeSec * 1.5, 0, post.radius * 0.85 * ps, post.height, post.radius * 0.85 * ps);
          this.drawMesh(this.cylVAO, this.modelMat, 2, cr, cg, cb, 1.0, [1.0, 0.98, 0.94]);
          // Glowing bumper cap
          mat4FromTRS(this.modelMat, post.x, post.height + 0.08, post.z, 0, 0, 0, post.radius * 1.05 * ps, 0.24, post.radius * 1.05 * ps);
          this.drawMesh(this.cylVAO, this.modelMat, 0, cr + post.pulse * 0.4, cg + post.pulse * 0.4, cb + post.pulse * 0.4, 1.0);
          // Neon ring halo
          mat4FromTRS(this.modelMat, post.x, post.height * 0.65, post.z, Math.PI * 0.5, 0, 0, post.radius * 1.15 * ps, post.radius * 1.15 * ps, post.radius * 1.15 * ps);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, cr, cg, cb, 0.72 + post.pulse * 0.28);
        }
        for (const pad of w.bumpers.pads) {
          const ps = 1 + pad.pulse * 0.18;
          mat4FromTRS(this.modelMat, pad.x, 0.12, pad.z, 0, 0, 0, pad.radius * ps, 0.22, pad.radius * ps);
          this.drawMesh(this.cylVAO, this.modelMat, 0, 0.12, 0.88, 0.62, 1.0);
          mat4FromTRS(this.modelMat, pad.x, 0.22 + pad.pulse * 0.18, pad.z, Math.PI * 0.5, timeSec * 2.5, 0, pad.radius * 0.82 * ps, pad.radius * 0.82 * ps, pad.radius * 0.82 * ps);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, 0.42, 1.0, 0.84, 0.92);
        }
      }

      // 3D Upward Wind Tunnel / Floor Fan
      if (w.fan && w.fan.enabled) {
        const fn = w.fan;
        // Fan housing rim
        mat4FromTRS(this.modelMat, fn.x, 0.14, fn.z, 0, 0, 0, fn.radius, 0.26, fn.radius);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.24, 0.62, 0.94, 1.0);
        mat4FromTRS(this.modelMat, fn.x, 0.18, fn.z, 0, 0, 0, fn.radius * 0.86, 0.22, fn.radius * 0.86);
        this.drawMesh(this.cylVAO, this.modelMat, 0, 0.08, 0.18, 0.34, 1.0);
        // Spinning fan blades (3 beams)
        for (let bIdx = 0; bIdx < 3; bIdx++) {
          const ang = fn.angle + (bIdx * Math.PI * 2) / 3;
          const ca = Math.cos(ang);
          const sa = Math.sin(ang);
          const rLen = fn.radius * 0.8;
          mat4AlignBeam(this.modelMat, fn.x - ca * rLen, 0.28, fn.z - sa * rLen, fn.x + ca * rLen, 0.28, fn.z + sa * rLen, 0.18);
          this.drawMesh(this.cylVAO, this.modelMat, 0, 0.68, 0.95, 1.0, 1.0);
        }
        // Rising translucent air rings
        for (let ring = 0; ring < 5; ring++) {
          const phase = ((timeSec * 1.4 + ring * 0.2) % 1.0);
          const ry = 0.4 + phase * 9.5;
          const rr = fn.radius * (0.72 + phase * 0.26);
          mat4FromTRS(this.modelMat, fn.x, ry, fn.z, Math.PI * 0.5, 0, timeSec * 3.0 + ring, rr, rr, rr);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, 0.55, 0.94, 1.0, (1 - phase) * 0.45);
        }
      }

      // Tall 3D Green/Red/Yellow Man, Hulking Obtuse Man, Boss, Survival Thieves & Celestial 3D Golden Man
      if (w.greenMan && w.greenMan.active) {
        this.drawGreenMan(w.greenMan);
      }
      if (w.obtuseMan && w.obtuseMan.active) {
        this.drawObtuseMan(w.obtuseMan);
      }
      if (w.boss && w.boss.active) {
        this.drawBossObtuseMan(w.boss);
      }
      if (w.survival && w.survival.active) {
        for (const th of w.survival.thieves) {
          this.drawSurvivalThief(th);
        }
      }
      if (w.goldenMan && w.goldenMan.active) {
        this.drawGoldenMan(w.goldenMan);
      }

      // 2. Planar 3D Gummy Bear Shadows on Floor
      gl.useProgram(this.bearProg);
      gl.uniformMatrix4fv(this.bearLocs.uViewProj, false, this.viewProjMat);
      gl.uniform3fv(this.bearLocs.uRestNodes, this.restNodesFlat);
      gl.uniform1f(this.bearLocs.uNeonMode, this.neonMode ? 1.0 : 0.0);
      gl.bindVertexArray(this.bearVAO);

      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      gl.uniform1i(this.bearLocs.uShadowPass, 1);
      for (const b of w.bears) {
        gl.uniform3fv(this.bearLocs.uNodes, b.gpuNodes);
        gl.uniformMatrix3fv(this.bearLocs.uBearRot, false, b.rotMat);
        gl.uniform1f(this.bearLocs.uScale, b.scale);
        gl.uniform1f(this.bearLocs.uBellyBulge, b.bellyBulge || 0);
        gl.uniform1f(this.bearLocs.uCheeky, b.cheekyAmount || 0);
        gl.uniform1f(this.bearLocs.uIsGhost, b.flavor.isGhost ? 1.0 : 0.0);
        gl.drawElements(gl.TRIANGLES, this.bearIndexCount, gl.UNSIGNED_INT, 0);
      }
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);

      // 3. Back-to-Front Sorted 3D Translucent Soft-Body Gummy Bears
      const sortedBears = [...w.bears].sort((a, b) => {
        const da = (a.cx - this.cam.eye[0]) ** 2 + (a.cy - this.cam.eye[1]) ** 2 + (a.cz - this.cam.eye[2]) ** 2;
        const db = (b.cx - this.cam.eye[0]) ** 2 + (b.cy - this.cam.eye[1]) ** 2 + (b.cz - this.cam.eye[2]) ** 2;
        return db - da;
      });

      gl.uniform1i(this.bearLocs.uShadowPass, 0);
      gl.uniform3fv(this.bearLocs.uCamPos, this.cam.eye);
      gl.uniform1f(this.bearLocs.uSugarCoat, w.sugarCoat ? 1.0 : 0.0);

      for (const b of sortedBears) {
        gl.uniform3fv(this.bearLocs.uNodes, b.gpuNodes);
        gl.uniformMatrix3fv(this.bearLocs.uBearRot, false, b.rotMat);
        gl.uniform1f(this.bearLocs.uScale, b.scale);
        gl.uniform3fv(this.bearLocs.uFlavorRgb, b.flavor.rgb);
        gl.uniform3fv(this.bearLocs.uCoreRgb, b.flavor.coreRgb);
        gl.uniform1f(this.bearLocs.uFrozen, b.frozen);
        gl.uniform1f(this.bearLocs.uIsGold, b.flavor.isGold ? 1.0 : 0.0);
        gl.uniform1f(this.bearLocs.uIsWhite, b.flavor.isWhite ? 1.0 : 0.0);
        gl.uniform1f(this.bearLocs.uBellyBulge, b.bellyBulge || 0);
        gl.uniform1f(this.bearLocs.uCheeky, b.cheekyAmount || 0);
        gl.uniform1f(this.bearLocs.uHeat, b.heat || 0);
        gl.uniform1f(this.bearLocs.uIsGhost, b.flavor.isGhost ? 1.0 : 0.0);
        gl.uniform1f(this.bearLocs.uMegaLevel, b.megaLevel || 0);
        gl.drawElements(gl.TRIANGLES, this.bearIndexCount, gl.UNSIGNED_INT, 0);
      }

      // 4. Interactive 3D Tool Visuals, Golden Blessing Sunbeam, Suspect Ring, Slingshot Arc, Tornado, Magnet, Shockwaves & Particles
      gl.useProgram(this.stageProg);

      // Golden Man Celestial Sunbeam Pillar & Floating 24K Halo
      if (w.goldenMan && w.goldenMan.active) {
        const gm = w.goldenMan;
        const hoverBob = Math.sin(gm.animTime * 3.2) * 0.16;
        const heightFade = Math.max(0, Math.min(1, (17.5 - gm.y) / 6.0));
        if (heightFade > 0.02) {
          gl.depthMask(false);
          mat4AlignBeam(this.modelMat, gm.x, 0.03, gm.z, gm.x, 22.0, gm.z, 2.05);
          this.drawMesh(this.cylVAO, this.modelMat, 4, 1.0, 0.88, 0.35, 0.12 * heightFade);
          gl.depthMask(true);

          const floorR = 2.15 + Math.sin(timeSec * 4.5) * 0.14;
          mat4FromTRS(this.modelMat, gm.x, 0.06, gm.z, Math.PI * 0.5, timeSec * 1.2, 0, floorR, floorR, floorR);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.82, 0.18, 0.72 * heightFade);
        }
        // Floating 3D Golden Halo above his head
        mat4FromTRS(this.modelMat, gm.x, gm.y + 5.42 + hoverBob, gm.z, Math.PI * 0.5 + 0.10, timeSec * 1.8, 0, 0.62, 0.62, 0.62);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.88, 0.24, 0.96);
      }

      // Traitor Mode Suspect Spotlight Ring underneath the currently suspected bear
      if (w.traitorMode && w.suspectBear && !w.suspectBear.isStolen) {
        const sb = w.suspectBear;
        const sr = (1.05 + Math.sin(timeSec * 6.0) * 0.09) * sb.scale;
        mat4FromTRS(this.modelMat, sb.cx, 0.08, sb.cz, Math.PI * 0.5, timeSec * 1.8, 0, sr, sr, sr);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 0.65, 0.18, 0.98, 0.92);
        mat4FromTRS(this.modelMat, sb.cx, 0.07, sb.cz, Math.PI * 0.5, -timeSec * 1.4, 0, sr * 1.24, sr * 1.24, sr * 1.24);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 0.85, 0.52, 1.0, 0.55);
      }

      // Hardcore Mode Click-Target Reticle Ring beneath the Red Man
      if (w.isRedManClickable && w.isRedManClickable()) {
        const gm = w.greenMan;
        const tr = 1.45 + Math.sin(timeSec * 12.0) * 0.16;
        mat4FromTRS(this.modelMat, gm.x, 0.08, gm.z, Math.PI * 0.5, timeSec * 3.2, 0, tr, tr, tr);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.22, 0.24, 0.92);
        mat4FromTRS(this.modelMat, gm.x, 0.09, gm.z, Math.PI * 0.5, -timeSec * 2.6, 0, tr * 0.68, tr * 0.68, tr * 0.68);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.86, 0.18, 0.78);
      }

      // 3D Grab Tether
      if (w.grab) {
        const g = w.grab;
        const n = g.bear.nodes[g.nodeIndex];
        const col = g.bear.flavor.rgb;
        mat4AlignBeam(this.modelMat, n.x, n.y, n.z, g.x, g.y, g.z, 0.055);
        this.drawMesh(this.cylVAO, this.modelMat, 3, col[0], col[1], col[2], 0.85);
        mat4FromTRS(this.modelMat, g.x, g.y, g.z, 0, 0, 0, 0.16, 0.16, 0.16);
        this.drawMesh(this.sphereVAO, this.modelMat, 0, 1, 1, 1, 0.95);
      }

      // 3D Slingshot Bands + 3D Trajectory Preview Spheres
      if (w.slingshot) {
        const s = w.slingshot;
        const col = s.bear.flavor.rgb;
        const spread = 0.55;
        mat4AlignBeam(this.modelMat, s.anchorX - spread, s.anchorY, s.anchorZ, s.bear.cx - spread * 0.4, s.bear.cy, s.bear.cz, 0.065);
        this.drawMesh(this.cylVAO, this.modelMat, 0, col[0], col[1], col[2], 0.92);
        mat4AlignBeam(this.modelMat, s.anchorX + spread, s.anchorY, s.anchorZ, s.bear.cx + spread * 0.4, s.bear.cy, s.bear.cz, 0.065);
        this.drawMesh(this.cylVAO, this.modelMat, 0, col[0], col[1], col[2], 0.92);

        const { vx, vy, vz, power } = w.getSlingshotVelocity();
        if (power >= 0.06) {
          const grav = w.baseGravity * w.gravityScale;
          for (let i = 1; i <= 18; i++) {
            const t = i * 0.055;
            const px = s.pullX + vx * t;
            const py = s.pullY + vy * t + 0.5 * grav * t * t;
            const pz = s.pullZ + vz * t;
            if (py < 0.05) break;
            const rad = 0.13 * (1 - i / 24);
            mat4FromTRS(this.modelMat, px, py, pz, 0, 0, 0, rad, rad, rad);
            this.drawMesh(this.sphereVAO, this.modelMat, 3, 0.58, 0.25, 1.0, 0.85 - i * 0.038);
          }
        }
      }

      // Active 3D Field Tool FX (Vortex Tornado, Magnet Orb, Puff Ray, Cryo Ray)
      if (w.activeField) {
        const fld = w.activeField;
        if (fld.type === 'vortex') {
          for (let ring = 0; ring < 8; ring++) {
            const ry = 0.45 + ring * 1.15;
            const rr = 0.65 + ring * 0.34 + Math.sin(timeSec * 8 + ring) * 0.1;
            const wobX = Math.cos(timeSec * 6 + ring * 0.8) * 0.18;
            const wobZ = Math.sin(timeSec * 6 + ring * 0.8) * 0.18;
            mat4FromTRS(this.modelMat, fld.x + wobX, ry, fld.z + wobZ, Math.PI * 0.5, 0, timeSec * 5 + ring, rr, rr, rr);
            this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.42, 0.86, 0.62 - ring * 0.05);
          }
        } else if (fld.type === 'magnet') {
          const my = fld.y + 3.0;
          const pulse = 0.72 + Math.sin(timeSec * 12) * 0.12;
          mat4FromTRS(this.modelMat, fld.x, my, fld.z, 0, timeSec * 3, 0, pulse, pulse, pulse);
          this.drawMesh(this.sphereVAO, this.modelMat, 0, 0.65, 0.15, 1.0, 0.92);
          mat4FromTRS(this.modelMat, fld.x, my, fld.z, timeSec * 2.5, timeSec * 1.8, 0, pulse * 1.9, pulse * 1.9, pulse * 1.9);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.35, 0.92, 0.75);
        } else if (fld.type === 'cryo') {
          const r = 2.2 + Math.sin(timeSec * 10) * 0.2;
          mat4FromTRS(this.modelMat, fld.x, 0.18, fld.z, Math.PI * 0.5, 0, 0, r, r, r);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, 0.35, 0.88, 1.0, 0.78);
        } else if (fld.type === 'puff') {
          const r = 2.0 + Math.sin(timeSec * 10) * 0.25;
          const col = fld.shrink ? [1.0, 0.55, 0.12] : [0.25, 0.92, 0.58];
          mat4FromTRS(this.modelMat, fld.x, 0.18, fld.z, Math.PI * 0.5, 0, 0, r, r, r);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, col[0], col[1], col[2], 0.78);
        } else if (fld.type === 'heat') {
          const r = 2.1 + Math.sin(timeSec * 16) * 0.24;
          mat4FromTRS(this.modelMat, fld.x, 0.18, fld.z, Math.PI * 0.5, 0, 0, r, r, r);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.34, 0.06, 0.92);
          mat4AlignBeam(this.modelMat, fld.x, 0.12, fld.z, fld.x, 8.5, fld.z, 0.18 + Math.sin(timeSec * 24) * 0.04);
          this.drawMesh(this.cylVAO, this.modelMat, 4, 1.0, 0.45, 0.08, 0.45);
        }
      }

      // 3D Portals (Portal Gun)
      if (w.portals) {
        const drawPortal = (p, col1, col2) => {
          if (!p) return;
          const r = p.radius * (1 + p.pulse * 0.18);
          mat4FromTRS(this.modelMat, p.x, p.y, p.z, 0, timeSec * 1.4, 0, r, r, r);
          this.drawMesh(this.hoopVAO, this.modelMat, 3, col1[0], col1[1], col1[2], 0.95);
          mat4FromTRS(this.modelMat, p.x, p.y, p.z, 0, -timeSec * 2.8, 0, r * 0.72, r * 0.72, r * 0.72);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, col2[0], col2[1], col2[2], 0.78);
          mat4FromTRS(this.modelMat, p.x, p.y, p.z, Math.PI * 0.5, timeSec * 2.2, 0, r * 0.45, r * 0.45, r * 0.45);
          this.drawMesh(this.thinRingVAO, this.modelMat, 3, col1[0], col1[1], col1[2], 0.55);
        };
        drawPortal(w.portals.a, [0.10, 0.85, 1.0], [0.65, 0.98, 1.0]);
        drawPortal(w.portals.b, [1.0, 0.45, 0.06], [1.0, 0.85, 0.32]);
      }

      // 3D Bear Hats & Wall Glue Blobs
      const hatId = w.selectedHat || 'none';
      for (const b of w.bears) {
        if (hatId !== 'none') {
          this.drawBearHat(b, hatId, timeSec);
        }
        if (b.glued) {
          mat4FromTRS(this.modelMat, b.glued.x, b.glued.y, b.glued.z, 0, 0, 0, 0.42 * b.scale, 0.42 * b.scale, 0.42 * b.scale);
          this.drawMesh(this.sphereVAO, this.modelMat, 3, 1.0, 0.48, 0.82, 0.72);
        }
      }

      // Boss Fight Arena Danger Ring
      if (w.boss && w.boss.active) {
        const bs = w.boss;
        const br = 2.35 + Math.sin(timeSec * 8) * 0.16;
        mat4FromTRS(this.modelMat, bs.x, 0.08, bs.z, Math.PI * 0.5, timeSec * 2.0, 0, br, br, br);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 1.0, 0.18, 0.24, 0.88);
      }

      // Expanding 3D Shockwave Rings
      for (const sw of w.shockwaves) {
        mat4FromTRS(this.modelMat, sw.x, sw.y, sw.z, Math.PI * 0.5, 0, 0, sw.r, sw.r, sw.r);
        this.drawMesh(this.thinRingVAO, this.modelMat, 3, 0.68, 0.28, 1.0, sw.alpha * 0.75);
      }

      // 3D Sugar & Ice Crystal Particles
      for (const p of w.particles) {
        const s = p.size * Math.min(1, p.life * 1.4);
        mat4FromTRS(this.modelMat, p.x, p.y, p.z, p.life * 6, p.life * 4, 0, s, s, s);
        this.drawMesh(this.sphereVAO, this.modelMat, 3, p.r, p.g, p.b, Math.min(1, p.life));
      }
    }
  }

  window.GummyApp = window.GummyApp || {};
  window.GummyApp.GummyRenderer3D = GummyRenderer3D;
})();
