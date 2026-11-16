(() => {
  'use strict';

  function smin(a, b, k) {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  }

  function smax(a, b, k) {
    return -smin(-a, -b, k);
  }

  function sdEllipsoid(px, py, pz, cx, cy, cz, rx, ry, rz) {
    const x = (px - cx) / rx;
    const y = (py - cy) / ry;
    const z = (pz - cz) / rz;
    const k0 = Math.hypot(x, y, z);
    if (k0 < 1e-6) return -Math.min(rx, ry, rz);
    const k1 = Math.hypot(x / rx, y / ry, z / rz);
    return (k0 * (k0 - 1)) / k1;
  }

  function sdCapsule(px, py, pz, ax, ay, az, bx, by, bz, r) {
    const pax = px - ax;
    const pay = py - ay;
    const paz = pz - az;
    const bax = bx - ax;
    const bay = by - ay;
    const baz = bz - az;
    const denom = bax * bax + bay * bay + baz * baz;
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / denom));
    return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r;
  }

  // Sculpted 3D Haribo-style plump Gummy Bear Signed Distance Field
  // Bear spans approx X: [-0.78, 0.78], Y: [-1.02, 1.14], Z: [-0.48, 0.60]
  function gummyBearSDF(x, y, z) {
    const ax = Math.abs(x); // Symmetrical left/right

    // Head + plump cheeks
    let d = sdEllipsoid(x, y, z, 0, 0.56, 0.01, 0.45, 0.39, 0.38);
    const cheeks = sdEllipsoid(ax, y, z, 0.22, 0.46, 0.10, 0.27, 0.22, 0.26);
    d = smin(d, cheeks, 0.12);

    // Muzzle / snout
    const snout = sdEllipsoid(x, y, z, 0, 0.47, 0.34, 0.20, 0.15, 0.16);
    d = smin(d, snout, 0.09);

    // Cupped round teddy ears
    let ears = sdEllipsoid(ax, y, z, 0.35, 0.91, -0.02, 0.185, 0.185, 0.125);
    const earCup = sdEllipsoid(ax, y, z, 0.35, 0.91, 0.095, 0.095, 0.095, 0.075);
    ears = smax(ears, -earCup, 0.045);
    d = smin(d, ears, 0.075);

    // Upper chest & plump pear-shaped gummy belly
    const chest = sdEllipsoid(x, y, z, 0, 0.12, 0.0, 0.37, 0.27, 0.31);
    d = smin(d, chest, 0.13);

    const belly = sdEllipsoid(x, y, z, 0, -0.28, 0.03, 0.49, 0.43, 0.40);
    d = smin(d, belly, 0.16);

    // Molded gummy tummy cushion ridge on front
    const tummyPad = sdEllipsoid(x, y, z, 0, -0.25, 0.36, 0.29, 0.27, 0.12);
    d = smin(d, tummyPad, 0.09);

    // Big plump 3D gummy butt cheeks on the back (-Z) with center cleft
    let buttCheeks = sdEllipsoid(ax, y, z, 0.23, -0.42, -0.37, 0.30, 0.28, 0.31);
    const buttCleft = sdCapsule(x, y, z, 0.0, -0.20, -0.66, 0.0, -0.64, -0.58, 0.09);
    buttCheeks = smax(buttCheeks, -buttCleft, 0.04);
    d = smin(d, buttCheeks, 0.085);

    // Chubby forward-reaching gummy arms & paws
    const arm = sdCapsule(ax, y, z, 0.35, 0.09, 0.02, 0.56, 0.01, 0.29, 0.145);
    const paw = sdEllipsoid(ax, y, z, 0.57, 0.01, 0.32, 0.16, 0.155, 0.155);
    d = smin(d, smin(arm, paw, 0.07), 0.09);

    // Stubby forward-facing sitting/standing gummy feet & round soles
    const leg = sdCapsule(ax, y, z, 0.26, -0.56, 0.02, 0.30, -0.76, 0.33, 0.175);
    const sole = sdEllipsoid(ax, y, z, 0.30, -0.75, 0.39, 0.185, 0.195, 0.13);
    d = smin(d, smin(leg, sole, 0.07), 0.095);

    return d;
  }

  function evalSDFGradient(x, y, z, out) {
    const eps = 0.004;
    const dx = gummyBearSDF(x + eps, y, z) - gummyBearSDF(x - eps, y, z);
    const dy = gummyBearSDF(x, y + eps, z) - gummyBearSDF(x, y - eps, z);
    const dz = gummyBearSDF(x, y, z + eps) - gummyBearSDF(x, y, z - eps);
    const len = Math.hypot(dx, dy, dz) || 1;
    out[0] = dx / len;
    out[1] = dy / len;
    out[2] = dz / len;
    return len / (2 * eps);
  }

  // 15 3D Soft-Body Physics Rig Nodes (raw coordinates matching gummyBearSDF)
  const RAW_NODES_3D = [
    { name: 'core',       x:  0.00, y: -0.18, z:  0.02, r: 0.34, m: 1.70 }, // 0
    { name: 'chest',      x:  0.00, y:  0.16, z:  0.01, r: 0.29, m: 1.30 }, // 1
    { name: 'head',       x:  0.00, y:  0.56, z:  0.02, r: 0.33, m: 1.40 }, // 2
    { name: 'snout',      x:  0.00, y:  0.48, z:  0.34, r: 0.17, m: 0.65 }, // 3
    { name: 'earL',       x: -0.36, y:  0.91, z: -0.02, r: 0.18, m: 0.60 }, // 4
    { name: 'earR',       x:  0.36, y:  0.91, z: -0.02, r: 0.18, m: 0.60 }, // 5
    { name: 'armL',       x: -0.56, y:  0.01, z:  0.28, r: 0.18, m: 0.75 }, // 6
    { name: 'armR',       x:  0.56, y:  0.01, z:  0.28, r: 0.18, m: 0.75 }, // 7
    { name: 'hipL',       x: -0.34, y: -0.34, z: -0.04, r: 0.25, m: 0.95 }, // 8
    { name: 'hipR',       x:  0.34, y: -0.34, z: -0.04, r: 0.25, m: 0.95 }, // 9
    { name: 'footL',      x: -0.30, y: -0.76, z:  0.34, r: 0.21, m: 0.85 }, // 10
    { name: 'footR',      x:  0.30, y: -0.76, z:  0.34, r: 0.21, m: 0.85 }, // 11
    { name: 'bellyFront', x:  0.00, y: -0.26, z:  0.34, r: 0.24, m: 0.85 }, // 12
    { name: 'back',       x:  0.00, y:  0.02, z: -0.28, r: 0.24, m: 0.85 }, // 13
    { name: 'cheekL',     x: -0.30, y:  0.52, z:  0.06, r: 0.20, m: 0.70 }, // 14
    { name: 'cheekR',     x:  0.30, y:  0.52, z:  0.06, r: 0.20, m: 0.70 }, // 15
    { name: 'buttL',      x: -0.24, y: -0.42, z: -0.44, r: 0.26, m: 0.90 }, // 16
    { name: 'buttR',      x:  0.24, y: -0.42, z: -0.44, r: 0.26, m: 0.90 }  // 17
  ];

  // Notice 16 perfectly symmetric nodes so X-centroid is identically 0!
  let totalM = 0;
  let cx0 = 0;
  let cy0 = 0;
  let cz0 = 0;
  for (const n of RAW_NODES_3D) {
    totalM += n.m;
    cx0 += n.x * n.m;
    cy0 += n.y * n.m;
    cz0 += n.z * n.m;
  }
  cx0 /= totalM;
  cy0 /= totalM;
  cz0 /= totalM;

  const REST_NODES_3D = RAW_NODES_3D.map((n) => ({
    name: n.name,
    rx: n.x - cx0,
    ry: n.y - cy0,
    rz: n.z - cz0,
    r: n.r,
    m: n.m
  }));

  function computeTop4Weights(px, py, pz) {
    const scored = REST_NODES_3D.map((n, idx) => {
      const dx = px - n.rx;
      const dy = py - n.ry;
      const dz = pz - n.rz;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz + 0.022);
      return { idx, w: 1 / (d * d * d * Math.sqrt(d)) };
    });
    scored.sort((a, b) => b.w - a.w);
    const top4 = scored.slice(0, 4);
    const sum = top4[0].w + top4[1].w + top4[2].w + top4[3].w;
    return {
      joints: [top4[0].idx, top4[1].idx, top4[2].idx, top4[3].idx],
      weights: [top4[0].w / sum, top4[1].w / sum, top4[2].w / sum, top4[3].w / sum]
    };
  }

  // Append small 3D UV-ellipsoid (for glossy eyes, button nose & cheeky traitor expression)
  function appendEllipsoid(posArr, normArr, partArr, cx, cy, cz, rx, ry, rz, rings, slices, partId, tiltZ = 0) {
    const baseVert = posArr.length / 3;
    const indices = [];
    const ct = Math.cos(tiltZ);
    const st = Math.sin(tiltZ);
    for (let i = 0; i <= rings; i++) {
      const v = i / rings;
      const phi = v * Math.PI;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      for (let j = 0; j <= slices; j++) {
        const u = j / slices;
        const theta = u * Math.PI * 2;
        const nx = sinP * Math.cos(theta);
        const ny = cosP;
        const nz = sinP * Math.sin(theta);

        const lx = nx * rx;
        const ly = ny * ry;
        const lz = nz * rz;
        const rxp = lx * ct - ly * st;
        const ryp = lx * st + ly * ct;

        posArr.push(cx + rxp - cx0, cy + ryp - cy0, cz + lz - cz0);
        const gx = nx / rx;
        const gy = ny / ry;
        const gz = nz / rz;
        const rgx = gx * ct - gy * st;
        const rgy = gx * st + gy * ct;
        const invLen = 1 / (Math.hypot(rgx, rgy, gz) || 1);
        normArr.push(rgx * invLen, rgy * invLen, gz * invLen);
        partArr.push(partId);
      }
    }
    const stride = slices + 1;
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < slices; j++) {
        const a = baseVert + i * stride + j;
        const b = a + stride;
        const c = b + 1;
        const d = a + 1;
        indices.push(a, d, b, b, d, c);
      }
    }
    return indices;
  }

  // Surface Nets Isosurface Extraction + Analytical Normal Snap
  function buildGummyBearMesh() {
    const minX = -0.84;
    const maxX = 0.84;
    const minY = -1.06;
    const maxY = 1.18;
    const minZ = -0.78;
    const maxZ = 0.66;

    const nx = 32;
    const ny = 42;
    const nz = 28;
    const sx = (maxX - minX) / (nx - 1);
    const sy = (maxY - minY) / (ny - 1);
    const sz = (maxZ - minZ) / (nz - 1);

    const grid = new Float32Array(nx * ny * nz);
    const gIdx = (x, y, z) => x + nx * (y + ny * z);

    for (let z = 0; z < nz; z++) {
      const pz = minZ + z * sz;
      for (let y = 0; y < ny; y++) {
        const py = minY + y * sy;
        for (let x = 0; x < nx; x++) {
          const px = minX + x * sx;
          grid[gIdx(x, y, z)] = gummyBearSDF(px, py, pz);
        }
      }
    }

    const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
    const cIdx = (x, y, z) => x + (nx - 1) * (y + (ny - 1) * z);

    const positions = [];
    const normals = [];
    const parts = [];
    const indices = [];

    const cubeEdges = [
      [0, 1], [2, 3], [4, 5], [6, 7],
      [0, 2], [1, 3], [4, 6], [5, 7],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    const cornerOffsets = [
      [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
      [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]
    ];

    const gradTmp = [0, 0, 0];
    const cornerVals = new Float32Array(8);
    const cornerPos = Array.from({ length: 8 }, () => [0, 0, 0]);

    for (let z = 0; z < nz - 1; z++) {
      for (let y = 0; y < ny - 1; y++) {
        for (let x = 0; x < nx - 1; x++) {
          let mask = 0;
          for (let c = 0; c < 8; c++) {
            const ox = cornerOffsets[c][0];
            const oy = cornerOffsets[c][1];
            const oz = cornerOffsets[c][2];
            const val = grid[gIdx(x + ox, y + oy, z + oz)];
            cornerVals[c] = val;
            cornerPos[c][0] = minX + (x + ox) * sx;
            cornerPos[c][1] = minY + (y + oy) * sy;
            cornerPos[c][2] = minZ + (z + oz) * sz;
            if (val < 0) mask |= (1 << c);
          }
          if (mask === 0 || mask === 255) continue;

          let vx = 0;
          let vy = 0;
          let vz = 0;
          let crossings = 0;
          for (let e = 0; e < 12; e++) {
            const c0 = cubeEdges[e][0];
            const c1 = cubeEdges[e][1];
            const v0 = cornerVals[c0];
            const v1 = cornerVals[c1];
            if ((v0 < 0) === (v1 < 0)) continue;
            const t = v0 / (v0 - v1);
            vx += cornerPos[c0][0] + (cornerPos[c1][0] - cornerPos[c0][0]) * t;
            vy += cornerPos[c0][1] + (cornerPos[c1][1] - cornerPos[c0][1]) * t;
            vz += cornerPos[c0][2] + (cornerPos[c1][2] - cornerPos[c0][2]) * t;
            crossings++;
          }
          vx /= crossings;
          vy /= crossings;
          vz /= crossings;

          // Snap vertex onto exact smooth SDF zero-level set via 2 Newton steps
          for (let it = 0; it < 2; it++) {
            const f = gummyBearSDF(vx, vy, vz);
            const gMag = evalSDFGradient(vx, vy, vz, gradTmp);
            const step = Math.max(-0.04, Math.min(0.04, f / Math.max(0.25, gMag)));
            vx -= gradTmp[0] * step;
            vy -= gradTmp[1] * step;
            vz -= gradTmp[2] * step;
          }
          evalSDFGradient(vx, vy, vz, gradTmp);

          const vertId = positions.length / 3;
          cellVert[cIdx(x, y, z)] = vertId;
          positions.push(vx - cx0, vy - cy0, vz - cz0);
          normals.push(gradTmp[0], gradTmp[1], gradTmp[2]);
          parts.push(0); // 0 = Translucent gelatin body
        }
      }
    }

    function emitQuad(v0, v1, v2, v3, flip) {
      if (v0 < 0 || v1 < 0 || v2 < 0 || v3 < 0) return;
      if (!flip) {
        indices.push(v0, v1, v2, v0, v2, v3);
      } else {
        indices.push(v0, v2, v1, v0, v3, v2);
      }
    }

    // Connect quads across sign-changing interior grid edges
    for (let z = 1; z < nz - 1; z++) {
      for (let y = 1; y < ny - 1; y++) {
        for (let x = 1; x < nx - 1; x++) {
          const s0 = grid[gIdx(x, y, z)] < 0;

          // +X edge at (x..x+1, y, z)
          const sx1 = grid[gIdx(x + 1, y, z)] < 0;
          if (s0 !== sx1) {
            emitQuad(
              cellVert[cIdx(x, y - 1, z - 1)],
              cellVert[cIdx(x, y, z - 1)],
              cellVert[cIdx(x, y, z)],
              cellVert[cIdx(x, y - 1, z)],
              !s0
            );
          }

          // +Y edge at (x, y..y+1, z)
          const sy1 = grid[gIdx(x, y + 1, z)] < 0;
          if (s0 !== sy1) {
            emitQuad(
              cellVert[cIdx(x - 1, y, z - 1)],
              cellVert[cIdx(x - 1, y, z)],
              cellVert[cIdx(x, y, z)],
              cellVert[cIdx(x, y, z - 1)],
              !s0
            );
          }

          // +Z edge at (x, y, z..z+1)
          const sz1 = grid[gIdx(x, y, z + 1)] < 0;
          if (s0 !== sz1) {
            emitQuad(
              cellVert[cIdx(x - 1, y - 1, z)],
              cellVert[cIdx(x, y - 1, z)],
              cellVert[cIdx(x, y, z)],
              cellVert[cIdx(x - 1, y, z)],
              !s0
            );
          }
        }
      }
    }

    // Add cute glossy 3D bead eyes & candy nose (partId = 1)
    indices.push(...appendEllipsoid(positions, normals, parts, -0.165, 0.62, 0.365, 0.052, 0.058, 0.045, 7, 10, 1));
    indices.push(...appendEllipsoid(positions, normals, parts,  0.165, 0.62, 0.365, 0.052, 0.058, 0.045, 7, 10, 1));
    indices.push(...appendEllipsoid(positions, normals, parts,  0.000, 0.515, 0.485, 0.064, 0.044, 0.042, 7, 10, 1));

    // Subtle Traitor Mode cheeky smirk & sly angled brows (partId = 2, hidden unless uCheeky > 0)
    indices.push(...appendEllipsoid(positions, normals, parts, -0.172, 0.702, 0.355, 0.070, 0.020, 0.032, 6, 8, 2, -0.25));
    indices.push(...appendEllipsoid(positions, normals, parts,  0.172, 0.718, 0.355, 0.072, 0.020, 0.032, 6, 8, 2,  0.22));
    indices.push(...appendEllipsoid(positions, normals, parts, -0.042, 0.416, 0.476, 0.072, 0.021, 0.034, 6, 8, 2,  0.12));
    indices.push(...appendEllipsoid(positions, normals, parts,  0.082, 0.444, 0.448, 0.072, 0.022, 0.034, 6, 8, 2,  0.40));

    const vertCount = positions.length / 3;
    const joints = new Float32Array(vertCount * 4);
    const weights = new Float32Array(vertCount * 4);

    for (let i = 0; i < vertCount; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];
      const skin = computeTop4Weights(px, py, pz);
      for (let k = 0; k < 4; k++) {
        joints[i * 4 + k] = skin.joints[k];
        weights[i * 4 + k] = skin.weights[k];
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      parts: new Float32Array(parts),
      joints,
      weights,
      indices: new Uint32Array(indices),
      vertexCount: vertCount,
      indexCount: indices.length
    };
  }

  // Helper procedural 3D primitives for hoops, trampoline, sweeper, orbs & confetti
  function buildTorusMesh(majorR = 1.0, minorR = 0.13, majorSeg = 36, minorSeg = 14) {
    const pos = [];
    const norm = [];
    const uv = [];
    const idx = [];
    for (let i = 0; i <= majorSeg; i++) {
      const u = (i / majorSeg) * Math.PI * 2;
      const cu = Math.cos(u);
      const su = Math.sin(u);
      for (let j = 0; j <= minorSeg; j++) {
        const v = (j / minorSeg) * Math.PI * 2;
        const cv = Math.cos(v);
        const sv = Math.sin(v);
        const nx = cu * cv;
        const ny = su * cv;
        const nz = sv;
        pos.push((majorR + minorR * cv) * cu, (majorR + minorR * cv) * su, minorR * sv);
        norm.push(nx, ny, nz);
        uv.push(i / majorSeg, j / minorSeg);
      }
    }
    const stride = minorSeg + 1;
    for (let i = 0; i < majorSeg; i++) {
      for (let j = 0; j < minorSeg; j++) {
        const a = i * stride + j;
        const b = a + stride;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      uvs: new Float32Array(uv),
      indices: new Uint16Array(idx)
    };
  }

  function buildCylinderMesh(rTop = 1, rBot = 1, height = 1, seg = 28) {
    const pos = [];
    const norm = [];
    const uv = [];
    const idx = [];
    const halfH = height * 0.5;

    // Side wall
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;
      const ang = u * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      pos.push(c * rTop, halfH, s * rTop);
      norm.push(c, 0, s);
      uv.push(u, 1);

      pos.push(c * rBot, -halfH, s * rBot);
      norm.push(c, 0, s);
      uv.push(u, 0);
    }
    for (let i = 0; i < seg; i++) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }

    // Top cap
    const topCenter = pos.length / 3;
    pos.push(0, halfH, 0);
    norm.push(0, 1, 0);
    uv.push(0.5, 0.5);
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;
      const ang = u * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      pos.push(c * rTop, halfH, s * rTop);
      norm.push(0, 1, 0);
      uv.push(0.5 + c * 0.5, 0.5 + s * 0.5);
    }
    for (let i = 0; i < seg; i++) {
      idx.push(topCenter, topCenter + 1 + i + 1, topCenter + 1 + i);
    }

    // Bottom cap
    const botCenter = pos.length / 3;
    pos.push(0, -halfH, 0);
    norm.push(0, -1, 0);
    uv.push(0.5, 0.5);
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;
      const ang = u * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      pos.push(c * rBot, -halfH, s * rBot);
      norm.push(0, -1, 0);
      uv.push(0.5 + c * 0.5, 0.5 + s * 0.5);
    }
    for (let i = 0; i < seg; i++) {
      idx.push(botCenter, botCenter + 1 + i, botCenter + 1 + i + 1);
    }

    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      uvs: new Float32Array(uv),
      indices: new Uint16Array(idx)
    };
  }

  function buildSphereMesh(radius = 1, rings = 14, slices = 20) {
    const pos = [];
    const norm = [];
    const uv = [];
    const idx = [];
    for (let i = 0; i <= rings; i++) {
      const v = i / rings;
      const phi = v * Math.PI;
      const sp = Math.sin(phi);
      const cp = Math.cos(phi);
      for (let j = 0; j <= slices; j++) {
        const u = j / slices;
        const th = u * Math.PI * 2;
        const nx = sp * Math.cos(th);
        const ny = cp;
        const nz = sp * Math.sin(th);
        pos.push(nx * radius, ny * radius, nz * radius);
        norm.push(nx, ny, nz);
        uv.push(u, v);
      }
    }
    const stride = slices + 1;
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < slices; j++) {
        const a = i * stride + j;
        const b = a + stride;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      uvs: new Float32Array(uv),
      indices: new Uint16Array(idx)
    };
  }

  // =========================================================================
  // Sculpted 3D Athletic Humanoid Bear-Thief (Green / Blue / Red Man)
  // Full anatomical SDF + Surface Nets mesh + 13-bone skeletal skinning
  // =========================================================================
  const THIEF_BONES_3D = [
    { id: 0,  name: 'pelvis',  pivot: [ 0.00, 2.65, 0.00], segA: [-0.26, 2.62, 0.00], segB: [ 0.26, 2.62, 0.00], side:  0 },
    { id: 1,  name: 'chest',   pivot: [ 0.00, 3.15, 0.00], segA: [ 0.00, 3.12, 0.00], segB: [ 0.00, 4.32, 0.00], side:  0 },
    { id: 2,  name: 'head',    pivot: [ 0.00, 4.55, 0.00], segA: [ 0.00, 4.58, 0.00], segB: [ 0.00, 5.52, 0.05], side:  0 },
    { id: 3,  name: 'armL_up', pivot: [-0.74, 4.16, 0.00], segA: [-0.74, 4.16, 0.00], segB: [-1.42, 4.16, 0.00], side: -1 },
    { id: 4,  name: 'armL_lo', pivot: [-1.44, 4.16, 0.00], segA: [-1.44, 4.16, 0.00], segB: [-2.34, 4.16, 0.04], side: -1 },
    { id: 5,  name: 'armR_up', pivot: [ 0.74, 4.16, 0.00], segA: [ 0.74, 4.16, 0.00], segB: [ 1.42, 4.16, 0.00], side:  1 },
    { id: 6,  name: 'armR_lo', pivot: [ 1.44, 4.16, 0.00], segA: [ 1.44, 4.16, 0.00], segB: [ 2.34, 4.16, 0.04], side:  1 },
    { id: 7,  name: 'legL_up', pivot: [-0.38, 2.60, 0.00], segA: [-0.38, 2.50, 0.00], segB: [-0.40, 1.44, 0.00], side: -1 },
    { id: 8,  name: 'legL_lo', pivot: [-0.40, 1.42, 0.00], segA: [-0.40, 1.40, 0.00], segB: [-0.40, 0.30, 0.00], side: -1 },
    { id: 9,  name: 'footL',   pivot: [-0.40, 0.24, 0.00], segA: [-0.40, 0.14,-0.04], segB: [-0.40, 0.12, 0.44], side: -1 },
    { id: 10, name: 'legR_up', pivot: [ 0.38, 2.60, 0.00], segA: [ 0.38, 2.50, 0.00], segB: [ 0.40, 1.44, 0.00], side:  1 },
    { id: 11, name: 'legR_lo', pivot: [ 0.40, 1.42, 0.00], segA: [ 0.40, 1.40, 0.00], segB: [ 0.40, 0.30, 0.00], side:  1 },
    { id: 12, name: 'footR',   pivot: [ 0.40, 0.24, 0.00], segA: [ 0.40, 0.14,-0.04], segB: [ 0.40, 0.12, 0.44], side:  1 }
  ];

  function thiefManSDF(x, y, z) {
    const ax = Math.abs(x);

    // 1. Sculpted Head: cranium, strong jaw/chin, cheekbones, brow ridge, nose & ears
    let head = sdEllipsoid(x, y, z, 0, 5.24, -0.02, 0.38, 0.40, 0.40);
    const jaw = sdEllipsoid(x, y, z, 0, 4.94, 0.08, 0.30, 0.25, 0.30);
    const chin = sdEllipsoid(x, y, z, 0, 4.78, 0.21, 0.15, 0.12, 0.16);
    const cheeks = sdEllipsoid(ax, y, z, 0.21, 5.06, 0.19, 0.18, 0.16, 0.18);
    const brow = sdCapsule(x, y, z, -0.24, 5.30, 0.31, 0.24, 5.30, 0.31, 0.082);
    head = smin(head, jaw, 0.10);
    head = smin(head, chin, 0.08);
    head = smin(head, cheeks, 0.09);
    head = smin(head, brow, 0.06);

    const eyeSocket = sdEllipsoid(ax, y, z, 0.145, 5.18, 0.35, 0.095, 0.08, 0.075);
    head = smax(head, -eyeSocket, 0.035);

    const noseBridge = sdCapsule(x, y, z, 0, 5.22, 0.35, 0, 5.06, 0.46, 0.064);
    const noseTip = sdEllipsoid(x, y, z, 0, 5.05, 0.47, 0.082, 0.065, 0.078);
    const ear = sdEllipsoid(ax, y, z, 0.39, 5.14, -0.02, 0.08, 0.15, 0.11);
    head = smin(head, smin(noseBridge, noseTip, 0.045), 0.05);
    head = smin(head, ear, 0.045);

    // 2. Muscular Neck & Trapezius
    const neck = sdCapsule(x, y, z, 0, 4.38, -0.02, 0, 4.85, 0.02, 0.205);
    const traps = sdCapsule(ax, y, z, 0.14, 4.55, -0.04, 0.58, 4.28, -0.03, 0.185);
    let d = smin(head, smin(neck, traps, 0.09), 0.08);

    // 3. Broad V-Taper Chest, Pectorals, Ribcage, Sculpted Abs, Pelvis & Glutes
    const ribcage = sdEllipsoid(x, y, z, 0, 3.92, -0.02, 0.65, 0.52, 0.39);
    const pecs = sdEllipsoid(ax, y, z, 0.26, 3.98, 0.22, 0.31, 0.24, 0.23);
    const lats = sdEllipsoid(ax, y, z, 0.46, 3.74, -0.06, 0.26, 0.38, 0.28);
    const waist = sdEllipsoid(x, y, z, 0, 3.25, 0.00, 0.47, 0.48, 0.33);
    const absTop = sdEllipsoid(ax, y, z, 0.13, 3.50, 0.28, 0.13, 0.13, 0.10);
    const absBot = sdEllipsoid(ax, y, z, 0.12, 3.18, 0.27, 0.12, 0.14, 0.10);
    const pelvis = sdEllipsoid(x, y, z, 0, 2.66, -0.01, 0.51, 0.36, 0.36);
    const glutes = sdEllipsoid(ax, y, z, 0.23, 2.62, -0.22, 0.27, 0.26, 0.24);

    let torso = smin(ribcage, pecs, 0.09);
    torso = smin(torso, lats, 0.11);
    torso = smin(torso, waist, 0.14);
    torso = smin(torso, smin(absTop, absBot, 0.06), 0.07);
    torso = smin(torso, smin(pelvis, glutes, 0.09), 0.12);
    d = smin(d, torso, 0.09);

    // 4. Muscular Deltoids, Biceps, Forearms & Hands (T-pose along +-X at y = 4.16)
    const deltoid = sdEllipsoid(ax, y, z, 0.74, 4.18, -0.01, 0.28, 0.27, 0.26);
    const upperArm = sdCapsule(ax, y, z, 0.74, 4.16, 0.0, 1.44, 4.16, 0.0, 0.20);
    const bicep = sdEllipsoid(ax, y, z, 1.09, 4.21, 0.07, 0.24, 0.18, 0.18);
    const forearm = sdCapsule(ax, y, z, 1.44, 4.16, 0.0, 2.08, 4.16, 0.02, 0.17);
    const forearmBelly = sdEllipsoid(ax, y, z, 1.66, 4.17, 0.02, 0.22, 0.18, 0.18);
    const palm = sdEllipsoid(ax, y, z, 2.24, 4.16, 0.04, 0.20, 0.13, 0.18);
    const thumb = sdCapsule(ax, y, z, 2.12, 4.17, 0.12, 2.24, 4.19, 0.26, 0.075);

    let arm = smin(deltoid, smin(upperArm, bicep, 0.08), 0.09);
    arm = smin(arm, smin(forearm, forearmBelly, 0.08), 0.08);
    arm = smin(arm, smin(palm, thumb, 0.05), 0.07);
    d = smin(d, arm, 0.09);

    // 5. Muscular Thighs, Knees, Calves & Running Sneakers (cleanly separated at ax = 0.38..0.40)
    const thigh = sdCapsule(ax, y, z, 0.38, 2.60, 0.0, 0.40, 1.42, -0.01, 0.24);
    const quad = sdEllipsoid(ax, y, z, 0.39, 2.04, 0.07, 0.24, 0.44, 0.26);
    const knee = sdEllipsoid(ax, y, z, 0.40, 1.42, 0.05, 0.20, 0.19, 0.21);
    const shin = sdCapsule(ax, y, z, 0.40, 1.42, -0.01, 0.40, 0.25, -0.02, 0.16);
    const calf = sdEllipsoid(ax, y, z, 0.40, 1.02, -0.08, 0.21, 0.32, 0.22);

    let shoe = smin(
      sdEllipsoid(ax, y, z, 0.40, 0.18, 0.02, 0.20, 0.17, 0.24),
      sdEllipsoid(ax, y, z, 0.40, 0.13, 0.24, 0.22, 0.14, 0.30),
      0.09
    );
    shoe = smax(shoe, -y, 0.025); // Crisp flat sneaker sole at y = 0

    let leg = smin(thigh, quad, 0.09);
    leg = smin(leg, knee, 0.08);
    leg = smin(leg, smin(shin, calf, 0.08), 0.08);
    leg = smin(leg, shoe, 0.07);
    d = smin(d, leg, 0.10);

    return d;
  }

  function evalThiefGradient(x, y, z, out) {
    const eps = 0.005;
    const dx = thiefManSDF(x + eps, y, z) - thiefManSDF(x - eps, y, z);
    const dy = thiefManSDF(x, y + eps, z) - thiefManSDF(x, y - eps, z);
    const dz = thiefManSDF(x, y, z + eps) - thiefManSDF(x, y, z - eps);
    const len = Math.hypot(dx, dy, dz) || 1;
    out[0] = dx / len;
    out[1] = dy / len;
    out[2] = dz / len;
    return len / (2 * eps);
  }

  function appendThiefEllipsoid(posArr, normArr, partArr, cx, cy, cz, rx, ry, rz, rings, slices, partId, tiltZ = 0) {
    const baseVert = posArr.length / 3;
    const indices = [];
    const ct = Math.cos(tiltZ);
    const st = Math.sin(tiltZ);
    for (let i = 0; i <= rings; i++) {
      const v = i / rings;
      const phi = v * Math.PI;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      for (let j = 0; j <= slices; j++) {
        const u = j / slices;
        const theta = u * Math.PI * 2;
        const nx = sinP * Math.cos(theta);
        const ny = cosP;
        const nz = sinP * Math.sin(theta);

        const lx = nx * rx;
        const ly = ny * ry;
        const lz = nz * rz;
        const rxp = lx * ct - ly * st;
        const ryp = lx * st + ly * ct;

        posArr.push(cx + rxp, cy + ryp, cz + lz);
        const gx = nx / rx;
        const gy = ny / ry;
        const gz = nz / rz;
        const rgx = gx * ct - gy * st;
        const rgy = gx * st + gy * ct;
        const invLen = 1 / (Math.hypot(rgx, rgy, gz) || 1);
        normArr.push(rgx * invLen, rgy * invLen, gz * invLen);
        partArr.push(partId);
      }
    }
    const stride = slices + 1;
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < slices; j++) {
        const a = baseVert + i * stride + j;
        const b = a + stride;
        const c = b + 1;
        const d = a + 1;
        indices.push(a, d, b, b, d, c);
      }
    }
    return indices;
  }

  function computeThiefBoneWeights(px, py, pz, partId) {
    // Facial feature attachments belong 100% to Head bone (2)
    if (partId >= 0.5) {
      return { joints: [2, 1, 0, 0], weights: [1, 0, 0, 0] };
    }
    const scored = [];
    for (let i = 0; i < THIEF_BONES_3D.length; i++) {
      const b = THIEF_BONES_3D[i];
      // Prevent cross-limb bleeding between left and right legs/arms
      if (b.side < 0 && px > 0.08) continue;
      if (b.side > 0 && px < -0.08) continue;
      const d = sdCapsule(px, py, pz, b.segA[0], b.segA[1], b.segA[2], b.segB[0], b.segB[1], b.segB[2], 0.0);
      const d2 = d * d + 0.026;
      scored.push({ idx: b.id, w: 1 / (d2 * d2 * Math.sqrt(d2)) });
    }
    scored.sort((a, b) => b.w - a.w);
    while (scored.length < 4) scored.push({ idx: 0, w: 0 });
    const top4 = scored.slice(0, 4);
    const sum = (top4[0].w + top4[1].w + top4[2].w + top4[3].w) || 1;
    return {
      joints: [top4[0].idx, top4[1].idx, top4[2].idx, top4[3].idx],
      weights: [top4[0].w / sum, top4[1].w / sum, top4[2].w / sum, top4[3].w / sum]
    };
  }

  function buildThiefManMesh() {
    const minX = -2.56;
    const maxX = 2.56;
    const minY = -0.10;
    const maxY = 5.76;
    const minZ = -0.66;
    const maxZ = 0.76;

    const nx = 58;
    const ny = 66;
    const nz = 22;
    const sx = (maxX - minX) / (nx - 1);
    const sy = (maxY - minY) / (ny - 1);
    const sz = (maxZ - minZ) / (nz - 1);

    const grid = new Float32Array(nx * ny * nz);
    const gIdx = (x, y, z) => x + nx * (y + ny * z);

    for (let z = 0; z < nz; z++) {
      const pz = minZ + z * sz;
      for (let y = 0; y < ny; y++) {
        const py = minY + y * sy;
        for (let x = 0; x < nx; x++) {
          const px = minX + x * sx;
          grid[gIdx(x, y, z)] = thiefManSDF(px, py, pz);
        }
      }
    }

    const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
    const cIdx = (x, y, z) => x + (nx - 1) * (y + (ny - 1) * z);

    const positions = [];
    const normals = [];
    const parts = [];
    const indices = [];

    const cubeEdges = [
      [0, 1], [2, 3], [4, 5], [6, 7],
      [0, 2], [1, 3], [4, 6], [5, 7],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    const cornerOffsets = [
      [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
      [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]
    ];

    const gradTmp = [0, 0, 0];
    const cornerVals = new Float32Array(8);
    const cornerPos = Array.from({ length: 8 }, () => [0, 0, 0]);

    for (let z = 0; z < nz - 1; z++) {
      for (let y = 0; y < ny - 1; y++) {
        for (let x = 0; x < nx - 1; x++) {
          let mask = 0;
          for (let c = 0; c < 8; c++) {
            const ox = cornerOffsets[c][0];
            const oy = cornerOffsets[c][1];
            const oz = cornerOffsets[c][2];
            const val = grid[gIdx(x + ox, y + oy, z + oz)];
            cornerVals[c] = val;
            cornerPos[c][0] = minX + (x + ox) * sx;
            cornerPos[c][1] = minY + (y + oy) * sy;
            cornerPos[c][2] = minZ + (z + oz) * sz;
            if (val < 0) mask |= (1 << c);
          }
          if (mask === 0 || mask === 255) continue;

          let vx = 0;
          let vy = 0;
          let vz = 0;
          let crossings = 0;
          for (let e = 0; e < 12; e++) {
            const c0 = cubeEdges[e][0];
            const c1 = cubeEdges[e][1];
            const v0 = cornerVals[c0];
            const v1 = cornerVals[c1];
            if ((v0 < 0) === (v1 < 0)) continue;
            const t = v0 / (v0 - v1);
            vx += cornerPos[c0][0] + (cornerPos[c1][0] - cornerPos[c0][0]) * t;
            vy += cornerPos[c0][1] + (cornerPos[c1][1] - cornerPos[c0][1]) * t;
            vz += cornerPos[c0][2] + (cornerPos[c1][2] - cornerPos[c0][2]) * t;
            crossings++;
          }
          vx /= crossings;
          vy /= crossings;
          vz /= crossings;

          for (let it = 0; it < 2; it++) {
            const f = thiefManSDF(vx, vy, vz);
            const gMag = evalThiefGradient(vx, vy, vz, gradTmp);
            const step = Math.max(-0.045, Math.min(0.045, f / Math.max(0.25, gMag)));
            vx -= gradTmp[0] * step;
            vy -= gradTmp[1] * step;
            vz -= gradTmp[2] * step;
          }
          evalThiefGradient(vx, vy, vz, gradTmp);

          const vertId = positions.length / 3;
          cellVert[cIdx(x, y, z)] = vertId;
          positions.push(vx, vy, vz);
          normals.push(gradTmp[0], gradTmp[1], gradTmp[2]);
          parts.push(0);
        }
      }
    }

    function emitQuad(v0, v1, v2, v3, flip) {
      if (v0 < 0 || v1 < 0 || v2 < 0 || v3 < 0) return;
      if (!flip) {
        indices.push(v0, v1, v2, v0, v2, v3);
      } else {
        indices.push(v0, v2, v1, v0, v3, v2);
      }
    }

    for (let z = 1; z < nz - 1; z++) {
      for (let y = 1; y < ny - 1; y++) {
        for (let x = 1; x < nx - 1; x++) {
          const s0 = grid[gIdx(x, y, z)] < 0;

          const sx1 = grid[gIdx(x + 1, y, z)] < 0;
          if (s0 !== sx1) {
            emitQuad(
              cellVert[cIdx(x, y - 1, z - 1)],
              cellVert[cIdx(x, y, z - 1)],
              cellVert[cIdx(x, y, z)],
              cellVert[cIdx(x, y - 1, z)],
              !s0
            );
          }

          const sy1 = grid[gIdx(x, y + 1, z)] < 0;
          if (s0 !== sy1) {
            emitQuad(
              cellVert[cIdx(x - 1, y, z - 1)],
              cellVert[cIdx(x - 1, y, z)],
              cellVert[cIdx(x, y, z)],
              cellVert[cIdx(x, y, z - 1)],
              !s0
            );
          }

          const sz1 = grid[gIdx(x, y, z + 1)] < 0;
          if (s0 !== sz1) {
            emitQuad(
              cellVert[cIdx(x - 1, y - 1, z)],
              cellVert[cIdx(x, y - 1, z)],
              cellVert[cIdx(x, y, z)],
              cellVert[cIdx(x - 1, y, z)],
              !s0
            );
          }
        }
      }
    }

    // Expressive 3D eyes (partId = 1), pupils & mischievous angled brows + smirk (partId = 2)
    indices.push(...appendThiefEllipsoid(positions, normals, parts, -0.145, 5.19, 0.355, 0.072, 0.082, 0.055, 7, 10, 1));
    indices.push(...appendThiefEllipsoid(positions, normals, parts,  0.145, 5.19, 0.355, 0.072, 0.082, 0.055, 7, 10, 1));
    indices.push(...appendThiefEllipsoid(positions, normals, parts, -0.145, 5.19, 0.402, 0.036, 0.044, 0.030, 6, 8, 2));
    indices.push(...appendThiefEllipsoid(positions, normals, parts,  0.145, 5.19, 0.402, 0.036, 0.044, 0.030, 6, 8, 2));
    indices.push(...appendThiefEllipsoid(positions, normals, parts, -0.160, 5.33, 0.375, 0.105, 0.028, 0.038, 6, 8, 2, -0.26));
    indices.push(...appendThiefEllipsoid(positions, normals, parts,  0.160, 5.33, 0.375, 0.105, 0.028, 0.038, 6, 8, 2,  0.26));
    indices.push(...appendThiefEllipsoid(positions, normals, parts,  0.000, 4.93, 0.355, 0.115, 0.030, 0.042, 6, 10, 2, 0.06));

    const vertCount = positions.length / 3;
    const joints = new Float32Array(vertCount * 4);
    const weights = new Float32Array(vertCount * 4);

    for (let i = 0; i < vertCount; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];
      const skin = computeThiefBoneWeights(px, py, pz, parts[i]);
      for (let k = 0; k < 4; k++) {
        joints[i * 4 + k] = skin.joints[k];
        weights[i * 4 + k] = skin.weights[k];
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      parts: new Float32Array(parts),
      joints,
      weights,
      indices: new Uint32Array(indices),
      vertexCount: vertCount,
      indexCount: indices.length
    };
  }

  window.GummyApp = window.GummyApp || {};
  window.GummyApp.REST_NODES_3D = REST_NODES_3D;
  window.GummyApp.THIEF_BONES_3D = THIEF_BONES_3D;
  window.GummyApp.buildGummyBearMesh = buildGummyBearMesh;
  window.GummyApp.buildThiefManMesh = buildThiefManMesh;
  window.GummyApp.buildTorusMesh = buildTorusMesh;
  window.GummyApp.buildCylinderMesh = buildCylinderMesh;
  window.GummyApp.buildSphereMesh = buildSphereMesh;
})();
