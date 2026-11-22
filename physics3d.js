(() => {
  'use strict';

  const { REST_NODES_3D } = window.GummyApp;

  const FLAVORS = {
    cherry: {
      id: 'cherry',
      name: 'Cherry',
      rgb: [1.0, 0.12, 0.30],
      coreRgb: [1.0, 0.52, 0.64],
      particle: [1.0, 0.22, 0.40],
      points: 1
    },
    pineapple: {
      id: 'pineapple',
      name: 'Pineapple',
      rgb: [1.0, 0.78, 0.08],
      coreRgb: [1.0, 0.96, 0.55],
      particle: [1.0, 0.85, 0.18],
      points: 1
    },
    apple: {
      id: 'apple',
      name: 'Green Apple',
      rgb: [0.12, 0.84, 0.32],
      coreRgb: [0.58, 1.0, 0.66],
      particle: [0.18, 0.90, 0.38],
      points: 1
    },
    orange: {
      id: 'orange',
      name: 'Orange',
      rgb: [1.0, 0.44, 0.07],
      coreRgb: [1.0, 0.76, 0.38],
      particle: [1.0, 0.52, 0.14],
      points: 1
    },
    raspberry: {
      id: 'raspberry',
      name: 'Blue Raspberry',
      rgb: [0.06, 0.58, 1.0],
      coreRgb: [0.52, 0.88, 1.0],
      particle: [0.14, 0.66, 1.0],
      points: 1
    },
    grape: {
      id: 'grape',
      name: 'Grape',
      rgb: [0.58, 0.18, 1.0],
      coreRgb: [0.84, 0.60, 1.0],
      particle: [0.66, 0.30, 1.0],
      points: 1
    },
    watermelon: {
      id: 'watermelon',
      name: 'Sour Watermelon',
      rgb: [1.0, 0.24, 0.56],
      coreRgb: [0.52, 1.0, 0.68],
      particle: [1.0, 0.36, 0.66],
      points: 1
    },
    gold: {
      id: 'gold',
      name: '24K Golden',
      rgb: [1.0, 0.72, 0.12],
      coreRgb: [1.0, 0.97, 0.72],
      particle: [1.0, 0.86, 0.30],
      points: 3,
      isGold: true
    },
    white: {
      id: 'white',
      name: 'White',
      rgb: [0.95, 0.97, 1.0],
      coreRgb: [1.0, 0.99, 0.91],
      particle: [1.0, 0.98, 0.86],
      points: 5,
      isWhite: true,
      exclusiveBlessing: true
    },
    cinnamon: {
      id: 'cinnamon',
      name: 'Spicy Cinnamon',
      rgb: [0.98, 0.22, 0.04],
      coreRgb: [1.0, 0.72, 0.14],
      particle: [1.0, 0.44, 0.08],
      points: 2,
      isSpicy: true
    },
    electric: {
      id: 'electric',
      name: 'Electric Lemon',
      rgb: [0.95, 0.96, 0.08],
      coreRgb: [0.45, 1.0, 1.0],
      particle: [0.55, 0.98, 1.0],
      points: 2,
      isElectric: true
    },
    ghost: {
      id: 'ghost',
      name: 'Ghost Bear',
      rgb: [0.68, 0.88, 1.0],
      coreRgb: [0.92, 0.98, 1.0],
      particle: [0.74, 0.92, 1.0],
      points: 3,
      isGhost: true
    }
  };

  const STANDARD_FLAVOR_KEYS = ['cherry', 'pineapple', 'apple', 'orange', 'raspberry', 'grape', 'watermelon', 'cinnamon', 'electric'];

  // 3D Structural & cross-shear spring links between the 16 nodes
  const SPRING_LINKS_3D = [
    // Spine & depth cage
    [0, 1, 1.25], [1, 2, 1.25], [0, 2, 0.9],
    [0, 12, 1.15], [0, 13, 1.15], [12, 13, 0.95], [1, 12, 0.9], [1, 13, 0.9], [2, 13, 0.8],
    // Head, snout, cheeks & ears
    [2, 3, 1.15], [3, 14, 0.9], [3, 15, 0.9], [1, 3, 0.8],
    [2, 14, 1.1], [2, 15, 1.1], [14, 15, 0.9], [14, 1, 0.9], [15, 1, 0.9],
    [4, 2, 1.0], [4, 14, 1.05], [5, 2, 1.0], [5, 15, 1.05], [4, 5, 0.7],
    // Arms
    [6, 1, 1.0], [6, 14, 0.75], [6, 8, 0.8], [6, 0, 0.9], [6, 12, 0.8],
    [7, 1, 1.0], [7, 15, 0.75], [7, 9, 0.8], [7, 0, 0.9], [7, 12, 0.8],
    [6, 7, 0.55],
    // Hips & Belly
    [8, 0, 1.1], [9, 0, 1.1], [8, 9, 0.95], [8, 12, 0.9], [9, 12, 0.9], [8, 13, 0.9], [9, 13, 0.9],
    // Big jiggly 3D butt cheeks (nodes 16 & 17)
    [16, 8, 0.72], [16, 0, 0.68], [16, 13, 0.66], [16, 10, 0.62],
    [17, 9, 0.72], [17, 0, 0.68], [17, 13, 0.66], [17, 11, 0.62],
    [16, 17, 0.58], [16, 9, 0.52], [17, 8, 0.52],
    // Feet
    [10, 8, 1.1], [10, 0, 0.95], [10, 12, 0.9],
    [11, 9, 1.1], [11, 0, 0.95], [11, 12, 0.9],
    [10, 11, 0.85], [10, 9, 0.7], [11, 8, 0.7]
  ];

  function quatToMat3(qx, qy, qz, qw, out) {
    const x2 = qx + qx;
    const y2 = qy + qy;
    const z2 = qz + qz;
    const xx = qx * x2;
    const xy = qx * y2;
    const xz = qx * z2;
    const yy = qy * y2;
    const yz = qy * z2;
    const zz = qz * z2;
    const wx = qw * x2;
    const wy = qw * y2;
    const wz = qw * z2;

    // Column-major 3x3 for GLSL mat3
    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;

    out[3] = xy - wz;
    out[4] = 1 - (xx + zz);
    out[5] = yz + wx;

    out[6] = xz + wy;
    out[7] = yz - wx;
    out[8] = 1 - (xx + yy);
    return out;
  }

  let nextBearId = 1;

  class GummyBear3D {
    constructor(x, y, z, scale = 1.0, flavorKey = 'random') {
      this.id = nextBearId++;
      let key = flavorKey;
      if (key === 'random' || !FLAVORS[key]) {
        key = Math.random() < 0.08
          ? 'gold'
          : STANDARD_FLAVOR_KEYS[Math.floor(Math.random() * STANDARD_FLAVOR_KEYS.length)];
      }
      this.flavor = FLAVORS[key];
      this.scale = scale;
      this.frozen = 0; // 0 = soft gummy, 1 = cryo ice block
      this.heat = 0; // 0 = cool, 1 = popcorn pop threshold
      this.glued = null; // { x, y, z } when glued to wall/ceiling
      this.portalCooldown = 0;
      this.megaLevel = 0;
      this.electricCooldown = 0;
      this.yamBoost = 0; // 0..2.8 Yams Ray butt inflation

      this.cx = x;
      this.cy = y;
      this.cz = z;
      this.prevCx = x;
      this.prevCy = y;
      this.prevCz = z;
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;

      // Random initial yaw rotation (mix of front, 3/4, and turned bears to show off 3D silhouettes)
      const yaw = (Math.random() - 0.5) * Math.PI * 1.65;
      this.qx = 0;
      this.qy = Math.sin(yaw * 0.5);
      this.qz = 0;
      this.qw = Math.cos(yaw * 0.5);
      this.rotMat = new Float32Array(9);
      quatToMat3(this.qx, this.qy, this.qz, this.qw, this.rotMat);

      this.totalMass = 0;
      const massScale = Math.pow(scale, 2.2);
      this.nodes = REST_NODES_3D.map((rn) => {
        const rx = rn.rx * scale;
        const ry = rn.ry * scale;
        const rz = rn.rz * scale;
        const m = rn.m * massScale;
        this.totalMass += m;
        const R = this.rotMat;
        const wx = x + R[0] * rx + R[3] * ry + R[6] * rz;
        const wy = y + R[1] * rx + R[4] * ry + R[7] * rz;
        const wz = z + R[2] * rx + R[5] * ry + R[8] * rz;
        return {
          name: rn.name,
          rx,
          ry,
          rz,
          r: rn.r * scale,
          m,
          x: wx,
          y: wy,
          z: wz,
          vx: 0,
          vy: 0,
          vz: 0,
          fx: 0,
          fy: 0,
          fz: 0
        };
      });

      this.springs = SPRING_LINKS_3D.map(([i, j, mult]) => {
        const a = this.nodes[i];
        const b = this.nodes[j];
        return {
          i,
          j,
          restLen: Math.hypot(b.rx - a.rx, b.ry - a.ry, b.rz - a.rz),
          mult
        };
      });

      this.boundRadius = 1.28 * scale;
      this.jiggleEnergy = 0;
      this.isHeld = false;
      this.isBlessedHold = false;
      this.isStolen = false;
      this.isTraitor = false;
      this.traitorMeals = 0;
      this.bellyBulge = 0;
      this.cheekyTimer = 0;
      this.cheekyPhase = Math.random() * 24;
      this.cheekyAmount = 0;
      this.lastHoopTime = -10;
      this.gpuNodes = new Float32Array(this.nodes.length * 3);
    }

    setScale(newScale) {
      const clamped = Math.max(0.42, Math.min(2.45, newScale));
      if (Math.abs(clamped - this.scale) < 0.0005) return;
      const ratio = clamped / this.scale;
      this.scale = clamped;
      this.boundRadius = 1.28 * clamped;
      const massScale = Math.pow(clamped, 2.2);
      this.totalMass = 0;

      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        const rn = REST_NODES_3D[i];
        n.rx = rn.rx * clamped;
        n.ry = rn.ry * clamped;
        n.rz = rn.rz * clamped;
        n.r = rn.r * clamped;
        n.m = rn.m * massScale;
        this.totalMass += n.m;
        n.x = this.cx + (n.x - this.cx) * ratio;
        n.y = this.cy + (n.y - this.cy) * ratio;
        n.z = this.cz + (n.z - this.cz) * ratio;
      }
      for (const s of this.springs) {
        const a = this.nodes[s.i];
        const b = this.nodes[s.j];
        s.restLen = Math.hypot(b.rx - a.rx, b.ry - a.ry, b.rz - a.rz);
      }
    }

    // Müller 2016 Iterative Quaternion Polar Decomposition for 3D Shape Matching
    updateShapeFrame() {
      let sx = 0;
      let sy = 0;
      let sz = 0;
      let svx = 0;
      let svy = 0;
      let svz = 0;
      for (const n of this.nodes) {
        sx += n.x * n.m;
        sy += n.y * n.m;
        sz += n.z * n.m;
        svx += n.vx * n.m;
        svy += n.vy * n.m;
        svz += n.vz * n.m;
      }
      const invM = 1 / this.totalMass;
      this.cx = sx * invM;
      this.cy = sy * invM;
      this.cz = sz * invM;
      this.vx = svx * invM;
      this.vy = svy * invM;
      this.vz = svz * invM;

      // Covariance matrix A = sum m_i (x_i - c) * r_i^T (columns A0, A1, A2)
      let a00 = 0, a10 = 0, a20 = 0;
      let a01 = 0, a11 = 0, a21 = 0;
      let a02 = 0, a12 = 0, a22 = 0;
      for (const n of this.nodes) {
        const px = (n.x - this.cx) * n.m;
        const py = (n.y - this.cy) * n.m;
        const pz = (n.z - this.cz) * n.m;
        a00 += px * n.rx; a10 += py * n.rx; a20 += pz * n.rx;
        a01 += px * n.ry; a11 += py * n.ry; a21 += pz * n.ry;
        a02 += px * n.rz; a12 += py * n.rz; a22 += pz * n.rz;
      }

      const R = this.rotMat;
      for (let iter = 0; iter < 4; iter++) {
        quatToMat3(this.qx, this.qy, this.qz, this.qw, R);
        // Cross products R_col x A_col
        const wx = (R[1] * a20 - R[2] * a10) + (R[4] * a21 - R[5] * a11) + (R[7] * a22 - R[8] * a12);
        const wy = (R[2] * a00 - R[0] * a20) + (R[5] * a01 - R[3] * a21) + (R[8] * a02 - R[6] * a22);
        const wz = (R[0] * a10 - R[1] * a00) + (R[3] * a11 - R[4] * a01) + (R[6] * a12 - R[7] * a02);

        const dotSum =
          (R[0] * a00 + R[1] * a10 + R[2] * a20) +
          (R[3] * a01 + R[4] * a11 + R[5] * a21) +
          (R[6] * a02 + R[7] * a12 + R[8] * a22);

        const denom = Math.abs(dotSum) + 1e-5;
        const ox = wx / denom;
        const oy = wy / denom;
        const oz = wz / denom;
        const wLen = Math.hypot(ox, oy, oz);
        if (wLen < 1e-5) break;

        const half = wLen * 0.5;
        const s = Math.sin(half) / wLen;
        const dqx = ox * s;
        const dqy = oy * s;
        const dqz = oz * s;
        const dqw = Math.cos(half);

        // q = dq * q
        const nqx = dqw * this.qx + dqx * this.qw + dqy * this.qz - dqz * this.qy;
        const nqy = dqw * this.qy - dqx * this.qz + dqy * this.qw + dqz * this.qx;
        const nqz = dqw * this.qz + dqx * this.qy - dqy * this.qx + dqz * this.qw;
        const nqw = dqw * this.qw - dqx * this.qx - dqy * this.qy - dqz * this.qz;
        const qNorm = 1 / (Math.hypot(nqx, nqy, nqz, nqw) || 1);
        this.qx = nqx * qNorm;
        this.qy = nqy * qNorm;
        this.qz = nqz * qNorm;
        this.qw = nqw * qNorm;
      }
      quatToMat3(this.qx, this.qy, this.qz, this.qw, R);
    }

    syncGpuNodes() {
      const out = this.gpuNodes;
      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        out[i * 3] = n.x;
        out[i * 3 + 1] = n.y;
        out[i * 3 + 2] = n.z;
      }
    }

    applyImpulse(ix, iy, iz, spinX = 0, spinY = 0, spinZ = 0) {
      for (const n of this.nodes) {
        const rx = n.x - this.cx;
        const ry = n.y - this.cy;
        const rz = n.z - this.cz;
        n.vx += ix + (spinY * rz - spinZ * ry);
        n.vy += iy + (spinZ * rx - spinX * rz);
        n.vz += iz + (spinX * ry - spinY * rx);
      }
    }

    exciteJiggle(strength = 5.5) {
      if (this.frozen > 0.5) return;
      const phase = Math.random() * Math.PI * 2;
      for (const n of this.nodes) {
        const dx = n.x - this.cx;
        const dy = n.y - this.cy;
        const dz = n.z - this.cz;
        const dist = Math.hypot(dx, dy, dz) || 1;
        const mode = Math.cos(2 * Math.atan2(dx, dy) + phase);
        n.vx += (dx / dist) * mode * strength + (Math.random() - 0.5) * strength * 0.4;
        n.vy += (dy / dist) * -mode * strength * 0.85 + Math.abs(strength) * 0.2;
        n.vz += (dz / dist) * mode * strength + (Math.random() - 0.5) * strength * 0.4;
      }
      this.jiggleEnergy = Math.min(2.0, this.jiggleEnergy + 1.0);
    }
  }

  class PhysicsWorld3D {
    constructor() {
      this.bears = [];
      this.particles = [];
      this.shockwaves = [];

      // Room half-extents: X in [-11.5, 11.5], Y in [0, 16], Z in [-8.5, 8.5]
      this.boundsX = 11.5;
      this.boundsZ = 8.5;
      this.ceilingY = 16.5;

      // Physics settings
      this.jiggleSoftness = 0.65;
      this.bounciness = 0.78;
      this.gravityScale = 1.0;
      this.baseGravity = -23.5;
      this.defaultBearScale = 1.0;
      this.timeScale = 1.0; // 1.0 normal, 0.28 bullet-time slow-mo
      this.sugarCoat = false;

      // Active tool states
      this.grab = null; // { bear, nodeIndex, x, y, z }
      this.slingshot = null; // { bear, anchorX, anchorY, anchorZ, pullX, pullY, pullZ }
      this.activeField = null; // { type: 'vortex'|'magnet'|'cryo'|'puff', x, y, z, shrink }

      // 3D Arena Props
      this.hoops = [
        { id: 0, enabled: true, x: 4.8, y: 4.6, baseY: 4.6, z: -3.2, radius: 1.55, pulse: 0, phase: 0 },
        { id: 1, enabled: true, x: -4.6, y: 5.8, baseY: 5.8, z: -4.2, radius: 1.45, pulse: 0, phase: 2.1 }
      ];
      this.score = 0;
      this.combo = 0;
      this.comboTimer = 0;

      this.trampoline = {
        enabled: true,
        x: -4.6,
        z: 2.2,
        radius: 2.35,
        pulse: 0
      };

      this.sweeper = {
        enabled: false,
        x: 0,
        y: 0.72,
        z: 0.4,
        halfLen: 4.8,
        radius: 0.34,
        angle: 0,
        speed: 2.35
      };

      // Tall Sculpted 3D Humanoid Runner (Green / 1-in-10 Blue / Hard Red / Hardcore Red / Yellow / Detective Purple)
      this.hardMode = false;
      this.hardcoreMode = false;
      this.forceRedNext = false;
      this.greenManInterval = 60.0;
      this.greenManTimer = 60.0;
      this.greenMan = {
        active: false,
        actionType: 'heist', // 'heist' | 'hardcore_red' | 'yellow_sequence' | 'purple_collect' | 'red_penalty'
        variant: 'green', // 'green' | 'blue' | 'red' | 'purple' | 'yellow'
        phase: 'idle', // 'idle' | 'approach' | 'escape' | 'flee' | 'yellow_gift' | 'yellow_beaten'
        dir: 1,
        fleeDir: 1,
        x: -19,
        z: 0,
        yaw: Math.PI * 0.5,
        stridePhase: 0,
        animTime: 0,
        yellowTimer: 0,
        targetBear: null,
        capturedBears: [],
        penaltyQuota: 1,
        caughtTraitor: false,
        stolenCount: 0
      };

      // Hulking Wide-Angled 3D Obtuse Man (charges in when Red Man becomes Yellow Man, beats him up & runs away!)
      this.obtuseMan = {
        active: false,
        phase: 'idle', // 'idle' | 'charge' | 'beatdown' | 'escape'
        dir: 1,
        x: 19,
        z: 0,
        yaw: -Math.PI * 0.5,
        stridePhase: 0,
        animTime: 0,
        beatTimer: 0
      };

      // Traitor Mode State (1 secret cannibal gummy bear eats a bear every 60s!)
      this.traitorMode = false;
      this.traitorBear = null;
      this.suspectBear = null;
      this.traitorEatInterval = 60.0;
      this.traitorEatTimer = 60.0;
      this.traitorMealsTotal = 0;
      this.traitorApproach = null; // { victim, timer }

      // Celestial 3D Golden Man (descends from the sky every 2 minutes with 2 exclusive White gummy bears!)
      this.goldenManInterval = 120.0;
      this.goldenManTimer = 120.0;
      this.goldenMan = {
        active: false,
        phase: 'idle', // 'idle' | 'descend' | 'bless' | 'ascend'
        x: 0.0,
        y: 17.5,
        z: 1.2,
        yaw: 0.0,
        animTime: 0,
        blessTimer: 0,
        hasBestowed: false,
        offeredBears: [],
        blessingsCount: 0
      };

      // 3D Portals (Portal Gun)
      this.portals = {
        a: null, // { x, y, z, radius, pulse }
        b: null,
        nextSlot: 'a'
      };

      // Pinball Bumpers & Launch Pads
      this.bumpers = {
        enabled: false,
        posts: [
          { x: -3.2, z: -2.0, radius: 0.95, height: 1.55, pulse: 0, color: [1.0, 0.16, 0.62] },
          { x: 3.2, z: -2.0, radius: 0.95, height: 1.55, pulse: 0, color: [0.12, 0.85, 1.0] },
          { x: 0.0, z: 2.6, radius: 1.05, height: 1.65, pulse: 0, color: [1.0, 0.82, 0.10] }
        ],
        pads: [
          { x: -7.5, z: -1.8, radius: 1.45, pulse: 0, vx: 11.5, vy: 16.5, vz: -2.0 },
          { x: 7.5, z: -1.8, radius: 1.45, pulse: 0, vx: -11.5, vy: 16.5, vz: -2.0 }
        ]
      };

      // Upward Wind Tunnel / Floor Fan
      this.fan = {
        enabled: false,
        x: 4.6,
        z: 2.2,
        radius: 2.45,
        angle: 0,
        strength: 36.0
      };

      // Boss Fight Mode: Giant Obtuse Man
      this.bossMode = false;
      this.boss = {
        active: false,
        hp: 100,
        maxHp: 100,
        x: 0,
        z: -2.5,
        yaw: 0,
        stridePhase: 0,
        animTime: 0,
        hitFlash: 0,
        stompTimer: 4.5,
        targetX: 0,
        targetZ: 0,
        scale: 1.85
      };

      // Time-Attack Hoop Challenge Mode
      this.timeAttack = {
        active: false,
        timeLeft: 60.0,
        score: 0,
        maxCombo: 0
      };

      // Wave Survival Mode (Green -> Red -> Ghost Thieves)
      this.survival = {
        active: false,
        wave: 0,
        waveTimer: 0,
        repelled: 0,
        thieves: [] // { id, variant: 'green'|'red'|'ghost', phase, x, z, yaw, stridePhase, animTime, targetBear, dir, fleeDir, flickerPhase }
      };
      this.nextSurvivalThiefId = 1;

      // Cosmetics
      this.selectedHat = 'none';

      // Callbacks
      this.onSquish = null;
      this.onScore = null;
      this.onTrampoline = null;
      this.onPopSplit = null;
      this.onIceShatter = null;
      this.onGreenManSteal = null;
      this.onTraitorEat = null;
      this.onPurpleManCollect = null;
      this.onTraitorWin = null;
      this.onRedPenaltySteal = null;
      this.onGoldenManBless = null;
      this.onRedManRepelled = null;
      this.onYellowManGift = null;
      this.onObtuseManBeatdown = null;
      this.onPortalJump = null;
      this.onBearPopcorn = null;
      this.onBearFuse = null;
      this.onBearGlue = null;
      this.onBumperHit = null;
      this.onElectricZap = null;
      this.onBossHit = null;
      this.onBossDefeat = null;
      this.onTimeAttackEnd = null;
      this.onSurvivalWave = null;
      this.onSurvivalEnd = null;
      this.onSurvivalRepel = null;
    }

    placePortal(x, y, z) {
      const slot = this.portals.nextSlot;
      const py = Math.max(1.5, Math.min(this.ceilingY - 2.2, y));
      const px = Math.max(-this.boundsX + 1.6, Math.min(this.boundsX - 1.6, x));
      const pz = Math.max(-this.boundsZ + 1.6, Math.min(this.boundsZ - 1.6, z));
      this.portals[slot] = { x: px, y: py, z: pz, radius: 1.55, pulse: 1.0 };
      this.portals.nextSlot = slot === 'a' ? 'b' : 'a';
      const col = slot === 'a' ? [0.12, 0.86, 1.0] : [1.0, 0.48, 0.08];
      this.spawnParticles(px, py, pz, col, 18, 1.15);
      return slot;
    }

    clearPortals() {
      this.portals.a = null;
      this.portals.b = null;
      this.portals.nextSlot = 'a';
    }

    tryFuseOrGlueAt(x, y, z, clickedBear = null) {
      // If clicking an already glued bear, unglue it!
      if (clickedBear && clickedBear.glued) {
        clickedBear.glued = null;
        clickedBear.exciteJiggle(4.5);
        this.spawnParticles(clickedBear.cx, clickedBear.cy, clickedBear.cz, [1.0, 0.55, 0.85], 12, 0.8);
        return { action: 'unglue', bear: clickedBear };
      }

      // Check for 2+ bears near (x, y, z) to fuse into a Giant Mega-Bear!
      const nearby = this.bears.filter((b) => {
        if (b.isStolen || b.isBlessedHold || b.isTraitor) return false;
        const d = Math.hypot(b.cx - x, b.cy - y, b.cz - z);
        return d < 3.6 + b.boundRadius;
      });
      nearby.sort((a, b) => Math.hypot(a.cx - x, a.cy - y, a.cz - z) - Math.hypot(b.cx - x, b.cy - y, b.cz - z));

      if (nearby.length >= 2) {
        const primary = nearby[0];
        const absorbed = nearby.slice(1, 3); // Fuse up to 3 bears total
        let avgX = primary.cx;
        let avgY = primary.cy;
        let avgZ = primary.cz;
        for (const ab of absorbed) {
          avgX += ab.cx;
          avgY += ab.cy;
          avgZ += ab.cz;
          const idx = this.bears.indexOf(ab);
          if (idx !== -1) this.bears.splice(idx, 1);
          this.spawnParticles(ab.cx, ab.cy, ab.cz, ab.flavor.particle, 16, 1.2);
        }
        const total = 1 + absorbed.length;
        avgX /= total;
        avgY = Math.max(1.5, avgY / total);
        avgZ /= total;

        const nextScale = Math.min(2.25, primary.scale + absorbed.length * 0.36);
        primary.setScale(nextScale);
        primary.megaLevel = Math.min(4, (primary.megaLevel || 0) + absorbed.length);
        primary.glued = null;
        const dx = avgX - primary.cx;
        const dy = avgY - primary.cy;
        const dz = avgZ - primary.cz;
        for (const n of primary.nodes) {
          n.x += dx;
          n.y += dy;
          n.z += dz;
          n.vy += 4.5;
        }
        primary.updateShapeFrame();
        primary.exciteJiggle(8.5);
        this.spawnParticles(avgX, avgY, avgZ, [1.0, 0.85, 0.2], 26, 1.5);
        this.shockwaves.push({ x: avgX, y: avgY, z: avgZ, r: 0.5, maxR: 5.2, alpha: 0.95 });
        if (this.onBearFuse) this.onBearFuse(primary, total);
        return { action: 'fuse', bear: primary, count: total };
      }

      // Otherwise glue the clicked bear to the nearest wall or ceiling!
      const target = clickedBear || nearby[0];
      if (target && !target.isStolen && !target.isBlessedHold) {
        const dLeft = Math.abs(target.cx - (-this.boundsX));
        const dRight = Math.abs(this.boundsX - target.cx);
        const dBack = Math.abs(target.cz - (-this.boundsZ));
        const dFront = Math.abs(this.boundsZ - target.cz);
        const dCeil = Math.abs(this.ceilingY - target.cy);
        const minD = Math.min(dLeft, dRight, dBack, dFront, dCeil);
        let gx = target.cx;
        let gy = Math.max(1.8, target.cy);
        let gz = target.cz;
        if (minD === dLeft) gx = -this.boundsX + 0.85 * target.scale;
        else if (minD === dRight) gx = this.boundsX - 0.85 * target.scale;
        else if (minD === dBack) gz = -this.boundsZ + 0.85 * target.scale;
        else if (minD === dFront) gz = this.boundsZ - 0.85 * target.scale;
        else gy = this.ceilingY - 1.15 * target.scale;

        target.glued = { x: gx, y: gy, z: gz };
        target.exciteJiggle(5.0);
        this.spawnParticles(gx, gy, gz, [1.0, 0.48, 0.82], 14, 0.9);
        if (this.onBearGlue) this.onBearGlue(target);
        return { action: 'glue', bear: target };
      }
      return null;
    }

    setBossMode(enabled) {
      this.bossMode = Boolean(enabled);
      if (this.bossMode) {
        if (this.traitorMode) this.setTraitorMode(false);
        if (this.timeAttack.active) this.setTimeAttackMode(false);
        if (this.survival.active) this.setSurvivalMode(false);
        this.boss.active = true;
        this.boss.hp = this.boss.maxHp;
        this.boss.x = 0;
        this.boss.z = -3.8;
        this.boss.yaw = 0;
        this.boss.animTime = 0;
        this.boss.hitFlash = 0;
        this.boss.stompTimer = 3.8;
        this.boss.targetX = 0;
        this.boss.targetZ = 0.5;
        this.shockwaves.push({ x: 0, y: 0.25, z: -3.8, r: 0.6, maxR: 7.5, alpha: 1.0 });
        this.spawnParticles(0, 2.5, -3.8, [1.0, 0.22, 0.14], 30, 1.6);
      } else {
        this.boss.active = false;
      }
    }

    damageBoss(dmg, hitBear = null) {
      if (!this.boss.active || this.boss.hp <= 0) return;
      this.boss.hp = Math.max(0, this.boss.hp - dmg);
      this.boss.hitFlash = 1.0;
      const bx = this.boss.x;
      const bz = this.boss.z;
      this.spawnParticles(bx, 2.8, bz, [1.0, 0.84, 0.18], 18, 1.3);
      if (this.onBossHit) this.onBossHit(this.boss.hp, this.boss.maxHp, dmg, hitBear);

      if (this.boss.hp <= 0) {
        this.boss.active = false;
        this.bossMode = false;
        this.score += 50;
        this.spawnParticles(bx, 3.2, bz, [1.0, 0.84, 0.12], 55, 2.2);
        this.spawnParticles(bx, 3.2, bz, [1.0, 0.32, 0.62], 35, 1.9);
        this.shockwaves.push({ x: bx, y: 0.35, z: bz, r: 0.6, maxR: 11.0, alpha: 1.0 });
        // Reward 2 celebration bears (1 Gold + 1 White!)
        if (this.bears.length < 28) {
          const b1 = this.spawnBear(bx - 1.1, 4.5, bz, 'gold', 1.15);
          b1.applyImpulse(-3, 9, 2, 4, 4, 4);
          const b2 = this.spawnBear(bx + 1.1, 4.5, bz, 'white', 1.15);
          b2.applyImpulse(3, 9, 2, 4, 4, 4);
        }
        if (this.onBossDefeat) this.onBossDefeat(this.score);
      }
    }

    setTimeAttackMode(enabled) {
      const next = Boolean(enabled);
      this.timeAttack.active = next;
      if (next) {
        if (this.traitorMode) this.setTraitorMode(false);
        if (this.bossMode) this.setBossMode(false);
        if (this.survival.active) this.setSurvivalMode(false);
        this.timeAttack.timeLeft = 60.0;
        this.timeAttack.score = 0;
        this.timeAttack.maxCombo = 0;
        for (const h of this.hoops) {
          h.enabled = true;
          h.baseX = h.baseX ?? h.x;
          h.baseRadius = h.baseRadius ?? h.radius;
        }
      } else {
        for (const h of this.hoops) {
          if (h.baseX !== undefined) h.x = h.baseX;
          if (h.baseRadius !== undefined) h.radius = h.baseRadius;
        }
      }
    }

    setSurvivalMode(enabled) {
      const next = Boolean(enabled);
      this.survival.active = next;
      this.survival.thieves = [];
      if (next) {
        if (this.traitorMode) this.setTraitorMode(false);
        if (this.bossMode) this.setBossMode(false);
        if (this.timeAttack.active) this.setTimeAttackMode(false);
        this.hardMode = false;
        this.hardcoreMode = false;
        this.survival.wave = 1;
        this.survival.repelled = 0;
        this.survival.waveTimer = 1.2;
        // Guarantee a shiny stash of at least 6 bears including Gold & White
        while (this.bears.length < 6) {
          this.spawnBear((Math.random() - 0.5) * 6, 4 + Math.random() * 3, (Math.random() - 0.5) * 4, Math.random() < 0.5 ? 'gold' : 'white', 1.05);
        }
        this.spawnSurvivalWave(1);
      }
    }

    spawnSurvivalWave(wave) {
      const count = Math.min(5, 1 + wave);
      for (let i = 0; i < count; i++) {
        let variant = 'green';
        if (wave === 2) variant = i % 2 === 0 ? 'red' : 'green';
        else if (wave >= 3) {
          const r = i % 3;
          variant = r === 0 ? 'ghost' : r === 1 ? 'red' : 'green';
        }
        const dir = i % 2 === 0 ? 1 : -1;
        const startX = dir > 0 ? -(this.boundsX + 4.5 + i * 2.4) : (this.boundsX + 4.5 + i * 2.4);
        const startZ = (Math.random() - 0.5) * (this.boundsZ * 1.1);
        this.survival.thieves.push({
          id: this.nextSurvivalThiefId++,
          variant,
          phase: 'approach',
          x: startX,
          z: startZ,
          yaw: dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5,
          stridePhase: Math.random() * 6,
          animTime: 0,
          flickerPhase: Math.random() * 10,
          dir,
          fleeDir: -dir,
          targetBear: null
        });
      }
      if (this.onSurvivalWave) this.onSurvivalWave(wave, count);
    }

    hitSurvivalThiefRay(orig, dir) {
      if (!this.survival.active) return null;
      let best = null;
      let bestDist = Infinity;
      for (const th of this.survival.thieves) {
        if (th.phase === 'flee') continue;
        const cx = th.x;
        const cy = 2.0;
        const cz = th.z;
        const ocx = cx - orig[0];
        const ocy = cy - orig[1];
        const ocz = cz - orig[2];
        const t = ocx * dir[0] + ocy * dir[1] + ocz * dir[2];
        if (t < 0) continue;
        const px = orig[0] + dir[0] * t;
        const py = orig[1] + dir[1] * t;
        const pz = orig[2] + dir[2] * t;
        const dist = Math.hypot(px - cx, py - cy, pz - cz);
        if (dist < 2.2 && t < bestDist) {
          bestDist = t;
          best = th;
        }
      }
      return best;
    }

    repelSurvivalThief(th) {
      if (!th || th.phase === 'flee') return false;
      th.phase = 'flee';
      th.fleeDir = th.x >= 0 ? 1 : -1;
      if (th.targetBear) {
        th.targetBear.isStolen = false;
        th.targetBear.applyImpulse(0, 7.5, 0, 3, 3, 3);
        th.targetBear = null;
      }
      this.survival.repelled += 1;
      this.score += th.variant === 'ghost' ? 10 : th.variant === 'red' ? 6 : 4;
      const col = th.variant === 'ghost' ? [0.65, 0.94, 1.0] : th.variant === 'red' ? [1.0, 0.25, 0.25] : [0.22, 0.95, 0.42];
      this.spawnParticles(th.x, 2.2, th.z, col, 20, 1.3);
      if (this.onSurvivalRepel) this.onSurvivalRepel(th, this.survival.repelled);
      return true;
    }

    nextHardcoreDelay() {
      return 4.0 + Math.random() * 3.0;
    }

    clearBearTraitorFlags() {
      for (const b of this.bears) {
        b.isTraitor = false;
        b.traitorMeals = 0;
        b.bellyBulge = 0;
        b.cheekyTimer = 0;
        b.cheekyAmount = 0;
      }
    }

    setHardMode(enabled) {
      this.hardMode = Boolean(enabled);
      if (this.hardMode) {
        this.hardcoreMode = false;
        if (this.traitorMode) {
          this.setTraitorMode(false);
        }
      }
      this.greenManInterval = this.hardMode ? 10.0 : 60.0;
      if (this.hardMode) {
        this.forceRedNext = true;
        this.greenManTimer = Math.min(this.greenManTimer, 10.0);
        if (this.greenMan.active && this.greenMan.actionType === 'heist' && this.greenMan.phase === 'approach') {
          this.greenMan.variant = 'red';
          this.forceRedNext = false;
        }
      } else {
        this.forceRedNext = false;
        if (!this.greenMan.active && !this.hardcoreMode) {
          this.greenManTimer = 60.0;
        }
      }
    }

    setHardcoreMode(enabled) {
      const next = Boolean(enabled);
      this.hardcoreMode = next;
      if (next) {
        if (this.hardMode) this.hardMode = false;
        if (this.traitorMode) this.setTraitorMode(false);
        this.greenManInterval = 5.5;
        this.greenManTimer = Math.min(this.greenManTimer, this.nextHardcoreDelay());
        if (this.greenMan.active && this.greenMan.actionType === 'heist' && this.greenMan.phase === 'approach') {
          this.greenMan.variant = 'red';
          this.greenMan.actionType = 'hardcore_red';
        }
      } else {
        this.obtuseMan.active = false;
        this.obtuseMan.phase = 'idle';
        if (!this.hardMode && !this.traitorMode) {
          this.greenManInterval = 60.0;
          if (!this.greenMan.active) {
            this.greenManTimer = 60.0;
          }
        }
      }
    }

    setTraitorMode(enabled) {
      const next = Boolean(enabled);
      this.clearBearTraitorFlags();
      this.suspectBear = null;
      this.traitorApproach = null;
      this.traitorMealsTotal = 0;

      if (!next) {
        this.traitorMode = false;
        this.traitorBear = null;
        this.greenManTimer = this.hardcoreMode
          ? this.nextHardcoreDelay()
          : this.hardMode
            ? 10.0
            : 60.0;
        return null;
      }

      if (this.hardMode) {
        this.hardMode = false;
        this.greenManInterval = 60.0;
      }
      if (this.hardcoreMode) {
        this.hardcoreMode = false;
        this.obtuseMan.active = false;
        this.obtuseMan.phase = 'idle';
      }

      // Cancel any mid-approach normal/hardcore heist so the secret traitor is safe at round start
      if (
        this.greenMan.active &&
        (this.greenMan.actionType === 'heist' || this.greenMan.actionType === 'hardcore_red') &&
        this.greenMan.phase === 'approach'
      ) {
        this.greenMan.active = false;
        this.greenMan.phase = 'idle';
        this.greenMan.targetBear = null;
        this.greenMan.capturedBears = [];
      }

      // Ensure at least a small group of existing bears if the stage was emptied
      while (this.bears.filter((b) => !b.isStolen).length < 4) {
        this.spawnBear((Math.random() - 0.5) * 7, 4.5 + Math.random() * 2, (Math.random() - 0.5) * 5, 'random');
      }

      const pool = this.bears.filter((b) => !b.isStolen);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      chosen.isTraitor = true;

      this.traitorMode = true;
      this.traitorBear = chosen;
      this.traitorEatTimer = this.traitorEatInterval;
      return chosen;
    }

    ensureActiveTraitor() {
      if (!this.traitorMode) return null;
      if (this.traitorBear && this.bears.includes(this.traitorBear) && !this.traitorBear.isStolen) {
        return this.traitorBear;
      }
      const pool = this.bears.filter((b) => !b.isStolen);
      if (pool.length === 0) return null;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      chosen.isTraitor = true;
      this.traitorBear = chosen;
      return chosen;
    }

    triggerTraitorMealNow() {
      if (!this.traitorMode) return false;
      const traitor = this.ensureActiveTraitor();
      if (!traitor) return false;

      const victims = this.bears.filter((b) => b !== traitor && !b.isTraitor && !b.isStolen);
      if (victims.length === 0) {
        this.traitorEatTimer = this.traitorEatInterval;
        return false;
      }

      // Pick the closest innocent bear so the sneaky hop looks natural!
      let closest = victims[0];
      let bestDist = Infinity;
      for (const v of victims) {
        const d = Math.hypot(v.cx - traitor.cx, v.cy - traitor.cy, v.cz - traitor.cz);
        if (d < bestDist) {
          bestDist = d;
          closest = v;
        }
      }

      const dx = closest.cx - traitor.cx;
      const dz = closest.cz - traitor.cz;
      const horiz = Math.hypot(dx, dz) || 1;
      // Very subtle tiny nudge so it does NOT give away the attack in peripheral vision
      const scootSpd = Math.min(2.1, Math.max(0.5, horiz * 0.48));
      traitor.applyImpulse((dx / horiz) * scootSpd, 0.85, (dz / horiz) * scootSpd, 0, (Math.random() - 0.5) * 0.8, 0);
      this.traitorApproach = { victim: closest, timer: 0.22 };
      this.traitorEatTimer = this.traitorEatInterval;
      return true;
    }

    executeTraitorChomp(victim) {
      const traitor = this.ensureActiveTraitor();
      if (!traitor || !victim) return;
      const idx = this.bears.indexOf(victim);
      if (idx === -1) return;

      if (this.grab && this.grab.bear === victim) this.grab = null;
      if (this.slingshot && this.slingshot.bear === victim) this.slingshot = null;
      if (this.suspectBear === victim) this.suspectBear = null;

      // Silent disappearance — no flashy particle burst or forced upright spin!
      this.bears.splice(idx, 1);

      // Subtle, low-key cues on the traitor: slight tummy bulge + brief sneaky smirk
      traitor.traitorMeals += 1;
      this.traitorMealsTotal += 1;
      traitor.bellyBulge = 0.55;
      traitor.cheekyTimer = 3.8;
      traitor.exciteJiggle(1.25);

      if (this.onTraitorEat) {
        this.onTraitorEat(this.traitorMealsTotal, this.bears.length);
      }
    }

    callPurpleMan(suspectedBear) {
      const gm = this.greenMan;
      if (!this.traitorMode || gm.active) return false;
      if (!suspectedBear || !this.bears.includes(suspectedBear) || suspectedBear.isStolen) return false;

      gm.actionType = 'purple_collect';
      gm.variant = 'purple';
      gm.dir = gm.stolenCount % 2 === 0 ? 1 : -1;
      gm.active = true;
      gm.phase = 'approach';
      gm.targetBear = suspectedBear;
      gm.capturedBears = [];
      gm.penaltyQuota = 1;
      gm.caughtTraitor = false;
      gm.x = -18.5 * gm.dir;
      gm.z = Math.max(-this.boundsZ + 1.2, Math.min(this.boundsZ - 1.2, suspectedBear.cz));
      gm.yaw = gm.dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      gm.stridePhase = 0;
      return true;
    }

    pickNextPenaltyVictim(capturedList) {
      const available = this.bears.filter((b) => !b.isStolen && !capturedList.includes(b));
      if (available.length === 0) return null;
      // Prefer taking innocent bears so the Traitor remains hidden if enough bears survive!
      const innocents = available.filter((b) => !b.isTraitor);
      const pool = innocents.length > 0 ? innocents : available;
      let best = pool[0];
      let bestD = Infinity;
      for (const b of pool) {
        const d = Math.hypot(b.cx - this.greenMan.x, b.cz - this.greenMan.z);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      return best;
    }

    triggerRedManPenalty(quota = 5) {
      const gm = this.greenMan;
      if (gm.active) return false;

      if (this.bears.length === 0) {
        for (let i = 0; i < quota; i++) {
          this.spawnBear((Math.random() - 0.5) * 6, 3.0 + i * 0.6, (Math.random() - 0.5) * 4, 'random');
        }
      }

      gm.actionType = 'red_penalty';
      gm.variant = 'red';
      gm.dir = gm.stolenCount % 2 === 0 ? 1 : -1;
      gm.active = true;
      gm.phase = 'approach';
      gm.capturedBears = [];
      gm.penaltyQuota = quota;
      gm.caughtTraitor = false;
      gm.x = -18.5 * gm.dir;
      gm.z = 0;
      gm.yaw = gm.dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      gm.stridePhase = 0;

      const firstVictim = this.pickNextPenaltyVictim(gm.capturedBears);
      if (!firstVictim) {
        gm.active = false;
        gm.phase = 'idle';
        return false;
      }
      gm.targetBear = firstVictim;
      gm.z = Math.max(-this.boundsZ + 1.2, Math.min(this.boundsZ - 1.2, firstVictim.cz));
      return true;
    }

    triggerGreenManHeist(forcedVariant = null) {
      const gm = this.greenMan;
      if (gm.active) return false;

      if (this.bears.length === 0) {
        this.spawnBear(0, 3.0, 0, 'random');
      }

      const candidates = this.bears.filter((b) => !b.isHeld && !b.isTraitor);
      const fallbackPool = candidates.length > 0 ? candidates : this.bears.filter((b) => !b.isHeld);
      const victim = fallbackPool.length > 0
        ? fallbackPool[Math.floor(Math.random() * fallbackPool.length)]
        : this.bears[0];
      if (!victim) return false;

      let variant;
      if (forcedVariant === 'green' || forcedVariant === 'blue' || forcedVariant === 'red' || forcedVariant === 'purple') {
        variant = forcedVariant;
      } else if (this.hardcoreMode || this.hardMode) {
        variant = 'red';
      } else {
        variant = Math.random() < 0.10 ? 'blue' : 'green';
      }

      gm.actionType = this.hardcoreMode && variant === 'red' ? 'hardcore_red' : 'heist';
      gm.variant = variant;
      gm.dir = (gm.stolenCount + Math.floor(Math.random() * 2)) % 2 === 0 ? 1 : -1;
      if (!this.hardcoreMode) {
        gm.dir = gm.stolenCount % 2 === 0 ? 1 : -1;
      }
      gm.active = true;
      gm.phase = 'approach';
      gm.targetBear = victim;
      gm.capturedBears = [];
      gm.penaltyQuota = 1;
      gm.caughtTraitor = false;
      gm.animTime = 0;
      gm.x = -18.5 * gm.dir;
      gm.z = Math.max(-this.boundsZ + 1.2, Math.min(this.boundsZ - 1.2, victim.cz));
      gm.yaw = gm.dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      gm.stridePhase = 0;
      this.greenManTimer = this.hardcoreMode ? this.nextHardcoreDelay() : this.greenManInterval;
      return true;
    }

    isRedManClickable() {
      const gm = this.greenMan;
      if (!this.hardcoreMode || !gm.active || gm.variant !== 'red') return false;
      if (gm.actionType !== 'hardcore_red' && gm.actionType !== 'heist') return false;
      return gm.phase === 'approach' || (gm.phase === 'escape' && Math.abs(gm.x) < 15.8);
    }

    raycastClickableRedMan(orig, dir) {
      if (!this.isRedManClickable()) return false;
      const gm = this.greenMan;
      // Generous 3-sphere vertical capsule around the sprinting 3D Red Man (height ~5.4u)
      const centersY = [1.35, 2.95, 4.45];
      const radii = [1.35, 1.48, 1.35];
      for (let i = 0; i < 3; i++) {
        const vx = gm.x - orig[0];
        const vy = centersY[i] - orig[1];
        const vz = gm.z - orig[2];
        const proj = vx * dir[0] + vy * dir[1] + vz * dir[2];
        if (proj < 0) continue;
        const dSq = (vx * vx + vy * vy + vz * vz) - proj * proj;
        if (dSq <= radii[i] * radii[i]) {
          return true;
        }
      }
      return false;
    }

    repelHardcoreRedMan(forceYellow = null) {
      if (!this.isRedManClickable()) return null;
      const gm = this.greenMan;

      // Drop any bear he may have just snatched right back to your pile!
      if (gm.capturedBears.length > 0) {
        for (const cb of gm.capturedBears) {
          cb.isHeld = false;
          cb.isStolen = false;
          cb.applyImpulse((Math.random() - 0.5) * 3, 4.8, (Math.random() - 0.5) * 3, 2, 2, 2);
          cb.exciteJiggle(5.5);
        }
        gm.stolenCount = Math.max(0, gm.stolenCount - gm.capturedBears.length);
        gm.capturedBears = [];
      }
      gm.targetBear = null;

      const becomesYellow = forceYellow !== null ? Boolean(forceYellow) : (Math.random() < 0.10);

      if (!becomesYellow) {
        gm.phase = 'flee';
        gm.fleeDir = gm.x >= 0 ? 1 : -1;
        gm.yaw = gm.fleeDir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
        this.spawnParticles(gm.x, 3.1, gm.z, [1.0, 0.28, 0.22], 22, 1.4);
        this.applyJiggleWave(gm.x, 1.2, gm.z, 3.8, 4.5);
        if (this.onRedManRepelled) this.onRedManRepelled(gm.stolenCount);
        return 'repelled';
      }

      // 10% CHANCE: Transforms into the Yellow Man, gifts a gummy bear, & gets beaten up by the Obtuse Man!
      gm.variant = 'yellow';
      gm.actionType = 'yellow_sequence';
      gm.phase = 'yellow_gift';
      gm.animTime = 0;
      gm.yellowTimer = 0.78;
      gm.x = Math.max(-8.5, Math.min(8.5, gm.x));
      gm.z = Math.max(-4.5, Math.min(4.5, gm.z));
      gm.yaw = 0.0; // Faces camera cheerfully!

      const giftX = gm.x * 0.75;
      const giftZ = Math.min(this.boundsZ - 1.5, gm.z + 1.25);
      const giftBear = this.spawnBear(giftX, 3.9, giftZ, 'random');
      giftBear.applyImpulse(-gm.x * 0.22, 4.6, 1.4, 1.6, 2.2, 1.2);
      giftBear.exciteJiggle(5.0);

      this.spawnParticles(gm.x, 3.4, gm.z, [1.0, 0.90, 0.10], 30, 1.5);
      this.spawnParticles(giftX, 3.6, giftZ, giftBear.flavor.particle, 16, 1.2);

      // Spawn the hulking Obtuse Man charging in from the nearest side to beat him up!
      const om = this.obtuseMan;
      const fromRight = gm.x >= 0;
      om.active = true;
      om.phase = 'charge';
      om.dir = fromRight ? -1 : 1;
      om.x = fromRight ? 18.2 : -18.2;
      om.z = gm.z;
      om.yaw = fromRight ? -Math.PI * 0.5 : Math.PI * 0.5;
      om.stridePhase = 0;
      om.animTime = 0;
      om.beatTimer = 0;

      if (this.onYellowManGift) this.onYellowManGift(giftBear, gm.stolenCount);
      return 'yellow';
    }

    triggerGoldenManBlessing() {
      const gm = this.goldenMan;
      if (gm.active) return false;

      gm.active = true;
      gm.phase = 'descend';
      gm.x = 0.0;
      gm.y = 15.8;
      gm.z = 1.25;
      gm.yaw = 0.0; // Faces camera (+Z) to present the blessing!
      gm.animTime = 0;
      gm.blessTimer = 0;
      gm.hasBestowed = false;
      gm.offeredBears = [];

      for (const side of [-1, 1]) {
        const bx = gm.x + side * 1.05;
        const by = gm.y + 4.22;
        const bz = gm.z + 1.32;
        const wb = this.spawnBear(bx, by, bz, 'white');
        wb.isHeld = true;
        wb.isBlessedHold = true;
        // Orient upright facing +Z in the Golden Man's open palms
        for (const n of wb.nodes) {
          n.x = bx + n.rx;
          n.y = by + n.ry;
          n.z = bz + n.rz;
          n.vx = 0;
          n.vy = 0;
          n.vz = 0;
        }
        wb.updateShapeFrame();
        wb.syncGpuNodes();
        gm.offeredBears.push(wb);
      }

      this.goldenManTimer = this.goldenManInterval;
      return true;
    }

    spawnBear(x, y, z, flavor = 'random', customScale = null) {
      const s = customScale !== null ? customScale : this.defaultBearScale;
      const bear = new GummyBear3D(x, y, z, s, flavor);
      bear.exciteJiggle(2.4);
      bear.syncGpuNodes();
      this.bears.push(bear);
      if (this.bears.length > 34) {
        let idx = this.bears.findIndex(
          (b) => !b.isHeld && !b.isTraitor && !b.isStolen && !b.isBlessedHold && !b.flavor.exclusiveBlessing
        );
        if (idx === -1) {
          idx = this.bears.findIndex((b) => !b.isHeld && !b.isTraitor && !b.isStolen && !b.isBlessedHold);
        }
        if (idx !== -1) this.bears.splice(idx, 1);
      }
      return bear;
    }

    populateStarterPile() {
      this.goldenMan.active = false;
      this.goldenMan.phase = 'idle';
      this.goldenMan.offeredBears = [];
      this.obtuseMan.active = false;
      this.obtuseMan.phase = 'idle';
      this.greenMan.active = false;
      this.greenMan.phase = 'idle';
      this.greenMan.capturedBears = [];
      this.greenMan.targetBear = null;
      this.bears = [];
      for (let i = 0; i < 10; i++) {
        const flav = i === 9 ? 'gold' : STANDARD_FLAVOR_KEYS[i % STANDARD_FLAVOR_KEYS.length];
        const row = Math.floor(i / 5);
        const col = i % 5;
        const bx = (col - 2) * 2.0 + (Math.random() - 0.5) * 0.5;
        const by = 1.6 + row * 2.5 + (i % 2) * 0.5;
        const bz = (row - 0.5) * 1.9 + (Math.random() - 0.5) * 0.6;
        const b = this.spawnBear(bx, by, bz, flav);
        b.applyImpulse(
          (Math.random() - 0.5) * 2.2,
          0,
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 1.5
        );
      }
    }

    setDefaultBearScale(scale) {
      this.defaultBearScale = scale;
      for (const b of this.bears) {
        b.setScale(scale);
      }
    }

    spawnParticles(x, y, z, rgb, count = 14, speedMult = 1.0, iceMode = false) {
      for (let i = 0; i < count; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2 * Math.random() - 1);
        const spd = (2.5 + Math.random() * 7.5) * speedMult;
        this.particles.push({
          x,
          y,
          z,
          vx: Math.sin(v) * Math.cos(u) * spd,
          vy: Math.abs(Math.cos(v)) * spd + 2.2,
          vz: Math.sin(v) * Math.sin(u) * spd,
          size: iceMode ? 0.14 + Math.random() * 0.14 : 0.11 + Math.random() * 0.11,
          r: rgb[0],
          g: rgb[1],
          b: rgb[2],
          life: 1.0,
          decay: 1.15 + Math.random() * 0.9
        });
      }
      if (this.particles.length > 260) {
        this.particles.splice(0, this.particles.length - 260);
      }
    }

    shatterBearIce(bear) {
      if (bear.frozen <= 0.1) return;
      bear.frozen = 0;
      bear.exciteJiggle(7.5);
      this.spawnParticles(bear.cx, bear.cy, bear.cz, [0.72, 0.94, 1.0], 22, 1.25, true);
      if (this.onIceShatter) this.onIceShatter(bear);
    }

    // Raycast against all bears' 3D soft-body nodes
    raycastBears(orig, dir, extraRadius = 0.18) {
      let bestBear = null;
      let bestNode = -1;
      let bestT = Infinity;

      for (const b of this.bears) {
        if (b.isBlessedHold || b.isStolen) continue;
        // Broadphase sphere check
        const ocx = b.cx - orig[0];
        const ocy = b.cy - orig[1];
        const ocz = b.cz - orig[2];
        const projC = ocx * dir[0] + ocy * dir[1] + ocz * dir[2];
        if (projC < 0) continue;
        const perpSqC = (ocx * ocx + ocy * ocy + ocz * ocz) - projC * projC;
        const br = b.boundRadius + extraRadius;
        if (perpSqC > br * br) continue;

        for (let i = 0; i < b.nodes.length; i++) {
          const n = b.nodes[i];
          const vx = n.x - orig[0];
          const vy = n.y - orig[1];
          const vz = n.z - orig[2];
          const proj = vx * dir[0] + vy * dir[1] + vz * dir[2];
          if (proj < 0) continue;
          const dSq = (vx * vx + vy * vy + vz * vz) - proj * proj;
          const r = n.r + extraRadius;
          if (dSq <= r * r) {
            const hitT = proj - Math.sqrt(r * r - dSq);
            if (hitT < bestT) {
              bestT = hitT;
              bestBear = b;
              bestNode = i;
            }
          }
        }
      }
      if (!bestBear) return null;
      return {
        bear: bestBear,
        nodeIndex: bestNode,
        t: bestT,
        point: [
          orig[0] + dir[0] * bestT,
          orig[1] + dir[1] * bestT,
          orig[2] + dir[2] * bestT
        ]
      };
    }

    // Intersect ray with arena floor/walls to get a 3D target point
    raycastArena(orig, dir) {
      let bestT = Infinity;

      // Floor y = 0
      if (dir[1] < -0.001) {
        const t = -orig[1] / dir[1];
        if (t > 0 && t < bestT) {
          const hx = orig[0] + dir[0] * t;
          const hz = orig[2] + dir[2] * t;
          if (Math.abs(hx) <= this.boundsX + 2 && Math.abs(hz) <= this.boundsZ + 2) {
            bestT = t;
          }
        }
      }

      // Back/side walls fallback at distance ~16
      if (!Number.isFinite(bestT)) {
        bestT = 15.0;
      }

      const px = Math.max(-this.boundsX + 0.5, Math.min(this.boundsX - 0.5, orig[0] + dir[0] * bestT));
      const py = Math.max(0.1, Math.min(this.ceilingY - 1, orig[1] + dir[1] * bestT));
      const pz = Math.max(-this.boundsZ + 0.5, Math.min(this.boundsZ - 0.5, orig[2] + dir[2] * bestT));
      return [px, py, pz];
    }

    boopBear(bear, nodeIndex) {
      if (bear.frozen > 0.4) {
        this.shatterBearIce(bear);
        bear.applyImpulse((Math.random() - 0.5) * 5, 7.5, (Math.random() - 0.5) * 5, 3, 4, 2);
        return;
      }
      const node = bear.nodes[nodeIndex];
      node.vy += 6.5;
      bear.applyImpulse(
        (Math.random() - 0.5) * 3.5,
        7.2,
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      );
      bear.exciteJiggle(7.5);
      this.spawnParticles(node.x, node.y, node.z, bear.flavor.particle, 9, 0.8);
    }

    applyJiggleWave(x, y, z, radius = 5.6, power = 9.5) {
      this.shockwaves.push({ x, y: Math.max(0.12, y), z, r: 0.35, maxR: radius, alpha: 0.9 });
      for (const b of this.bears) {
        const dx = b.cx - x;
        const dy = b.cy - y;
        const dz = b.cz - z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist < radius + b.boundRadius) {
          const falloff = Math.max(0.2, 1 - dist / (radius + b.boundRadius));
          const invD = 1 / (dist || 1);
          b.applyImpulse(
            dx * invD * power * 0.65 * falloff,
            (Math.abs(dy * invD) * 0.35 + 0.72) * power * falloff,
            dz * invD * power * 0.65 * falloff,
            (Math.random() - 0.5) * 5 * falloff,
            (Math.random() - 0.5) * 5 * falloff,
            (Math.random() - 0.5) * 5 * falloff
          );
          b.exciteJiggle(power * 0.85 * falloff);
        }
      }
    }

    jiggleAll() {
      this.shockwaves.push({ x: 0, y: 0.15, z: 0, r: 0.6, maxR: 13.5, alpha: 0.95 });
      for (const b of this.bears) {
        b.applyImpulse(
          (Math.random() - 0.5) * 5,
          7.5 + Math.random() * 4.5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        );
        b.exciteJiggle(8.5);
      }
    }

    cannonLaunch(flavor = 'random') {
      const candidates = this.bears.filter((b) => !b.isHeld);
      const bear = candidates.length > 0 && Math.random() < 0.7
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : this.spawnBear((Math.random() - 0.5) * 6, 1.5, 5.2, flavor);

      const activeHoops = this.hoops.filter((h) => h.enabled);
      let vx;
      let vy;
      let vz;

      if (activeHoops.length > 0) {
        const h = activeHoops[Math.floor(Math.random() * activeHoops.length)];
        const flightT = 0.68 + Math.random() * 0.16;
        const g = this.baseGravity * this.gravityScale;
        vx = (h.x - bear.cx) / flightT + (Math.random() - 0.5) * 1.6;
        vy = (h.y - bear.cy - 0.5 * g * flightT * flightT) / flightT;
        vz = (h.z - bear.cz) / flightT + (Math.random() - 0.5) * 1.2;
      } else {
        vx = (Math.random() - 0.5) * 16;
        vy = 13 + Math.random() * 6;
        vz = -12 + Math.random() * 8;
      }

      for (const n of bear.nodes) {
        n.vx = vx;
        n.vy = vy;
        n.vz = vz;
      }
      bear.applyImpulse(0, 0, 0, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
      bear.exciteJiggle(6.5);
      this.spawnParticles(bear.cx, bear.cy, bear.cz, bear.flavor.particle, 14, 1.1);
      return bear;
    }

    fireGatlingBear(camPos, aimPoint, flavor = 'random') {
      const spawnX = camPos[0] * 0.55;
      const spawnY = Math.max(1.8, camPos[1] * 0.52);
      const spawnZ = camPos[2] * 0.55;
      const bear = this.spawnBear(spawnX, spawnY, spawnZ, flavor, this.defaultBearScale * 0.88);

      const dx = aimPoint[0] - spawnX;
      const dy = aimPoint[1] + 1.2 - spawnY;
      const dz = aimPoint[2] - spawnZ;
      const dist = Math.hypot(dx, dy, dz) || 1;
      const speed = 26.5;

      const vx = (dx / dist) * speed + (Math.random() - 0.5) * 1.4;
      const vy = (dy / dist) * speed + 2.4;
      const vz = (dz / dist) * speed + (Math.random() - 0.5) * 1.4;

      for (const n of bear.nodes) {
        n.vx = vx;
        n.vy = vy;
        n.vz = vz;
      }
      bear.applyImpulse(0, 0, 0, 5, (Math.random() - 0.5) * 8, 3);
      bear.exciteJiggle(5.0);
      this.spawnParticles(spawnX, spawnY, spawnZ, bear.flavor.particle, 7, 0.9);
      return bear;
    }

    getSlingshotVelocity() {
      if (!this.slingshot) return { vx: 0, vy: 0, vz: 0, power: 0 };
      const s = this.slingshot;
      const dx = s.anchorX - s.pullX;
      const dy = s.anchorY - s.pullY;
      const dz = s.anchorZ - s.pullZ;
      const dist = Math.hypot(dx, dy, dz);
      const maxPull = 5.4;
      const clamped = Math.min(maxPull, dist);
      const ratio = dist > 1e-4 ? clamped / dist : 0;
      const mult = 6.2;
      const power = clamped / maxPull;
      return {
        vx: dx * ratio * mult,
        vy: dy * ratio * mult + power * 4.5, // Helpful upward loft
        vz: dz * ratio * mult,
        power
      };
    }

    releaseSlingshot() {
      if (!this.slingshot) return null;
      const { bear } = this.slingshot;
      const { vx, vy, vz, power } = this.getSlingshotVelocity();
      bear.isHeld = false;
      this.slingshot = null;

      if (power < 0.06) {
        bear.exciteJiggle(4.5);
        return { bear, launched: false, power };
      }

      for (const n of bear.nodes) {
        n.vx = vx;
        n.vy = vy;
        n.vz = vz;
      }
      bear.applyImpulse(0, 0, 0, power * 5, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4);
      bear.exciteJiggle(6.0 + power * 5.0);
      this.spawnParticles(bear.cx, bear.cy, bear.cz, bear.flavor.particle, 16, 1.2);
      return { bear, launched: true, power };
    }

    detonateMagnetSupernova() {
      if (!this.activeField || this.activeField.type !== 'magnet') return 0;
      const mx = this.activeField.x;
      const my = this.activeField.y + 2.8;
      const mz = this.activeField.z;
      this.activeField = null;

      this.shockwaves.push({ x: mx, y: 0.2, z: mz, r: 0.5, maxR: 11.0, alpha: 1.0 });
      this.spawnParticles(mx, my, mz, [1.0, 0.45, 0.95], 34, 1.7);

      let blasted = 0;
      for (const b of this.bears) {
        const dx = b.cx - mx;
        const dy = b.cy - my;
        const dz = b.cz - mz;
        const dist = Math.hypot(dx, dy, dz);
        if (dist < 8.5) {
          blasted++;
          const ux = dist > 0.05 ? dx / dist : (Math.random() - 0.5);
          const uy = dist > 0.05 ? dy / dist : 0.6;
          const uz = dist > 0.05 ? dz / dist : (Math.random() - 0.5);
          const blast = 22.0 * Math.max(0.45, 1 - dist / 9.0);
          b.applyImpulse(ux * blast, Math.max(5.5, uy * blast + 6.5), uz * blast, 7, 7, 5);
          b.exciteJiggle(9.0);
        }
      }
      return blasted;
    }

    step(rawDt) {
      const dt = Math.min(Math.max(rawDt, 0.001), 1 / 30) * this.timeScale;
      const substeps = 4;
      const subDt = dt / substeps;

      const firmness = 1 - this.jiggleSoftness;
      const baseKShape = 145 + firmness * 520;
      const baseKSpring = 185 + firmness * 580;
      const baseVibDamp = 2.8 + firmness * 6.5;
      const gravity = this.baseGravity * this.gravityScale;

      // Update combo timer & arena props
      if (this.comboTimer > 0) {
        this.comboTimer -= rawDt;
        if (this.comboTimer <= 0) this.combo = 0;
      }

      for (const h of this.hoops) {
        if (!h.enabled) continue;
        h.phase += dt * (this.timeAttack.active ? 2.5 : 1.65);
        h.y = h.baseY + Math.sin(h.phase) * (this.timeAttack.active ? 1.15 : 0.65);
        if (this.timeAttack.active) {
          const baseX = h.baseX !== undefined ? h.baseX : h.x;
          const baseR = h.baseRadius !== undefined ? h.baseRadius : h.radius;
          const progress = Math.max(0, Math.min(1, 1 - this.timeAttack.timeLeft / 60.0));
          h.x = baseX + Math.cos(h.phase * 0.72) * (1.8 + progress * 1.6);
          h.radius = Math.max(1.05, baseR * (1 - progress * 0.25));
        }
        h.pulse = Math.max(0, h.pulse - rawDt * 2.5);
      }

      if (this.trampoline.enabled) {
        this.trampoline.pulse = Math.max(0, this.trampoline.pulse - rawDt * 3.2);
      }

      if (this.sweeper.enabled) {
        this.sweeper.angle += this.sweeper.speed * dt;
      }

      if (this.fan.enabled) {
        this.fan.angle += dt * 11.5;
        if (Math.random() < 0.35) {
          const a = Math.random() * Math.PI * 2;
          const rr = Math.random() * (this.fan.radius * 0.85);
          this.particles.push({
            x: this.fan.x + Math.cos(a) * rr,
            y: 0.35,
            z: this.fan.z + Math.sin(a) * rr,
            vx: (Math.random() - 0.5) * 1.4,
            vy: 9.5 + Math.random() * 4.5,
            vz: (Math.random() - 0.5) * 1.4,
            r: 0.78, g: 0.96, b: 1.0,
            size: 0.08, life: 0.75, decay: 1.4
          });
        }
      }

      if (this.bumpers.enabled) {
        for (const p of this.bumpers.posts) p.pulse = Math.max(0, p.pulse - rawDt * 3.8);
        for (const pad of this.bumpers.pads) pad.pulse = Math.max(0, pad.pulse - rawDt * 3.2);
      }

      if (this.portals.a) this.portals.a.pulse = Math.max(0, this.portals.a.pulse - rawDt * 2.6);
      if (this.portals.b) this.portals.b.pulse = Math.max(0, this.portals.b.pulse - rawDt * 2.6);

      // Time-Attack countdown
      if (this.timeAttack.active) {
        this.timeAttack.timeLeft = Math.max(0, this.timeAttack.timeLeft - Math.min(rawDt, 0.1));
        if (this.timeAttack.timeLeft <= 0) {
          const stats = {
            score: this.timeAttack.score,
            maxCombo: this.timeAttack.maxCombo
          };
          this.setTimeAttackMode(false);
          if (this.onTimeAttackEnd) this.onTimeAttackEnd(stats);
        }
      }

      // Boss Fight Mode: Giant Obtuse Man AI, stomp attack, and bear-impact damage
      if (this.boss.active) {
        const bs = this.boss;
        const stepB = Math.min(rawDt, 0.05);
        bs.animTime += stepB;
        bs.hitFlash = Math.max(0, bs.hitFlash - stepB * 4.5);
        bs.stridePhase += stepB * 10.5;

        const dtx = bs.targetX - bs.x;
        const dtz = bs.targetZ - bs.z;
        const tDist = Math.hypot(dtx, dtz);
        if (tDist < 1.2) {
          bs.targetX = (Math.random() - 0.5) * (this.boundsX * 1.15);
          bs.targetZ = (Math.random() - 0.5) * (this.boundsZ * 1.05);
        } else {
          const spd = 3.6;
          bs.x += (dtx / tDist) * spd * stepB;
          bs.z += (dtz / tDist) * spd * stepB;
          bs.yaw = Math.atan2(dtx, dtz);
        }

        bs.stompTimer -= stepB;
        if (bs.stompTimer <= 0) {
          bs.stompTimer = 4.2 + Math.random() * 1.8;
          this.shockwaves.push({ x: bs.x, y: 0.25, z: bs.z, r: 0.8, maxR: 8.5, alpha: 0.95 });
          this.spawnParticles(bs.x, 0.5, bs.z, [1.0, 0.35, 0.12], 24, 1.5);
          for (const b of this.bears) {
            const dx = b.cx - bs.x;
            const dz = b.cz - bs.z;
            const d = Math.hypot(dx, dz);
            if (d < 7.8) {
              const ux = d > 0.1 ? dx / d : 1;
              const uz = d > 0.1 ? dz / d : 0;
              b.applyImpulse(ux * 11.5, 9.5, uz * 11.5, 5, 5, 4);
              b.exciteJiggle(7.0);
            }
          }
        }

        // Check fast gummy bears hitting the Giant Boss!
        for (const b of this.bears) {
          if (b.isHeld || b.isStolen) continue;
          const dx = b.cx - bs.x;
          const dy = b.cy - 2.6;
          const dz = b.cz - bs.z;
          const d = Math.hypot(dx, dy * 0.65, dz);
          const spd = Math.hypot(b.vx, b.vy, b.vz);
          if (d < 2.25 + b.boundRadius && spd > 6.5) {
            const dmg = Math.round(Math.min(28, (spd * 0.85) * (b.scale * 0.9 + (b.megaLevel || 0) * 0.35)));
            const ux = d > 0.05 ? dx / d : 1;
            const uz = d > 0.05 ? dz / d : 0;
            b.applyImpulse(ux * 10.0, 6.5, uz * 10.0, 4, 4, 4);
            b.exciteJiggle(7.5);
            this.damageBoss(Math.max(6, dmg), b);
            if (!bs.active) break;
          }
        }
      }

      // Wave Survival Mode: Green / Red / Ghost Thieves
      if (this.survival.active) {
        const sv = this.survival;
        const stepS = Math.min(rawDt, 0.05);
        for (let i = sv.thieves.length - 1; i >= 0; i--) {
          const th = sv.thieves[i];
          th.animTime += stepS;
          th.flickerPhase += stepS * 9.0;
          const spd = th.phase === 'flee' ? 14.0 : th.variant === 'ghost' ? 5.6 : th.variant === 'red' ? 6.8 : 4.6;
          th.stridePhase += stepS * (th.phase === 'flee' ? 24 : 16);

          if (th.phase === 'approach') {
            if (!th.targetBear || !this.bears.includes(th.targetBear) || th.targetBear.isStolen) {
              th.targetBear = this.bears.find((b) => !b.isHeld && !b.isStolen && !b.isBlessedHold) || null;
            }
            if (!th.targetBear) {
              th.phase = 'flee';
              th.fleeDir = th.x >= 0 ? 1 : -1;
            } else {
              const dx = th.targetBear.cx - th.x;
              const dz = th.targetBear.cz - th.z;
              const d = Math.hypot(dx, dz);
              if (d < 1.35) {
                th.targetBear.isStolen = true;
                th.targetBear.glued = null;
                th.phase = 'escape';
                th.fleeDir = th.x >= 0 ? 1 : -1;
              } else {
                th.x += (dx / d) * spd * stepS;
                th.z += (dz / d) * spd * stepS;
                th.yaw = Math.atan2(dx, dz);
              }
            }

            // Fast thrown/blasted bears can knock out Survival Thieves!
            for (const b of this.bears) {
              if (b.isHeld || b.isStolen) continue;
              const spdB = Math.hypot(b.vx, b.vy, b.vz);
              if (spdB > 8.0 && Math.hypot(b.cx - th.x, b.cz - th.z) < 1.6 + b.boundRadius && b.cy < 4.5) {
                this.repelSurvivalThief(th);
                b.exciteJiggle(6.0);
                break;
              }
            }
          } else if (th.phase === 'escape') {
            th.x += th.fleeDir * (spd * 1.1) * stepS;
            th.yaw = th.fleeDir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
            if (th.targetBear) {
              const tb = th.targetBear;
              const hx = th.x + Math.sin(th.yaw) * 0.7;
              const hy = 2.0;
              const hz = th.z + Math.cos(th.yaw) * 0.7;
              const ox = hx - tb.cx;
              const oy = hy - tb.cy;
              const oz = hz - tb.cz;
              for (const n of tb.nodes) {
                n.x += ox;
                n.y += oy;
                n.z += oz;
                n.vx = 0; n.vy = 0; n.vz = 0;
              }
              tb.updateShapeFrame();
              tb.syncGpuNodes();
            }
            if (Math.abs(th.x) > this.boundsX + 5.5) {
              if (th.targetBear) {
                const idx = this.bears.indexOf(th.targetBear);
                if (idx !== -1) this.bears.splice(idx, 1);
                this.greenMan.stolenCount += 1;
                if (this.onGreenManSteal) this.onGreenManSteal(th.targetBear, this.greenMan.stolenCount, th.variant);
              }
              sv.thieves.splice(i, 1);
            }
          } else if (th.phase === 'flee') {
            th.x += th.fleeDir * spd * stepS;
            th.yaw = th.fleeDir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
            if (Math.abs(th.x) > this.boundsX + 6.5) {
              sv.thieves.splice(i, 1);
            }
          }
        }

        if (this.bears.length === 0) {
          const stats = { wave: sv.wave, repelled: sv.repelled };
          this.setSurvivalMode(false);
          if (this.onSurvivalEnd) this.onSurvivalEnd(stats);
        } else if (sv.thieves.length === 0) {
          sv.waveTimer -= stepS;
          if (sv.waveTimer <= 0) {
            sv.wave += 1;
            sv.waveTimer = 2.2;
            this.spawnSurvivalWave(sv.wave);
          }
        }
      }

      // Update Traitor Mode subtle cues (bulging belly + cheeky expression) & 60s hunger timer
      const stepReal = Math.min(rawDt, 0.05);
      for (const b of this.bears) {
        if (b.isTraitor && b.traitorMeals > 0) {
          const restBelly = Math.min(0.32, 0.14 + (b.traitorMeals - 1) * 0.08);
          b.bellyBulge += (restBelly - b.bellyBulge) * Math.min(1, stepReal * 0.35);
          b.cheekyPhase += stepReal;
          if (b.cheekyTimer > 0) {
            b.cheekyTimer = Math.max(0, b.cheekyTimer - stepReal);
          } else if (Math.sin(b.cheekyPhase * 0.28) > 0.982) {
            // Very brief subtle micro-smirk tell occasionally once it has eaten
            b.cheekyTimer = 1.05;
          }
          const targetCheeky = b.cheekyTimer > 0 ? Math.min(0.68, b.cheekyTimer * 0.9) : 0.0;
          b.cheekyAmount += (targetCheeky - b.cheekyAmount) * Math.min(1, stepReal * 5.5);
        } else {
          b.bellyBulge = Math.max(0, b.bellyBulge - stepReal * 2.5);
          b.cheekyAmount = Math.max(0, b.cheekyAmount - stepReal * 5.0);
        }
      }

      if (this.suspectBear && (!this.bears.includes(this.suspectBear) || this.suspectBear.isStolen)) {
        this.suspectBear = null;
      }

      const gm = this.greenMan;
      if (this.traitorMode) {
        this.ensureActiveTraitor();
        if (this.traitorApproach) {
          this.traitorApproach.timer -= stepReal;
          const vic = this.traitorApproach.victim;
          if (!vic || !this.bears.includes(vic) || vic.isStolen) {
            this.traitorApproach = null;
          } else if (this.traitorApproach.timer <= 0) {
            this.traitorApproach = null;
            this.executeTraitorChomp(vic);
          }
        } else if (!gm.active) {
          this.traitorEatTimer -= Math.min(rawDt, 0.1);
          if (this.traitorEatTimer <= 0) {
            this.triggerTraitorMealNow();
          }
        }
      }

      // Tall Sculpted 3D Runner (Normal/Hard/Hardcore Heist, Purple Man Suspect Collection, Red Man Penalty, Yellow Man)
      if (!gm.active) {
        if (!this.traitorMode && !this.obtuseMan.active && !this.survival.active && !this.boss.active && !this.timeAttack.active) {
          this.greenManTimer -= Math.min(rawDt, 0.1);
          if (this.greenManTimer <= 0) {
            this.triggerGreenManHeist();
          }
        }
      } else {
        const isRed = gm.variant === 'red';
        const isPurple = gm.variant === 'purple';
        const isYellow = gm.variant === 'yellow';
        const isPenalty = gm.actionType === 'red_penalty';
        const isHardcoreRed = gm.actionType === 'hardcore_red';
        const strideRate = isPenalty
          ? 29.0
          : gm.phase === 'flee'
            ? 28.0
            : isHardcoreRed
              ? 21.5
              : isRed
                ? 26.5
                : isPurple
                  ? 18.0
                  : isYellow
                    ? 22.0
                    : 15.5;
        gm.stridePhase += stepReal * strideRate;

        // If target bear got popped/removed before snatch, pick fallback or transition to escape
        if (gm.phase === 'approach' && (!gm.targetBear || !this.bears.includes(gm.targetBear))) {
          if (isPenalty) {
            const nextVic = this.pickNextPenaltyVictim(gm.capturedBears);
            if (nextVic && gm.capturedBears.length < gm.penaltyQuota) {
              gm.targetBear = nextVic;
            } else {
              gm.phase = 'escape';
              gm.targetBear = null;
              if (gm.capturedBears.length > 0 && this.onRedPenaltySteal) {
                this.onRedPenaltySteal(gm.capturedBears.length, gm.stolenCount);
              }
            }
          } else if (gm.actionType === 'purple_collect') {
            gm.phase = 'escape';
            gm.targetBear = null;
          } else {
            const fallback = this.bears.find((b) => !b.isHeld && !b.isTraitor && !b.isStolen);
            if (fallback) {
              gm.targetBear = fallback;
            } else {
              gm.phase = 'escape';
              gm.targetBear = null;
            }
          }
        }

        if (gm.phase === 'approach' && gm.targetBear) {
          const tb = gm.targetBear;
          const dx = tb.cx - gm.x;
          const dz = tb.cz - gm.z;
          const dist = Math.hypot(dx, dz);
          const sprintSpeed = isPenalty
            ? 22.5
            : isHardcoreRed
              ? 13.0
              : isRed
                ? 18.2
                : isPurple
                  ? 13.5
                  : 10.2;

          if (dist < (isPenalty ? 1.65 : 1.45)) {
            if (this.grab && this.grab.bear === tb) this.grab = null;
            if (this.slingshot && this.slingshot.bear === tb) this.slingshot = null;
            if (this.suspectBear === tb) this.suspectBear = null;

            tb.isHeld = true;
            tb.isStolen = true;
            gm.capturedBears.push(tb);

            if (gm.actionType === 'purple_collect') {
              gm.phase = 'escape';
              const caught = Boolean(tb === this.traitorBear || tb.isTraitor);
              gm.caughtTraitor = caught;
              if (caught) {
                tb.cheekyTimer = 20.0;
                tb.cheekyAmount = 1.0;
                tb.exciteJiggle(8.5);
                this.spawnParticles(tb.cx, tb.cy + 0.6, tb.cz, [0.76, 0.32, 1.0], 26, 1.45);
                this.spawnParticles(tb.cx, tb.cy + 0.6, tb.cz, [1.0, 0.85, 0.2], 18, 1.35);
              } else {
                gm.stolenCount += 1;
                tb.exciteJiggle(7.5);
                this.spawnParticles(tb.cx, tb.cy + 0.5, tb.cz, [0.65, 0.24, 0.98], 18, 1.15);
              }
              if (this.onPurpleManCollect) {
                this.onPurpleManCollect(tb, caught, gm.stolenCount);
              }
            } else if (isPenalty) {
              gm.stolenCount += 1;
              tb.exciteJiggle(9.5);
              this.spawnParticles(tb.cx, tb.cy + 0.5, tb.cz, [1.0, 0.18, 0.20], 16, 1.4);

              const nextVic = gm.capturedBears.length < gm.penaltyQuota
                ? this.pickNextPenaltyVictim(gm.capturedBears)
                : null;
              if (nextVic) {
                gm.targetBear = nextVic;
              } else {
                gm.phase = 'escape';
                gm.targetBear = null;
                if (this.onRedPenaltySteal) {
                  this.onRedPenaltySteal(gm.capturedBears.length, gm.stolenCount);
                }
              }
            } else {
              // Standard Normal / Hard / Hardcore 1-bear heist
              gm.phase = 'escape';
              gm.stolenCount += 1;
              tb.exciteJiggle(isRed ? 9.5 : 7.5);
              const pCol = gm.variant === 'red'
                ? [1.0, 0.20, 0.22]
                : gm.variant === 'blue'
                  ? [0.18, 0.58, 1.0]
                  : [0.18, 0.92, 0.34];
              this.spawnParticles(tb.cx, tb.cy + 0.5, tb.cz, pCol, 20, isRed ? 1.45 : 1.15);
              if (this.onGreenManSteal) this.onGreenManSteal(tb, gm.stolenCount, gm.variant);
            }
          } else {
            const vx = (dx / dist) * sprintSpeed;
            const vz = (dz / dist) * sprintSpeed;
            gm.x += vx * stepReal;
            gm.z += vz * stepReal;
            gm.yaw = Math.atan2(vx, vz);
          }
        } else if (gm.phase === 'escape') {
          const exitX = 19.8 * gm.dir;
          const dx = exitX - gm.x;
          const dz = 0 - gm.z;
          const dist = Math.hypot(dx, dz) || 1;
          const escapeSpeed = isPenalty
            ? 23.0
            : isHardcoreRed
              ? 16.5
              : isRed
                ? 20.8
                : isPurple
                  ? 15.2
                  : 11.6;
          const vx = (dx / dist) * escapeSpeed;
          const vz = (dz / dist) * escapeSpeed * 0.45;
          gm.x += vx * stepReal;
          gm.z += vz * stepReal;
          gm.yaw = Math.atan2(vx, vz);

          if (Math.abs(gm.x) >= 19.2) {
            const finishedAction = gm.actionType;
            const caughtTraitor = gm.caughtTraitor;
            const collectedFlavor = gm.capturedBears[0] ? gm.capturedBears[0].flavor.name : 'Mystery';

            for (const cb of gm.capturedBears) {
              const idx = this.bears.indexOf(cb);
              if (idx !== -1) this.bears.splice(idx, 1);
            }
            if (gm.targetBear) {
              const idx = this.bears.indexOf(gm.targetBear);
              if (idx !== -1) this.bears.splice(idx, 1);
            }

            gm.capturedBears = [];
            gm.targetBear = null;
            gm.active = false;
            gm.phase = 'idle';
            this.greenManTimer = this.hardcoreMode ? this.nextHardcoreDelay() : this.greenManInterval;

            if (finishedAction === 'purple_collect') {
              if (caughtTraitor) {
                const stats = {
                  flavorName: collectedFlavor,
                  meals: this.traitorMealsTotal,
                  survivors: this.bears.length
                };
                this.setTraitorMode(false);
                if (this.onTraitorWin) this.onTraitorWin(stats);
              } else {
                // Wrong bear accused! Unleash the Red Man to take 5 bears!
                this.triggerRedManPenalty(5);
              }
            } else if (finishedAction === 'red_penalty' && this.traitorMode) {
              // Ensure at least a couple of bears remain on the stage if the 5-bear penalty cleared the room
              while (this.bears.length < 3) {
                this.spawnBear((Math.random() - 0.5) * 7, 5.5 + Math.random() * 2, (Math.random() - 0.5) * 5, 'random');
              }
              this.ensureActiveTraitor();
            }
          }
        } else if (gm.phase === 'flee') {
          const exitX = 19.8 * (gm.fleeDir || 1);
          const dx = exitX - gm.x;
          const dz = 0 - gm.z;
          const dist = Math.hypot(dx, dz) || 1;
          const fleeSpeed = isYellow ? 21.5 : 22.5;
          const vx = (dx / dist) * fleeSpeed;
          const vz = (dz / dist) * fleeSpeed * 0.42;
          gm.x += vx * stepReal;
          gm.z += vz * stepReal;
          gm.yaw = Math.atan2(vx, vz);

          if (Math.abs(gm.x) >= 19.2) {
            gm.capturedBears = [];
            gm.targetBear = null;
            gm.active = false;
            gm.phase = 'idle';
            if (!this.obtuseMan.active) {
              this.greenManTimer = this.hardcoreMode ? this.nextHardcoreDelay() : this.greenManInterval;
            }
          }
        } else if (gm.phase === 'yellow_gift') {
          gm.animTime += stepReal;
          gm.yellowTimer = Math.max(0, gm.yellowTimer - stepReal);
          if (Math.random() < stepReal * 12) {
            this.spawnParticles(
              gm.x + (Math.random() - 0.5) * 1.6,
              2.2 + Math.random() * 2.5,
              gm.z + (Math.random() - 0.5) * 1.2,
              [1.0, 0.92, 0.16],
              1,
              0.45
            );
          }
        } else if (gm.phase === 'yellow_beaten') {
          gm.animTime += stepReal;
        }
      }

      // Hulking 3D Obtuse Man (charges in, beats up the Yellow Man, and runs away!)
      const om = this.obtuseMan;
      if (om.active) {
        om.animTime += stepReal;
        if (om.phase === 'charge') {
          om.stridePhase += stepReal * 24.5;
          const tx = gm.active ? gm.x : 0;
          const tz = gm.active ? gm.z : 0;
          const dx = tx - om.x;
          const dz = tz - om.z;
          const dist = Math.hypot(dx, dz) || 0.001;

          if (dist < 1.85 || !gm.active) {
            om.phase = 'beatdown';
            om.beatTimer = 1.25;
            om.animTime = 0;
            if (gm.active) {
              gm.phase = 'yellow_beaten';
              gm.animTime = 0;
              om.yaw = Math.atan2(dx, dz);
            }
            this.spawnParticles(tx, 2.8, tz, [1.0, 0.58, 0.14], 24, 1.55);
            this.spawnParticles(tx, 2.8, tz, [1.0, 0.94, 0.25], 18, 1.35);
            this.applyJiggleWave(tx, 1.4, tz, 5.2, 6.8);
            if (this.onObtuseManBeatdown) this.onObtuseManBeatdown();
          } else {
            const chargeSpeed = 21.5;
            const vx = (dx / dist) * chargeSpeed;
            const vz = (dz / dist) * chargeSpeed;
            om.x += vx * stepReal;
            om.z += vz * stepReal;
            om.yaw = Math.atan2(vx, vz);
          }
        } else if (om.phase === 'beatdown') {
          const prevHits = Math.floor(Math.max(0, om.animTime - stepReal) * 7.2);
          const currHits = Math.floor(om.animTime * 7.2);
          if (gm.active) {
            om.yaw = Math.atan2(gm.x - om.x, (gm.z - om.z) || 0.01);
          }
          if (currHits > prevHits && gm.active) {
            const pushDir = gm.x >= om.x ? 1 : -1;
            gm.x = Math.max(-9.8, Math.min(9.8, gm.x + pushDir * 0.26));
            om.x = gm.x - pushDir * 1.45;
            this.spawnParticles(gm.x, 2.3 + (currHits % 2) * 0.6, gm.z, [1.0, 0.65, 0.16], 11, 1.25);
            this.spawnParticles(gm.x, 2.5, gm.z, [0.42, 0.55, 0.92], 7, 1.05);
            this.applyJiggleWave(gm.x, 1.2, gm.z, 3.6, 3.8);
          }
          om.beatTimer -= stepReal;
          if (om.beatTimer <= 0) {
            om.phase = 'escape';
            om.dir = om.x >= 0 ? 1 : -1;
            if (gm.active) {
              gm.phase = 'flee';
              gm.fleeDir = -om.dir;
              gm.yaw = gm.fleeDir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
            }
          }
        } else if (om.phase === 'escape') {
          om.stridePhase += stepReal * 25.5;
          const exitX = 19.8 * om.dir;
          const dx = exitX - om.x;
          const dz = 0 - om.z;
          const dist = Math.hypot(dx, dz) || 1;
          const escSpeed = 21.0;
          const vx = (dx / dist) * escSpeed;
          const vz = (dz / dist) * escSpeed * 0.42;
          om.x += vx * stepReal;
          om.z += vz * stepReal;
          om.yaw = Math.atan2(vx, vz);

          if (Math.abs(om.x) >= 19.2) {
            om.active = false;
            om.phase = 'idle';
            if (!gm.active) {
              this.greenManTimer = this.hardcoreMode ? this.nextHardcoreDelay() : this.greenManInterval;
            }
          }
        }
      }

      // Celestial 3D Golden Man (descends from the sky every 2 minutes to bless you with 2 White gummy bears!)
      const goldM = this.goldenMan;
      if (!goldM.active) {
        this.goldenManTimer -= Math.min(rawDt, 0.1);
        if (this.goldenManTimer <= 0) {
          this.triggerGoldenManBlessing();
        }
      } else {
        goldM.animTime += stepReal;
        if (Math.random() < stepReal * 18) {
          this.spawnParticles(
            goldM.x + (Math.random() - 0.5) * 2.2,
            goldM.y + 1.5 + Math.random() * 3.2,
            goldM.z + (Math.random() - 0.5) * 1.6,
            [1.0, 0.88, 0.32],
            1,
            0.38
          );
        }

        if (goldM.phase === 'descend') {
          goldM.y = Math.max(1.55, goldM.y - 6.8 * stepReal);
          if (goldM.y <= 1.56) {
            goldM.y = 1.55;
            goldM.phase = 'bless';
            goldM.blessTimer = 1.55;
          }
        } else if (goldM.phase === 'bless') {
          goldM.blessTimer -= stepReal;
          if (!goldM.hasBestowed && goldM.blessTimer <= 0.72) {
            goldM.hasBestowed = true;
            const gifted = [];
            goldM.offeredBears.forEach((wb, idx) => {
              if (!this.bears.includes(wb)) return;
              wb.isHeld = false;
              wb.isBlessedHold = false;
              const side = idx === 0 ? -1 : 1;
              wb.applyImpulse(side * 1.45, 2.6, 1.85, 0.8, side * 1.2, 0);
              wb.exciteJiggle(4.2);
              this.spawnParticles(wb.cx, wb.cy + 0.3, wb.cz, [1.0, 0.88, 0.32], 18, 1.2);
              this.spawnParticles(wb.cx, wb.cy + 0.3, wb.cz, [0.98, 0.99, 1.0], 14, 1.0);
              gifted.push(wb);
            });
            goldM.offeredBears = [];
            goldM.blessingsCount += 1;
            if (this.onGoldenManBless) {
              this.onGoldenManBless(gifted, goldM.blessingsCount);
            }
          }
          if (goldM.blessTimer <= 0) {
            goldM.phase = 'ascend';
          }
        } else if (goldM.phase === 'ascend') {
          goldM.y += 8.2 * stepReal;
          if (goldM.y >= 17.5) {
            goldM.active = false;
            goldM.phase = 'idle';
            goldM.offeredBears = [];
          }
        }
      }

      // Continuous field tool effects (Puff / Cryo)
      if (this.activeField) {
        const fld = this.activeField;
        if (fld.type === 'puff') {
          const toSplit = [];
          for (const b of this.bears) {
            if (b.isBlessedHold) continue;
            const d = Math.hypot(b.cx - fld.x, b.cy - (fld.y + 1.1), b.cz - fld.z);
            if (d < 3.4 + b.boundRadius) {
              const delta = (fld.shrink ? -1.15 : 1.15) * rawDt;
              const cannotSplit = b.isTraitor || b.flavor.exclusiveBlessing;
              const nextS = cannotSplit ? Math.min(2.15, b.scale + delta) : b.scale + delta;
              if (!fld.shrink && !cannotSplit && nextS > 2.28 && this.bears.length < 31) {
                toSplit.push(b);
              } else {
                b.setScale(nextS);
                b.exciteJiggle(1.8);
              }
            }
          }
          for (const bigBear of toSplit) {
            const idx = this.bears.indexOf(bigBear);
            if (idx !== -1) this.bears.splice(idx, 1);
            this.spawnParticles(bigBear.cx, bigBear.cy, bigBear.cz, bigBear.flavor.particle, 28, 1.5);
            for (let k = 0; k < 3; k++) {
              const ang = (k / 3) * Math.PI * 2 + Math.random();
              const baby = this.spawnBear(
                bigBear.cx + Math.cos(ang) * 0.7,
                bigBear.cy + 0.4,
                bigBear.cz + Math.sin(ang) * 0.7,
                bigBear.flavor.id,
                0.62
              );
              baby.applyImpulse(Math.cos(ang) * 8.5, 9.5, Math.sin(ang) * 8.5, 5, 6, 4);
            }
            if (this.onPopSplit) this.onPopSplit(bigBear);
          }
        } else if (fld.type === 'cryo') {
          for (const b of this.bears) {
            const d = Math.hypot(b.cx - fld.x, b.cy - (fld.y + 1.1), b.cz - fld.z);
            if (d < 3.6 + b.boundRadius && b.frozen < 1) {
              b.frozen = Math.min(1, b.frozen + rawDt * 2.8);
              b.heat = Math.max(0, b.heat - rawDt * 2.5);
              if (Math.random() < 0.35) {
                this.spawnParticles(b.cx, b.cy + 0.5, b.cz, [0.74, 0.95, 1.0], 1, 0.5, true);
              }
            }
          }
        } else if (fld.type === 'heat') {
          for (const b of this.bears) {
            const d = Math.hypot(b.cx - fld.x, b.cy - (fld.y + 1.1), b.cz - fld.z);
            if (d < 3.4 + b.boundRadius) {
              if (b.frozen > 0) {
                b.frozen = Math.max(0, b.frozen - rawDt * 3.5);
              }
              b.heat = Math.min(1.05, b.heat + rawDt * 1.15);
              b.exciteJiggle(2.4);
              if (Math.random() < 0.45) {
                this.spawnParticles(b.cx, b.cy + 0.4, b.cz, [1.0, 0.48, 0.08], 1, 0.65);
              }
              if (b.heat >= 1.0) {
                // POPCORN POP!
                b.heat = 0;
                b.glued = null;
                b.applyImpulse((Math.random() - 0.5) * 11, 17.5, (Math.random() - 0.5) * 11, 7, 7, 5);
                b.exciteJiggle(10.0);
                this.spawnParticles(b.cx, b.cy + 0.3, b.cz, [1.0, 0.92, 0.48], 26, 1.6);
                this.spawnParticles(b.cx, b.cy + 0.3, b.cz, [1.0, 0.36, 0.06], 16, 1.3);
                this.shockwaves.push({ x: b.cx, y: b.cy, z: b.cz, r: 0.4, maxR: 4.5, alpha: 0.85 });
                if (this.onBearPopcorn) this.onBearPopcorn(b);
              }
            }
          }
        } else if (fld.type === 'yams') {
          for (const b of this.bears) {
            if (b.isBlessedHold) continue;
            const d = Math.hypot(b.cx - fld.x, b.cy - (fld.y + 1.1), b.cz - fld.z);
            if (d < 3.6 + b.boundRadius) {
              const delta = (fld.shrink ? -1.8 : 1.8) * rawDt;
              b.yamBoost = Math.max(0, Math.min(2.8, (b.yamBoost || 0) + delta));
              // Scale butt cheek soft-body node radii so the bigger butt bounces & jiggles!
              if (b.nodes[16] && b.nodes[17]) {
                const cheekR = (0.26 + b.yamBoost * 0.14) * b.scale;
                b.nodes[16].r = cheekR;
                b.nodes[17].r = cheekR;
                b.nodes[16].vy += (Math.random() - 0.5) * 1.8;
                b.nodes[17].vy += (Math.random() - 0.5) * 1.8;
              }
              b.exciteJiggle(2.2);
              if (Math.random() < 0.4) {
                this.spawnParticles(b.cx, b.cy, b.cz, [0.95, 0.52, 0.16], 1, 0.65);
              }
            }
          }
        }
      }

      for (const b of this.bears) {
        if (b.portalCooldown > 0) b.portalCooldown = Math.max(0, b.portalCooldown - rawDt);
        if (b.electricCooldown > 0) b.electricCooldown = Math.max(0, b.electricCooldown - rawDt);
        if (!this.activeField || this.activeField.type !== 'heat') {
          if (b.heat > 0) b.heat = Math.max(0, b.heat - rawDt * 0.25);
        }
        // Spicy Cinnamon fire trail when moving
        if (b.flavor.isSpicy && Math.hypot(b.vx, b.vy, b.vz) > 4.0 && Math.random() < 0.38) {
          this.spawnParticles(b.cx, b.cy, b.cz, [1.0, 0.38, 0.06], 1, 0.55);
        }
        b.prevCx = b.cx;
        b.prevCy = b.cy;
        b.prevCz = b.cz;
      }

      let maxImpactSpeed = 0;

      for (let stepIdx = 0; stepIdx < substeps; stepIdx++) {
        // 1. Internal 3D Soft-Body Forces + Field Forces
        for (const b of this.bears) {
          b.updateShapeFrame();

          const freezeBoost = 1 + b.frozen * 4.5;
          const kShape = baseKShape * freezeBoost;
          const kSpring = baseKSpring * freezeBoost;
          const holdZeroG = b.isHeld && ((this.slingshot && this.slingshot.bear === b) || b.isStolen);

          for (const n of b.nodes) {
            n.fx = 0;
            n.fy = holdZeroG ? 0 : gravity * n.m;
            n.fz = 0;
          }

          // 3D Shape-Matching Goal Springs
          const R = b.rotMat;
          for (const n of b.nodes) {
            const gx = b.cx + R[0] * n.rx + R[3] * n.ry + R[6] * n.rz;
            const gy = b.cy + R[1] * n.rx + R[4] * n.ry + R[7] * n.rz;
            const gz = b.cz + R[2] * n.rx + R[5] * n.ry + R[8] * n.rz;
            n.fx += (gx - n.x) * kShape * n.m;
            n.fy += (gy - n.y) * kShape * n.m;
            n.fz += (gz - n.z) * kShape * n.m;
          }

          // 3D Structural & Cross Springs
          for (const s of b.springs) {
            const a = b.nodes[s.i];
            const c = b.nodes[s.j];
            const dx = c.x - a.x;
            const dy = c.y - a.y;
            const dz = c.z - a.z;
            const len = Math.hypot(dx, dy, dz) || 1e-4;
            const f = ((len - s.restLen) / len) * kSpring * s.mult;
            const fx = dx * f;
            const fy = dy * f;
            const fz = dz * f;
            a.fx += fx; a.fy += fy; a.fz += fz;
            c.fx -= fx; c.fy -= fy; c.fz -= fz;
          }

          // Vortex Tornado & Magnet Orb Field Forces
          if (this.activeField && !b.isHeld) {
            const fld = this.activeField;
            if (fld.type === 'vortex') {
              const dx = b.cx - fld.x;
              const dz = b.cz - fld.z;
              const horizD = Math.hypot(dx, dz) || 0.01;
              if (horizD < 8.5) {
                const strength = (1 - horizD / 8.5);
                const funnelR = 0.65 + Math.max(0, b.cy) * 0.22;
                const radialPull = (funnelR - horizD) * 28.0 * strength;
                const swirl = 42.0 * strength;
                const lift = (b.cy < 9.5 ? 36.0 : -14.0) * strength;

                const ux = dx / horizD;
                const uz = dz / horizD;
                const tx = -uz;
                const tz = ux;

                for (const n of b.nodes) {
                  n.fx += (ux * radialPull + tx * swirl) * n.m;
                  n.fy += lift * n.m;
                  n.fz += (uz * radialPull + tz * swirl) * n.m;
                }
              }
            } else if (fld.type === 'magnet') {
              const tx = fld.x;
              const ty = fld.y + 3.0;
              const tz = fld.z;
              const dx = tx - b.cx;
              const dy = ty - b.cy;
              const dz = tz - b.cz;
              const d = Math.hypot(dx, dy, dz) || 0.01;
              if (d < 13.0) {
                const pull = 48.0 / (1 + d * 0.18);
                for (const n of b.nodes) {
                  n.fx += (dx / d) * pull * n.m - n.vx * 2.2 * n.m;
                  n.fy += ((dy / d) * pull - gravity * 0.92) * n.m - n.vy * 2.2 * n.m;
                  n.fz += (dz / d) * pull * n.m - n.vz * 2.2 * n.m;
                }
              }
            }
          }
        }

        // 2. Active 3D Grab Tether
        if (this.grab) {
          const { bear, nodeIndex, x, y, z } = this.grab;
          const tn = bear.nodes[nodeIndex];
          const pullK = 1650;
          const dampK = 32;
          tn.fx += (x - tn.x) * pullK - tn.vx * dampK;
          tn.fy += (y - tn.y) * pullK - tn.vy * dampK;
          tn.fz += (z - tn.z) * pullK - tn.vz * dampK;

          const core = bear.nodes[0];
          if (core !== tn) {
            core.fx += (x - (tn.x - core.x) - core.x) * 240;
            core.fy += (y - (tn.y - core.y) - core.y) * 240;
            core.fz += (z - (tn.z - core.z) - core.z) * 240;
          }
        }

        // 3. Active 3D Slingshot Pouch
        if (this.slingshot) {
          const s = this.slingshot;
          const b = s.bear;
          const R = b.rotMat;
          const { power } = this.getSlingshotVelocity();
          const stretch = 1 + power * 0.28;
          const squash = 1 / Math.sqrt(stretch);
          const jitter = power * 0.04;

          for (const n of b.nodes) {
            const tx = s.pullX + (R[0] * n.rx * squash + R[3] * n.ry * squash + R[6] * n.rz * stretch) + (Math.random() - 0.5) * jitter;
            const ty = s.pullY + (R[1] * n.rx * squash + R[4] * n.ry * squash + R[7] * n.rz * stretch) + (Math.random() - 0.5) * jitter;
            const tz = s.pullZ + (R[2] * n.rx * squash + R[5] * n.ry * squash + R[8] * n.rz * stretch) + (Math.random() - 0.5) * jitter;
            n.fx += (tx - n.x) * 1350 - n.vx * 38;
            n.fy += (ty - n.y) * 1350 - n.vy * 38;
            n.fz += (tz - n.z) * 1350 - n.vz * 38;
          }
        }

        // 3b. Sculpted 3D Runner Carrying Captured Bear(s) Overhead (1 bear or 5-bear penalty bundle!)
        if (this.greenMan.active && this.greenMan.capturedBears.length > 0) {
          const gmRef = this.greenMan;
          const isRed = gmRef.variant === 'red';
          const isPurple = gmRef.variant === 'purple';
          const isPenalty = gmRef.actionType === 'red_penalty';
          const bob = Math.abs(Math.sin(gmRef.stridePhase)) * (isRed ? 0.34 : 0.28);
          const sinY = Math.sin(gmRef.yaw);
          const cosY = Math.cos(gmRef.yaw);
          const rightX = cosY;
          const rightZ = -sinY;
          const moveSpd = gmRef.phase === 'escape'
            ? (isPenalty ? 23.0 : isRed ? 20.8 : isPurple ? 15.2 : 11.6)
            : (isPenalty ? 22.5 : 14.0);
          const gmVx = sinY * moveSpd;
          const gmVz = cosY * moveSpd;
          const pullStiff = isRed ? 1650 : 1280;
          const pullDamp = isRed ? 34 : 28;

          const count = gmRef.capturedBears.length;
          for (let ci = 0; ci < count; ci++) {
            const sb = gmRef.capturedBears[ci];
            // Fan multiple captured bears in a bouncy overhead cluster when Red Man takes 5!
            const lateral = count > 1 ? ((ci % 3) - 1) * 0.92 + (ci >= 3 ? (ci === 3 ? -0.52 : 0.52) : 0) : 0;
            const liftOff = count > 1 ? Math.floor(ci / 3) * 1.15 + (ci % 2) * 0.25 : 0;
            const fwdOff = 1.15 + (count > 1 ? ((ci % 2) - 0.5) * 0.35 : 0);

            const holdX = gmRef.x + sinY * fwdOff + rightX * lateral;
            const holdY = 4.92 + bob + liftOff;
            const holdZ = gmRef.z + cosY * fwdOff + rightZ * lateral;
            const R = sb.rotMat;

            for (const n of sb.nodes) {
              const tx = holdX + R[0] * n.rx + R[3] * n.ry + R[6] * n.rz;
              const ty = holdY + R[1] * n.rx + R[4] * n.ry + R[7] * n.rz;
              const tz = holdZ + R[2] * n.rx + R[5] * n.ry + R[8] * n.rz;
              n.fx += (tx - n.x) * pullStiff - (n.vx - gmVx) * pullDamp;
              n.fy += (ty - n.y) * pullStiff - n.vy * pullDamp;
              n.fz += (tz - n.z) * pullStiff - (n.vz - gmVz) * pullDamp;
            }
          }
        }

        // 3c. Sculpted 3D Golden Man Cradling 2 Blessed White Bears in Open Palms
        if (this.goldenMan.active && this.goldenMan.offeredBears.length > 0) {
          const goldRef = this.goldenMan;
          const hoverBob = Math.sin(goldRef.animTime * 3.2) * 0.16;
          const goldVy = goldRef.phase === 'descend' ? -6.8 : 0.0;

          for (let ci = 0; ci < goldRef.offeredBears.length; ci++) {
            const wb = goldRef.offeredBears[ci];
            if (!this.bears.includes(wb)) continue;
            const side = ci === 0 ? -1 : 1;
            const holdX = goldRef.x + side * 1.05;
            const holdY = goldRef.y + 4.22 + hoverBob;
            const holdZ = goldRef.z + 1.32;
            const R = wb.rotMat;

            for (const n of wb.nodes) {
              const tx = holdX + R[0] * n.rx + R[3] * n.ry + R[6] * n.rz;
              const ty = holdY + R[1] * n.rx + R[4] * n.ry + R[7] * n.rz;
              const tz = holdZ + R[2] * n.rx + R[5] * n.ry + R[8] * n.rz;
              n.fx += (tx - n.x) * 1350 - n.vx * 30;
              n.fy += (ty - n.y) * 1350 - (n.vy - goldVy) * 30;
              n.fz += (tz - n.z) * 1350 - n.vz * 30;
            }
          }
        }

        // 4. Integrate & Damp Non-Rigid Vibration in 3D
        for (const b of this.bears) {
          let svx = 0;
          let svy = 0;
          let svz = 0;
          for (const n of b.nodes) {
            const invM = 1 / n.m;
            n.vx += n.fx * invM * subDt;
            n.vy += n.fy * invM * subDt;
            n.vz += n.fz * invM * subDt;
            svx += n.vx * n.m;
            svy += n.vy * n.m;
            svz += n.vz * n.m;
          }
          const vcx = svx / b.totalMass;
          const vcy = svy / b.totalMass;
          const vcz = svz / b.totalMass;

          let lx = 0;
          let ly = 0;
          let lz = 0;
          let inertia = 0;
          for (const n of b.nodes) {
            const rx = n.x - b.cx;
            const ry = n.y - b.cy;
            const rz = n.z - b.cz;
            const dvx = n.vx - vcx;
            const dvy = n.vy - vcy;
            const dvz = n.vz - vcz;
            lx += n.m * (ry * dvz - rz * dvy);
            ly += n.m * (rz * dvx - rx * dvz);
            lz += n.m * (rx * dvy - ry * dvx);
            inertia += n.m * (rx * rx + ry * ry + rz * rz);
          }
          const invI = inertia > 1e-4 ? 1.5 / inertia : 0;
          const wx = lx * invI;
          const wy = ly * invI;
          const wz = lz * invI;

          const vibDamp = baseVibDamp * (1 + b.frozen * 3.0);
          const dampFactor = Math.exp(-vibDamp * subDt);
          const airDrag = Math.exp(-0.14 * subDt);
          const maxStretch = b.boundRadius * 2.15;
          let vibSum = 0;

          for (const n of b.nodes) {
            const rx = n.x - b.cx;
            const ry = n.y - b.cy;
            const rz = n.z - b.cz;
            const rvx = vcx + (wy * rz - wz * ry);
            const rvy = vcy + (wz * rx - wx * rz);
            const rvz = vcz + (wx * ry - wy * rx);

            const dvx = (n.vx - rvx) * dampFactor;
            const dvy = (n.vy - rvy) * dampFactor;
            const dvz = (n.vz - rvz) * dampFactor;

            n.vx = rvx * airDrag + dvx;
            n.vy = rvy * airDrag + dvy;
            n.vz = rvz * airDrag + dvz;

            n.x += n.vx * subDt;
            n.y += n.vy * subDt;
            n.z += n.vz * subDt;

            const sdx = n.x - b.cx;
            const sdy = n.y - b.cy;
            const sdz = n.z - b.cz;
            const sd = Math.hypot(sdx, sdy, sdz);
            if (sd > maxStretch) {
              const k = maxStretch / sd;
              n.x = b.cx + sdx * k;
              n.y = b.cy + sdy * k;
              n.z = b.cz + sdz * k;
            }
            vibSum += Math.hypot(dvx, dvy, dvz);
          }
          b.jiggleEnergy = Math.min(2.0, vibSum / (b.nodes.length * 4.5));
        }

        // 5. 3D Bear-to-Bear Node Sphere Collisions
        const count = this.bears.length;
        for (let i = 0; i < count; i++) {
          const A = this.bears[i];
          for (let j = i + 1; j < count; j++) {
            const B = this.bears[j];
            const cdx = B.cx - A.cx;
            const cdy = B.cy - A.cy;
            const cdz = B.cz - A.cz;
            const rSum = A.boundRadius + B.boundRadius;
            if (cdx * cdx + cdy * cdy + cdz * cdz > rSum * rSum) continue;

            for (let ni = 0; ni < A.nodes.length; ni++) {
              const na = A.nodes[ni];
              for (let nj = 0; nj < B.nodes.length; nj++) {
                const nb = B.nodes[nj];
                const dx = nb.x - na.x;
                const dy = nb.y - na.y;
                const dz = nb.z - na.z;
                const minDist = (na.r + nb.r) * 0.86;
                const dSq = dx * dx + dy * dy + dz * dz;
                if (dSq >= minDist * minDist || dSq < 1e-6) continue;

                const dist = Math.sqrt(dSq);
                const nx = dx / dist;
                const ny = dy / dist;
                const nz = dz / dist;
                const overlap = minDist - dist;

                const invMTotal = 1 / (na.m + nb.m);
                const wA = nb.m * invMTotal;
                const wB = na.m * invMTotal;

                na.x -= nx * overlap * wA * 0.65;
                na.y -= ny * overlap * wA * 0.65;
                na.z -= nz * overlap * wA * 0.65;
                nb.x += nx * overlap * wB * 0.65;
                nb.y += ny * overlap * wB * 0.65;
                nb.z += nz * overlap * wB * 0.65;

                const vn = (nb.vx - na.vx) * nx + (nb.vy - na.vy) * ny + (nb.vz - na.vz) * nz;
                if (vn < 0) {
                  const rest = this.bounciness * 0.85;
                  const imp = -(1 + rest) * vn / (1 / na.m + 1 / nb.m);
                  na.vx -= (imp / na.m) * nx;
                  na.vy -= (imp / na.m) * ny;
                  na.vz -= (imp / na.m) * nz;
                  nb.vx += (imp / nb.m) * nx;
                  nb.vy += (imp / nb.m) * ny;
                  nb.vz += (imp / nb.m) * nz;

                  if (-vn > maxImpactSpeed) maxImpactSpeed = -vn;
                  if (-vn > 12.5) {
                    if (A.frozen > 0.5) this.shatterBearIce(A);
                    if (B.frozen > 0.5) this.shatterBearIce(B);
                  }
                }
              }
            }
          }
        }

        // 6. Spinning Peppermint Sweeper Bar Collisions
        if (this.sweeper.enabled) {
          const sw = this.sweeper;
          const ca = Math.cos(sw.angle);
          const sa = Math.sin(sw.angle);
          const ax = sw.x - ca * sw.halfLen;
          const az = sw.z - sa * sw.halfLen;
          const bx = sw.x + ca * sw.halfLen;
          const bz = sw.z + sa * sw.halfLen;
          const abx = bx - ax;
          const abz = bz - az;
          const abLenSq = abx * abx + abz * abz;

          for (const b of this.bears) {
            if (b.cy - b.boundRadius > sw.y + sw.radius + 0.5) continue;
            for (const n of b.nodes) {
              const t = Math.max(0, Math.min(1, ((n.x - ax) * abx + (n.z - az) * abz) / abLenSq));
              const qx = ax + abx * t;
              const qy = sw.y;
              const qz = az + abz * t;
              const dx = n.x - qx;
              const dy = n.y - qy;
              const dz = n.z - qz;
              const minD = n.r + sw.radius;
              const dSq = dx * dx + dy * dy + dz * dz;
              if (dSq < minD * minD && dSq > 1e-6) {
                const d = Math.sqrt(dSq);
                const nx = dx / d;
                const ny = dy / d;
                const nz = dz / d;
                n.x = qx + nx * minD;
                n.y = qy + ny * minD;
                n.z = qz + nz * minD;

                // Tangential velocity of rotating bar at (qx, qz)
                const rx = qx - sw.x;
                const rz = qz - sw.z;
                const barVx = -sw.speed * rz;
                const barVz = sw.speed * rx;
                n.vx = barVx * 1.25 + nx * 5.5;
                n.vy = Math.max(n.vy, 6.5);
                n.vz = barVz * 1.25 + nz * 5.5;
                maxImpactSpeed = Math.max(maxImpactSpeed, 9.5);
              }
            }
          }
        }

        // 6b. Upward Wind Tunnel / Floor Fan
        if (this.fan.enabled) {
          const fn = this.fan;
          for (const b of this.bears) {
            if (b.isHeld || b.isStolen || b.glued) continue;
            const dx = b.cx - fn.x;
            const dz = b.cz - fn.z;
            const dSq = dx * dx + dz * dz;
            if (dSq < fn.radius * fn.radius && b.cy < 13.5) {
              const heightFalloff = Math.max(0.25, 1 - b.cy / 15.0);
              const lift = fn.strength * heightFalloff * subDt;
              const swirl = 7.5 * subDt;
              for (const n of b.nodes) {
                n.vy += lift;
                n.vx += (-dz * swirl) * 0.25;
                n.vz += (dx * swirl) * 0.25;
              }
            }
          }
        }

        // 6c. Pinball Bumpers & Floor Launch Pads
        if (this.bumpers.enabled) {
          for (const b of this.bears) {
            if (b.isHeld || b.isStolen) continue;
            for (const post of this.bumpers.posts) {
              if (b.cy > post.height + b.boundRadius) continue;
              const dx = b.cx - post.x;
              const dz = b.cz - post.z;
              const d = Math.hypot(dx, dz);
              const minD = post.radius + b.boundRadius * 0.85;
              if (d < minD && d > 1e-4) {
                const ux = dx / d;
                const uz = dz / d;
                const push = minD - d;
                for (const n of b.nodes) {
                  n.x += ux * push;
                  n.z += uz * push;
                  n.vx = ux * 15.5;
                  n.vy = Math.max(n.vy, 7.2);
                  n.vz = uz * 15.5;
                }
                if (post.pulse < 0.45) {
                  post.pulse = 1.0;
                  this.score += 2;
                  if (this.timeAttack.active) this.timeAttack.score += 2;
                  this.spawnParticles(post.x + ux * post.radius, 1.1, post.z + uz * post.radius, post.color, 14, 1.2);
                  b.exciteJiggle(7.0);
                  if (this.onBumperHit) this.onBumperHit(this.score, post, b);
                }
              }
            }
            for (const pad of this.bumpers.pads) {
              if (b.cy > 1.35 * b.scale) continue;
              const d = Math.hypot(b.cx - pad.x, b.cz - pad.z);
              if (d < pad.radius && pad.pulse < 0.3) {
                pad.pulse = 1.0;
                for (const n of b.nodes) {
                  n.vx = pad.vx;
                  n.vy = pad.vy;
                  n.vz = pad.vz;
                }
                b.exciteJiggle(7.5);
                this.spawnParticles(pad.x, 0.35, pad.z, [0.18, 1.0, 0.72], 16, 1.2);
                if (this.onTrampoline) this.onTrampoline(b);
              }
            }
          }
        }

        // 7. Room Floor, Trampoline, Walls, Ceiling Collisions & Glue Anchors
        const rest = this.bounciness;
        const bx = this.boundsX;
        const bz = this.boundsZ;
        const tramp = this.trampoline;

        for (const b of this.bears) {
          // Glued bear stays stuck to wall/ceiling anchor
          if (b.glued && !b.isHeld && !b.isStolen) {
            const gx = b.glued.x;
            const gy = b.glued.y;
            const gz = b.glued.z;
            const dx = gx - b.cx;
            const dy = gy - b.cy;
            const dz = gz - b.cz;
            for (const n of b.nodes) {
              n.vx += (dx * 55 - n.vx * 8) * subDt;
              n.vy += (dy * 55 - n.vy * 8 - gravity) * subDt;
              n.vz += (dz * 55 - n.vz * 8) * subDt;
            }
          }

          const extraBounce = (b.flavor.isGold ? 1.12 : 1.0) * (b.flavor.isSpicy ? 1.22 : 1.0) + (b.heat > 0.15 ? 0.16 * b.heat : 0);
          const bRest = Math.min(0.99, rest * extraBounce);
          const friction = b.frozen > 0.5 ? 0.997 : Math.pow(0.86, 1 / substeps);

          let hitTrampoline = false;
          let bearHardImpact = 0;

          for (const n of b.nodes) {
            const pad = n.r * 0.88;

            // Floor & Trampoline check
            let floorH = pad;
            let onTramp = false;
            if (tramp.enabled) {
              const tdSq = (n.x - tramp.x) ** 2 + (n.z - tramp.z) ** 2;
              if (tdSq < tramp.radius * tramp.radius) {
                floorH = 0.24 + pad;
                onTramp = true;
              }
            }

            if (n.y < floorH) {
              n.y = floorH;
              if (n.vy < 0) {
                const impSpd = -n.vy;
                if (impSpd > maxImpactSpeed) maxImpactSpeed = impSpd;
                if (impSpd > bearHardImpact) bearHardImpact = impSpd;
                if (impSpd > 13.5 && b.frozen > 0.5) {
                  this.shatterBearIce(b);
                }
                if (onTramp && impSpd > 1.8) {
                  n.vy = Math.max(15.2, impSpd * 1.38);
                  hitTrampoline = true;
                } else {
                  n.vy = impSpd * bRest;
                }
                n.vx *= friction;
                n.vz *= friction;
              }
            } else if (!b.isBlessedHold && n.y > this.ceilingY - pad) {
              n.y = this.ceilingY - pad;
              if (n.vy > 0) n.vy = -n.vy * bRest;
            }

            if (!b.isStolen && !b.flavor.isGhost) {
              if (n.x < -bx + pad) {
                n.x = -bx + pad;
                if (n.vx < 0) {
                  if (-n.vx > maxImpactSpeed) maxImpactSpeed = -n.vx;
                  if (-n.vx > bearHardImpact) bearHardImpact = -n.vx;
                  if (-n.vx > 13.5 && b.frozen > 0.5) this.shatterBearIce(b);
                  n.vx = -n.vx * bRest;
                }
              } else if (n.x > bx - pad) {
                n.x = bx - pad;
                if (n.vx > 0) {
                  if (n.vx > maxImpactSpeed) maxImpactSpeed = n.vx;
                  if (n.vx > bearHardImpact) bearHardImpact = n.vx;
                  if (n.vx > 13.5 && b.frozen > 0.5) this.shatterBearIce(b);
                  n.vx = -n.vx * bRest;
                }
              }
            }

            if (!b.flavor.isGhost) {
              if (n.z < -bz + pad) {
                n.z = -bz + pad;
                if (n.vz < 0) {
                  if (-n.vz > maxImpactSpeed) maxImpactSpeed = -n.vz;
                  if (-n.vz > bearHardImpact) bearHardImpact = -n.vz;
                  if (-n.vz > 13.5 && b.frozen > 0.5) this.shatterBearIce(b);
                  n.vz = -n.vz * bRest;
                }
              } else if (n.z > bz - pad) {
                n.z = bz - pad;
                if (n.vz > 0) {
                  if (n.vz > maxImpactSpeed) maxImpactSpeed = n.vz;
                  if (n.vz > bearHardImpact) bearHardImpact = n.vz;
                  if (n.vz > 13.5 && b.frozen > 0.5) this.shatterBearIce(b);
                  n.vz = -n.vz * bRest;
                }
              }
            }
          }

          // Ghost Bear phases through arena walls and wraps cleanly to the opposite side!
          if (b.flavor.isGhost && !b.isStolen && !b.isHeld) {
            let wrapX = 0;
            let wrapZ = 0;
            if (b.cx < -bx - 0.8) wrapX = bx * 2;
            else if (b.cx > bx + 0.8) wrapX = -bx * 2;
            if (b.cz < -bz - 0.8) wrapZ = bz * 2;
            else if (b.cz > bz + 0.8) wrapZ = -bz * 2;
            if (wrapX !== 0 || wrapZ !== 0) {
              this.spawnParticles(b.cx, b.cy, b.cz, [0.72, 0.94, 1.0], 10, 0.8);
              for (const n of b.nodes) {
                n.x += wrapX;
                n.z += wrapZ;
              }
            }
          }

          // Electric Lemon zaps nearby bears on hard impacts!
          if (b.flavor.isElectric && bearHardImpact > 7.5 && b.electricCooldown <= 0) {
            b.electricCooldown = 0.65;
            this.shockwaves.push({ x: b.cx, y: Math.max(0.25, b.cy), z: b.cz, r: 0.4, maxR: 5.5, alpha: 0.9 });
            this.spawnParticles(b.cx, b.cy + 0.4, b.cz, [0.55, 1.0, 1.0], 18, 1.3);
            for (const other of this.bears) {
              if (other === b || other.isStolen) continue;
              const dx = other.cx - b.cx;
              const dz = other.cz - b.cz;
              const d = Math.hypot(dx, dz);
              if (d < 5.5) {
                const ux = d > 0.05 ? dx / d : 1;
                const uz = d > 0.05 ? dz / d : 0;
                other.applyImpulse(ux * 7.5, 6.2, uz * 7.5, 4, 4, 4);
                other.exciteJiggle(8.0);
              }
            }
            if (this.onElectricZap) this.onElectricZap(b);
          }

          if (hitTrampoline) {
            tramp.pulse = 1.0;
            b.exciteJiggle(6.5);
            if (this.onTrampoline) this.onTrampoline(b);
          }

          b.updateShapeFrame();
          b.syncGpuNodes();
        }
      }

      if (maxImpactSpeed > 4.2 && this.onSquish) {
        this.onSquish(Math.min(1, (maxImpactSpeed - 3.5) / 18));
      }

      // 7b. 3D Portal Gun Teleportation
      if (this.portals.a && this.portals.b) {
        const pa = this.portals.a;
        const pb = this.portals.b;
        for (const b of this.bears) {
          if (b.isHeld || b.isStolen || b.portalCooldown > 0) continue;
          const da = Math.hypot(b.cx - pa.x, b.cy - pa.y, b.cz - pa.z);
          const db = Math.hypot(b.cx - pb.x, b.cy - pb.y, b.cz - pb.z);
          let src = null;
          let dst = null;
          if (da < pa.radius + b.boundRadius * 0.45) {
            src = pa;
            dst = pb;
          } else if (db < pb.radius + b.boundRadius * 0.45) {
            src = pb;
            dst = pa;
          }
          if (src && dst) {
            b.portalCooldown = 0.72;
            b.glued = null;
            const ox = dst.x - b.cx;
            const oy = dst.y - b.cy;
            const oz = dst.z - b.cz;
            const spd = Math.hypot(b.vx, b.vy, b.vz);
            const boost = spd < 8.5 ? (9.5 / Math.max(0.5, spd)) : 1.16;
            for (const n of b.nodes) {
              n.x += ox;
              n.y += oy;
              n.z += oz;
              n.vx *= boost;
              n.vy = Math.max(4.5, n.vy * boost);
              n.vz *= boost;
            }
            b.updateShapeFrame();
            b.syncGpuNodes();
            b.exciteJiggle(7.0);
            src.pulse = 1.0;
            dst.pulse = 1.0;
            this.spawnParticles(src.x, src.y, src.z, [0.12, 0.86, 1.0], 14, 1.1);
            this.spawnParticles(dst.x, dst.y, dst.z, [1.0, 0.48, 0.08], 18, 1.25);
            if (this.onPortalJump) this.onPortalJump(b);
          }
        }
      }

      // 8. Check 3D Candy Hoop Plane Crossings & Combos
      const nowSec = performance.now() * 0.001;
      for (const b of this.bears) {
        if (b.isHeld || nowSec - b.lastHoopTime < 0.75) continue;
        for (const h of this.hoops) {
          if (!h.enabled) continue;
          // Hoop faces Z axis (plane z = h.z)
          const crossedZ = (b.prevCz - h.z) * (b.cz - h.z) <= 0;
          const radialDist = Math.hypot(b.cx - h.x, b.cy - h.y);
          const speed = Math.hypot(b.vx, b.vy, b.vz);
          if (crossedZ && radialDist < h.radius * 0.85 && speed > 3.2) {
            b.lastHoopTime = nowSec;
            this.combo += 1;
            this.comboTimer = 4.5;
            const pts = (b.flavor.points || 1) * this.combo;
            this.score += pts;
            if (this.timeAttack.active) {
              this.timeAttack.score += pts;
              this.timeAttack.maxCombo = Math.max(this.timeAttack.maxCombo, this.combo);
            }
            h.pulse = 1.0;
            this.spawnParticles(h.x, h.y, h.z, [1.0, 0.84, 0.12], 24, 1.35);
            this.spawnParticles(h.x, h.y, h.z, b.flavor.particle, 14, 1.15);
            if (this.onScore) this.onScore(this.score, this.combo, pts, b);
            break;
          }
        }
      }

      // 9. Step 3D Particles & Shockwave Rings
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += gravity * 0.65 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        if (p.y < p.size) {
          p.y = p.size;
          p.vy = Math.abs(p.vy) * 0.55;
        }
        p.life -= p.decay * dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const w = this.shockwaves[i];
        w.r += (w.maxR - w.r) * Math.min(1, dt * 7.5);
        w.alpha -= rawDt * 1.9;
        if (w.alpha <= 0) this.shockwaves.splice(i, 1);
      }
    }
  }

  window.GummyApp = window.GummyApp || {};
  window.GummyApp.FLAVORS_3D = FLAVORS;
  window.GummyApp.PhysicsWorld3D = PhysicsWorld3D;
})();
