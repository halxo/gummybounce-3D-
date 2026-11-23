(() => {
  'use strict';

  const { audio, buildGummyBearMesh, buildThiefManMesh, buildTorusMesh, buildCylinderMesh, buildSphereMesh } = window.GummyApp;

  const FLAVORS_4D = [
    { id: 'cyan', name: 'Hyper Cyan', rgb: [0.10, 0.88, 1.0], core: [0.72, 0.98, 1.0], pts: 2 },
    { id: 'cherry', name: 'Cherry Nova', rgb: [1.0, 0.14, 0.36], core: [1.0, 0.62, 0.74], pts: 2 },
    { id: 'mango', name: 'Mango Tesseract', rgb: [1.0, 0.68, 0.08], core: [1.0, 0.94, 0.56], pts: 2 },
    { id: 'grape', name: 'Quantum Grape', rgb: [0.64, 0.22, 1.0], core: [0.88, 0.66, 1.0], pts: 2 },
    { id: 'lime', name: 'Neon Lime', rgb: [0.24, 0.96, 0.42], core: [0.72, 1.0, 0.78], pts: 2 },
    { id: 'gold', name: '24K 4D Gold', rgb: [1.0, 0.78, 0.14], core: [1.0, 0.98, 0.76], pts: 5, isGold: true }
  ];

  // =========================================================================
  // 4D MATH & TESSERACT PROJECTION
  // =========================================================================
  function project4Dto3D(x, y, z, w, wCam, xwRad, zwRad) {
    // Rotate in XW and ZW 4D planes around center (0, 3, 0, wCam)
    const dw = w - wCam;
    const cxw = Math.cos(xwRad), sxw = Math.sin(xwRad);
    const x1 = x * cxw - dw * sxw;
    const w1 = x * sxw + dw * cxw;

    const czw = Math.cos(zwRad), szw = Math.sin(zwRad);
    const z2 = z * czw - w1 * szw;
    const w2 = z * szw + w1 * czw;

    const wDist = Math.max(2.2, 7.5 - w2);
    const p4 = 7.5 / wDist;
    return [x1 * p4, y, z2 * p4, w2, p4];
  }

  // 16 vertices & 32 edges of a 4D Hypercube (Tesseract)
  const TESSERACT_VERTS = [];
  for (let i = 0; i < 16; i++) {
    TESSERACT_VERTS.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1
    ]);
  }
  const TESSERACT_EDGES = [];
  for (let i = 0; i < 16; i++) {
    for (let bit = 0; bit < 4; bit++) {
      const j = i ^ (1 << bit);
      if (i < j) TESSERACT_EDGES.push([i, j]);
    }
  }

  // =========================================================================
  // 4D PHYSICS WORLD (X, Y, Z, W)
  // =========================================================================
  class World4D {
    constructor() {
      this.bears = [];
      this.particles = [];
      this.shockwaves = [];
      this.blackHoles = [];
      this.bounds = { x: 10.5, y: 15.0, z: 8.0, w: 5.0 };
      this.gravity = -21.0;
      this.bounciness = 0.80;
      this.score = 0;
      this.wCam = 0.0;
      this.xwAngle = 0.31;
      this.zwAngle = -0.21;
      this.autoRotate4D = true;
      this.activeField = null;
      this.grab = null;
      this.slingshot = null;

      this.hoops = [
        { x: 4.5, y: 4.8, baseY: 4.8, z: -2.8, w: 0.0, radius: 1.65, phase: 0, pulse: 0 },
        { x: -4.5, y: 5.5, baseY: 5.5, z: -3.4, w: 2.0, radius: 1.55, phase: 2.1, pulse: 0 }
      ];
      this.trampoline = { x: 0, z: 2.2, w: 0, radius: 2.35, pulse: 0 };

      this.boss = {
        active: false,
        hp: 120,
        maxHp: 120,
        x: 0, z: -2.0, w: 0,
        yaw: 0,
        targetX: 0, targetZ: 0, targetW: 0,
        phaseTimer: 4.5,
        hitFlash: 0,
        animTime: 0
      };

      this.onScore = null;
      this.onBossUpdate = null;
      this.onToast = null;
    }

    spawnBear(x = 0, y = 7, z = 0, w = null, flavorIdx = -1, scale = 1.0) {
      const flv = flavorIdx >= 0
        ? FLAVORS_4D[flavorIdx % FLAVORS_4D.length]
        : FLAVORS_4D[Math.floor(Math.random() * FLAVORS_4D.length)];
      const bw = w !== null ? w : this.wCam + (Math.random() - 0.5) * 4.5;
      const bear = {
        id: Math.random().toString(36).slice(2),
        flavor: flv,
        scale,
        x, y, z, w: Math.max(-this.bounds.w, Math.min(this.bounds.w, bw)),
        vx: (Math.random() - 0.5) * 4,
        vy: 0,
        vz: (Math.random() - 0.5) * 4,
        vw: (Math.random() - 0.5) * 3.5,
        rx: 0, ry: (Math.random() - 0.5) * 1.2, rz: 0,
        vrx: (Math.random() - 0.5) * 2,
        vry: (Math.random() - 0.5) * 2,
        vrz: (Math.random() - 0.5) * 2,
        frozen: 0,
        yamBoost: 0,
        yamPinned: false,
        jiggle: 0,
        ripple: 0,
        lastHoop: 0
      };
      this.bears.push(bear);
      return bear;
    }

    populate() {
      for (let i = 0; i < 9; i++) {
        this.spawnBear(
          (Math.random() - 0.5) * 9,
          3.5 + i * 0.9,
          (Math.random() - 0.5) * 5,
          (i - 4) * 0.95
        );
      }
    }

    spawnParticles(x, y, z, w, col, count = 12, spd = 1.0) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x, y, z, w,
          vx: (Math.random() - 0.5) * 10 * spd,
          vy: (Math.random() * 8 + 2) * spd,
          vz: (Math.random() - 0.5) * 10 * spd,
          vw: (Math.random() - 0.5) * 6 * spd,
          r: col[0], g: col[1], b: col[2],
          size: 0.11 + Math.random() * 0.08,
          life: 0.8 + Math.random() * 0.5
        });
      }
    }

    yamQuake() {
      for (const b of this.bears) {
        if (b.yamPinned) continue;
        b.vy += 9.5 + b.yamBoost * 2.5;
        b.vw += (Math.random() - 0.5) * 7.0;
        b.jiggle = 1.0;
        b.ripple = 1.0;
        if (b.yamBoost >= 1.0) {
          this.shockwaves.push({ x: b.x, y: 0.25, z: b.z, w: b.w, r: 0.5, maxR: 5.5, alpha: 0.9 });
        }
      }
    }

    wPhaseZap() {
      for (const b of this.bears) {
        b.w = this.wCam + (Math.random() - 0.5) * 0.6;
        b.vw = 0;
        b.vy += 6.5;
        b.jiggle = 1.0;
        this.spawnParticles(b.x, b.y, b.z, b.w, [0.22, 0.95, 1.0], 10, 1.0);
      }
      this.shockwaves.push({ x: 0, y: 1.5, z: 0, w: this.wCam, r: 0.8, maxR: 12.0, alpha: 0.95 });
    }

    toggleBoss() {
      this.boss.active = !this.boss.active;
      if (this.boss.active) {
        this.boss.hp = this.boss.maxHp;
        this.boss.x = 0;
        this.boss.z = -2.5;
        this.boss.w = this.wCam;
        this.boss.phaseTimer = 4.5;
        this.shockwaves.push({ x: 0, y: 0.3, z: -2.5, w: this.wCam, r: 0.7, maxR: 9.0, alpha: 1.0 });
      }
      if (this.onBossUpdate) this.onBossUpdate();
    }

    step(rawDt) {
      const dt = Math.min(Math.max(rawDt, 0.001), 1 / 30);
      if (this.autoRotate4D) {
        this.xwAngle += dt * 0.28;
        this.zwAngle += dt * 0.19;
      }

      for (const h of this.hoops) {
        h.phase += dt * 1.8;
        h.y = h.baseY + Math.sin(h.phase) * 0.85;
        h.w = Math.sin(h.phase * 0.6) * 3.2;
        h.pulse = Math.max(0, h.pulse - dt * 2.5);
      }
      this.trampoline.pulse = Math.max(0, this.trampoline.pulse - dt * 3.0);

      // Active field tools
      if (this.activeField) {
        const fld = this.activeField;
        if (fld.type === 'yams') {
          for (const b of this.bears) {
            const d = Math.hypot(b.x - fld.x, b.y - (fld.y + 1.1), b.z - fld.z, (b.w - this.wCam) * 0.8);
            if (d < 4.2 + b.scale) {
              b.yamPinned = true;
              b.vx = 0; b.vy = 0; b.vz = 0; b.vw = 0;
              b.yamBoost = Math.max(0, Math.min(3.2, b.yamBoost + (fld.shrink ? -1.8 : 1.8) * dt));
              if (Math.random() < 0.35) this.spawnParticles(b.x, b.y, b.z, b.w, [0.98, 0.54, 0.14], 1, 0.6);
            }
          }
        } else if (fld.type === 'puff') {
          const toSplit = [];
          for (const b of this.bears) {
            const d = Math.hypot(b.x - fld.x, b.y - (fld.y + 1.1), b.z - fld.z, (b.w - this.wCam) * 0.7);
            if (d < 4.0 + b.scale) {
              b.scale += (fld.shrink ? -1.1 : 1.1) * dt;
              b.scale = Math.max(0.45, b.scale);
              b.jiggle = 1.0;
              if (b.scale > 2.25 && this.bears.length < 32) toSplit.push(b);
            }
          }
          for (const big of toSplit) {
            const idx = this.bears.indexOf(big);
            if (idx !== -1) this.bears.splice(idx, 1);
            this.spawnParticles(big.x, big.y, big.z, big.w, big.flavor.rgb, 24, 1.4);
            for (let k = 0; k < 3; k++) {
              const baby = this.spawnBear(big.x, big.y + 0.4, big.z, big.w + (k - 1) * 0.5, -1, 0.65);
              baby.vy = 10;
            }
            audio.playPopSplit();
          }
        } else if (fld.type === 'cryo') {
          for (const b of this.bears) {
            const d = Math.hypot(b.x - fld.x, b.y - (fld.y + 1.1), b.z - fld.z, (b.w - this.wCam) * 0.7);
            if (d < 4.0 + b.scale) b.frozen = Math.min(1, b.frozen + dt * 2.5);
          }
        } else if (fld.type === 'vortex') {
          for (const b of this.bears) {
            if (b.yamPinned) continue;
            const dx = fld.x - b.x;
            const dz = fld.z - b.z;
            const dw = this.wCam - b.w;
            const d = Math.hypot(dx, dz, dw);
            if (d < 9.0) {
              b.vx += (dx * 5 - dz * 12) * dt;
              b.vz += (dz * 5 + dx * 12) * dt;
              b.vw += dw * 6 * dt;
              b.vy += 26.0 * dt;
            }
          }
        }
      }

      for (const b of this.bears) {
        if (!this.activeField || this.activeField.type !== 'yams') b.yamPinned = false;
      }

      // 4D Black Holes
      for (let i = this.blackHoles.length - 1; i >= 0; i--) {
        const bh = this.blackHoles[i];
        bh.life -= dt;
        for (const b of this.bears) {
          if (b.yamPinned) continue;
          const dx = bh.x - b.x, dy = bh.y - b.y, dz = bh.z - b.z, dw = bh.w - b.w;
          const d = Math.hypot(dx, dy, dz, dw) || 0.2;
          if (d < 12) {
            const p = 32 * dt / Math.max(1.2, d);
            b.vx += dx * p; b.vy += dy * p; b.vz += dz * p; b.vw += dw * p;
          }
        }
        if (bh.life <= 0) {
          this.shockwaves.push({ x: bh.x, y: bh.y, z: bh.z, w: bh.w, r: 0.5, maxR: 11, alpha: 1 });
          for (const b of this.bears) {
            const dx = b.x - bh.x, dy = b.y - bh.y, dz = b.z - bh.z, dw = b.w - bh.w;
            const d = Math.hypot(dx, dy, dz, dw) || 0.2;
            if (d < 9) {
              b.vx += (dx / d) * 16; b.vy += 12; b.vz += (dz / d) * 16; b.vw += (dw / d) * 12;
            }
          }
          this.blackHoles.splice(i, 1);
        }
      }

      // 4D Obtuse Titan Boss
      if (this.boss.active) {
        const bs = this.boss;
        bs.animTime += dt;
        bs.hitFlash = Math.max(0, bs.hitFlash - dt * 4);
        bs.phaseTimer -= dt;
        if (bs.phaseTimer <= 0) {
          bs.phaseTimer = 4.2;
          bs.w = (Math.random() - 0.5) * 7.0;
          this.shockwaves.push({ x: bs.x, y: 0.3, z: bs.z, w: bs.w, r: 0.6, maxR: 7.5, alpha: 0.95 });
          if (this.onToast) this.onToast(`👹 4D Boss phase-shifted to W = ${bs.w.toFixed(1)}!`);
        }
        const dtx = bs.targetX - bs.x, dtz = bs.targetZ - bs.z;
        const td = Math.hypot(dtx, dtz);
        if (td < 1.2) {
          bs.targetX = (Math.random() - 0.5) * 12;
          bs.targetZ = (Math.random() - 0.5) * 9;
        } else {
          bs.x += (dtx / td) * 3.4 * dt;
          bs.z += (dtz / td) * 3.4 * dt;
          bs.yaw = Math.atan2(dtx, dtz);
        }
        for (const b of this.bears) {
          const d4 = Math.hypot(b.x - bs.x, (b.y - 2.4) * 0.7, b.z - bs.z, b.w - bs.w);
          const spd = Math.hypot(b.vx, b.vy, b.vz, b.vw);
          if (d4 < 2.6 + b.scale && spd > 6.0) {
            const dmg = Math.round(Math.min(35, spd * (b.yamBoost >= 1.5 ? 2.0 : 1.0)));
            bs.hp = Math.max(0, bs.hp - dmg);
            bs.hitFlash = 1.0;
            b.vx = -b.vx * 0.9; b.vy = 9; b.vz = -b.vz * 0.9;
            audio.playBossHit();
            this.spawnParticles(bs.x, 2.5, bs.z, bs.w, [1.0, 0.85, 0.15], 20, 1.4);
            if (bs.hp <= 0) {
              bs.active = false;
              this.score += 75;
              audio.playBossDefeat();
              if (this.onScore) this.onScore(this.score);
              if (this.onToast) this.onToast('👑 4D OBTUSE TITAN DEFEATED! +75 pts!');
            }
            if (this.onBossUpdate) this.onBossUpdate();
            break;
          }
        }
      }

      // Step 4D Bears
      const nowSec = performance.now() * 0.001;
      for (const b of this.bears) {
        b.jiggle = Math.max(0, b.jiggle - dt * 2.4);
        b.ripple = Math.max(0, b.ripple - dt * 2.2);
        if (b.yamPinned || (this.grab && this.grab.bear === b) || (this.slingshot && this.slingshot.bear === b)) {
          if (this.grab && this.grab.bear === b) {
            b.x += (this.grab.x - b.x) * Math.min(1, dt * 18);
            b.y += (this.grab.y - b.y) * Math.min(1, dt * 18);
            b.z += (this.grab.z - b.z) * Math.min(1, dt * 18);
            b.w += (this.wCam - b.w) * Math.min(1, dt * 10);
          }
          continue;
        }

        const prevZ = b.z;
        b.vy += this.gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;
        b.w += b.vw * dt;

        b.rx += b.vrx * dt;
        b.ry += b.vry * dt;
        b.rz += b.vrz * dt;
        b.vrx *= 0.98; b.vry *= 0.98; b.vrz *= 0.98;

        const pad = 0.9 * b.scale;
        // Floor + 4D Hyper-Trampoline
        if (b.y < pad) {
          b.y = pad;
          const imp = -b.vy;
          if (imp > 2.0) {
            const onTramp = Math.hypot(b.x - this.trampoline.x, b.z - this.trampoline.z, b.w - this.trampoline.w) < this.trampoline.radius + 0.6;
            const yamBounce = b.yamBoost >= 1.2 ? 1.32 : 1.0;
            if (onTramp) {
              b.vy = Math.max(16.0, imp * 1.38);
              this.trampoline.pulse = 1.0;
              audio.playTrampoline();
            } else {
              b.vy = imp * this.bounciness * yamBounce;
              if (imp > 5.0) audio.playSquish(Math.min(1, imp / 18));
            }
            if (imp > 6.5) { b.jiggle = 1.0; b.ripple = 1.0; }
            b.vx *= 0.92; b.vz *= 0.92; b.vw *= 0.92;
          } else {
            b.vy = 0;
          }
        } else if (b.y > this.bounds.y - pad) {
          b.y = this.bounds.y - pad;
          if (b.vy > 0) b.vy = -b.vy * this.bounciness;
        }

        // X, Z, W 4D Hypercube wall bounces
        if (b.x < -this.bounds.x + pad) { b.x = -this.bounds.x + pad; b.vx = Math.abs(b.vx) * this.bounciness; }
        if (b.x > this.bounds.x - pad) { b.x = this.bounds.x - pad; b.vx = -Math.abs(b.vx) * this.bounciness; }
        if (b.z < -this.bounds.z + pad) { b.z = -this.bounds.z + pad; b.vz = Math.abs(b.vz) * this.bounciness; }
        if (b.z > this.bounds.z - pad) { b.z = this.bounds.z - pad; b.vz = -Math.abs(b.vz) * this.bounciness; }
        if (b.w < -this.bounds.w) { b.w = -this.bounds.w; b.vw = Math.abs(b.vw) * 0.92; }
        if (b.w > this.bounds.w) { b.w = this.bounds.w; b.vw = -Math.abs(b.vw) * 0.92; }

        // 4D Golden Hyper-Hoop scoring
        if (nowSec - b.lastHoop > 0.75) {
          for (const h of this.hoops) {
            const crossedZ = (prevZ - h.z) * (b.z - h.z) <= 0;
            const rDist = Math.hypot(b.x - h.x, b.y - h.y);
            const wDist = Math.abs(b.w - h.w);
            if (crossedZ && rDist < h.radius * 0.95 && wDist < 2.2) {
              b.lastHoop = nowSec;
              h.pulse = 1.0;
              this.score += b.flavor.pts * 2;
              audio.playScore(2);
              this.spawnParticles(h.x, h.y, h.z, h.w, [1.0, 0.85, 0.14], 24, 1.4);
              if (this.onScore) this.onScore(this.score);
              break;
            }
          }
        }
      }

      // Particles & shockwaves
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += -14 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.w += p.vw * dt;
        if (p.y < p.size) { p.y = p.size; p.vy = Math.abs(p.vy) * 0.5; }
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.r += (sw.maxR - sw.r) * Math.min(1, dt * 7);
        sw.alpha -= dt * 1.8;
        if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // 4D WEBGL2 RENDERER
  // =========================================================================
  const VS_4D = `#version 300 es
  precision highp float;
  layout(location = 0) in vec3 aPos;
  layout(location = 1) in vec3 aNormal;
  layout(location = 2) in float aPart;

  uniform mat4 uViewProj;
  uniform mat4 uModel;
  uniform float uYamBoost;
  uniform float uRipple;
  uniform float uTime;

  out vec3 vNormal;
  out vec3 vLocalPos;
  out float vPart;
  out vec3 vWorldPos;

  void main() {
    vec3 pos = aPos;
    vec3 norm = aNormal;
    if (uYamBoost > 0.001 && aPart < 0.5) {
      float side = pos.x >= 0.0 ? 1.0 : -1.0;
      vec3 c = vec3(side * 0.23, -0.42, -0.37);
      vec3 d = (pos - c) / vec3(0.36, 0.34, 0.36);
      float wY = exp(-dot(d, d) * 1.35) * smoothstep(-0.04, -0.24, pos.z);
      vec3 dir = normalize(vec3(side * 0.42 + (pos.x - c.x) * 0.85, (pos.y - c.y) * 0.65 - 0.06, -1.0));
      pos += dir * (uYamBoost * 0.34 * wY);
      norm = normalize(norm + dir * (uYamBoost * 0.35 * wY));
    }
    if (uRipple > 0.01 && aPart < 0.5) {
      float w = sin(pos.y * 8.5 - uTime * 22.0) * uRipple;
      pos.x *= 1.0 + w * 0.14;
      pos.z *= 1.0 + w * 0.14;
      pos.y *= 1.0 - w * 0.12;
    }
    vec4 wp = uModel * vec4(pos, 1.0);
    vWorldPos = wp.xyz;
    vNormal = mat3(uModel) * norm;
    vLocalPos = pos;
    vPart = aPart;
    gl_Position = uViewProj * wp;
  }`;

  const FS_4D = `#version 300 es
  precision highp float;
  in vec3 vNormal;
  in vec3 vLocalPos;
  in float vPart;
  in vec3 vWorldPos;

  uniform vec3 uCamPos;
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform float uAlpha;
  uniform float uFrozen;
  uniform float uWDelta;
  uniform float uTime;

  out vec4 fragColor;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vWorldPos);
    vec3 L = normalize(vec3(0.45, 0.85, 0.42));

    if (vPart > 0.5) {
      float spec = pow(max(dot(N, normalize(L + V)), 0.0), 80.0);
      fragColor = vec4(vec3(0.08, 0.03, 0.10) + vec3(spec), uAlpha);
      return;
    }

    vec3 base = uColor;
    vec3 core = uCore;
    if (uFrozen > 0.01) {
      base = mix(base, vec3(0.45, 0.88, 1.0), uFrozen * 0.7);
      core = mix(core, vec3(0.9, 0.98, 1.0), uFrozen * 0.8);
    }

    // 4D W-Dimension Phase Tint (Cyan for -W, Magenta-Gold for +W)
    float wMag = clamp(abs(uWDelta) / 4.0, 0.0, 1.0);
    vec3 wTint = uWDelta < 0.0 ? vec3(0.10, 0.88, 1.0) : vec3(1.0, 0.25, 0.82);

    float diff = clamp((dot(N, L) + 0.55) / 1.55, 0.0, 1.0);
    float caustic = 0.5 + 0.5 * sin(vLocalPos.x * 11.0 + uTime * 2.5) * cos(vLocalPos.y * 10.0 - uTime * 2.0);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.6);
    float spec = pow(max(dot(N, normalize(L + V)), 0.0), 95.0);

    vec3 col = mix(base * 0.55, base, diff);
    col = mix(col, core, 0.35 + caustic * 0.16);
    col = mix(col, wTint, wMag * 0.38);
    col += mix(core, wTint, 0.5) * fresnel * 0.65 + vec3(1.0) * spec * 0.85;
    fragColor = vec4(col, uAlpha);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function mat4Perspective(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
  }

  function mat4LookAt(out, eye, target, up) {
    let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    let len = Math.hypot(zx, zy, zz) || 1;
    zx /= len; zy /= len; zz /= len;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    len = Math.hypot(xx, xy, xz) || 1;
    xx /= len; xy /= len; xz /= len;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1;
  }

  function mat4Mul(out, a, b) {
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
  }

  function mat4TRS(out, tx, ty, tz, rx, ry, rz, sx, sy, sz) {
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
    out[12] = tx; out[13] = ty; out[14] = tz; out[15] = 1;
  }

  function mat4Align(out, ax, ay, az, bx, by, bz, r) {
    const mx = (ax + bx) * 0.5, my = (ay + by) * 0.5, mz = (az + bz) * 0.5;
    let dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.hypot(dx, dy, dz) || 0.001;
    dx /= len; dy /= len; dz /= len;
    let ux = 0, uy = 1, uz = 0;
    if (Math.abs(dy) > 0.95) { ux = 1; uy = 0; }
    let rx = uy * dz - uz * dy, ry = uz * dx - ux * dz, rz = ux * dy - uy * dx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl; ry /= rl; rz /= rl;
    const fx = dy * rz - dz * ry, fy = dz * rx - dx * rz, fz = dx * ry - dy * rx;
    out[0] = rx * r; out[1] = ry * r; out[2] = rz * r; out[3] = 0;
    out[4] = dx * len; out[5] = dy * len; out[6] = dz * len; out[7] = 0;
    out[8] = fx * r; out[9] = fy * r; out[10] = fz * r; out[11] = 0;
    out[12] = mx; out[13] = my; out[14] = mz; out[15] = 1;
  }

  class Renderer4D {
    constructor(canvas, world) {
      this.canvas = canvas;
      this.world = world;
      const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
      if (!gl) throw new Error('WebGL2 required for 4D Arena');
      this.gl = gl;
      this.cam = { yaw: 0.0, pitch: 0.34, distance: 20.5, target: [0, 2.5, 0], eye: [0, 8, 20] };
      this.proj = new Float32Array(16);
      this.view = new Float32Array(16);
      this.vp = new Float32Array(16);
      this.model = new Float32Array(16);

      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS_4D));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS_4D));
      gl.linkProgram(prog);
      this.prog = prog;
      this.locs = {
        uViewProj: gl.getUniformLocation(prog, 'uViewProj'),
        uModel: gl.getUniformLocation(prog, 'uModel'),
        uCamPos: gl.getUniformLocation(prog, 'uCamPos'),
        uColor: gl.getUniformLocation(prog, 'uColor'),
        uCore: gl.getUniformLocation(prog, 'uCore'),
        uAlpha: gl.getUniformLocation(prog, 'uAlpha'),
        uFrozen: gl.getUniformLocation(prog, 'uFrozen'),
        uWDelta: gl.getUniformLocation(prog, 'uWDelta'),
        uYamBoost: gl.getUniformLocation(prog, 'uYamBoost'),
        uRipple: gl.getUniformLocation(prog, 'uRipple'),
        uTime: gl.getUniformLocation(prog, 'uTime')
      };

      const makeVAO = (m, isInt = false) => {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const up = (loc, data, size) => {
          const b = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        };
        up(0, m.positions, 3);
        up(1, m.normals, 3);
        if (m.parts) up(2, m.parts, 1);
        else gl.vertexAttrib1f(2, 0.0);
        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.indices, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        return { vao, count: m.indexCount || m.indices.length, type: isInt ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
      };

      this.bearVAO = makeVAO(buildGummyBearMesh(), true);
      this.bossVAO = makeVAO(buildThiefManMesh(), true);
      this.hoopVAO = makeVAO(buildTorusMesh(1.0, 0.11, 32, 12));
      this.ringVAO = makeVAO(buildTorusMesh(1.0, 0.04, 32, 10));
      this.cylVAO = makeVAO(buildCylinderMesh(1, 1, 1, 20));
      this.sphereVAO = makeVAO(buildSphereMesh(1, 12, 16));
    }

    syncSize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this.aspect = w / h;
    }

    drawObj(v, col, core, alpha = 1.0, frozen = 0, wDelta = 0, yam = 0, ripple = 0) {
      const gl = this.gl;
      gl.uniformMatrix4fv(this.locs.uModel, false, this.model);
      gl.uniform3fv(this.locs.uColor, col);
      gl.uniform3fv(this.locs.uCore, core);
      gl.uniform1f(this.locs.uAlpha, alpha);
      gl.uniform1f(this.locs.uFrozen, frozen);
      gl.uniform1f(this.locs.uWDelta, wDelta);
      gl.uniform1f(this.locs.uYamBoost, yam);
      gl.uniform1f(this.locs.uRipple, ripple);
      gl.bindVertexArray(v.vao);
      gl.drawElements(gl.TRIANGLES, v.count, v.type, 0);
    }

    render(timeSec) {
      const gl = this.gl;
      const w = this.world;
      const cp = Math.cos(this.cam.pitch);
      this.cam.eye[0] = this.cam.target[0] + Math.sin(this.cam.yaw) * cp * this.cam.distance;
      this.cam.eye[1] = this.cam.target[1] + Math.sin(this.cam.pitch) * this.cam.distance;
      this.cam.eye[2] = this.cam.target[2] + Math.cos(this.cam.yaw) * cp * this.cam.distance;
      mat4Perspective(this.proj, (46 * Math.PI) / 180, this.aspect || 1.5, 0.25, 110);
      mat4LookAt(this.view, this.cam.eye, this.cam.target, [0, 1, 0]);
      mat4Mul(this.vp, this.proj, this.view);

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0.035, 0.015, 0.095, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(this.prog);
      gl.uniformMatrix4fv(this.locs.uViewProj, false, this.vp);
      gl.uniform3fv(this.locs.uCamPos, this.cam.eye);
      gl.uniform1f(this.locs.uTime, timeSec);

      // 1. Floor Pad
      mat4TRS(this.model, 0, -0.05, 0, 0, 0, 0, 22, 0.1, 17);
      this.drawObj(this.cylVAO, [0.10, 0.06, 0.22], [0.24, 0.14, 0.45], 0.92);

      // 2. 4D Tesseract Hypercube Wireframe (16 vertices, 32 edges projected from 4D!)
      const projVerts = TESSERACT_VERTS.map(([vx, vy, vz, vw]) =>
        project4Dto3D(vx * 9.5, 5.8 + vy * 5.2, vz * 7.2, vw * 4.5, w.wCam, w.xwAngle, w.zwAngle)
      );
      for (const [i, j] of TESSERACT_EDGES) {
        const a = projVerts[i], b = projVerts[j];
        mat4Align(this.model, a[0], a[1], a[2], b[0], b[1], b[2], 0.045);
        this.drawObj(this.cylVAO, [0.16, 0.85, 1.0], [0.68, 0.35, 1.0], 0.45);
      }

      // 3. 4D Hyper-Trampoline & Hoops
      const tr = w.trampoline;
      const trP = project4Dto3D(tr.x, 0.18, tr.z, tr.w, w.wCam, w.xwAngle, w.zwAngle);
      mat4TRS(this.model, trP[0], trP[1], trP[2], 0, 0, 0, tr.radius * trP[4] * (1 + tr.pulse * 0.15), 0.22, tr.radius * trP[4] * (1 + tr.pulse * 0.15));
      this.drawObj(this.cylVAO, [0.88, 0.20, 0.95], [0.2, 0.95, 1.0], 0.95);

      for (const h of w.hoops) {
        const hp = project4Dto3D(h.x, h.y, h.z, h.w, w.wCam, w.xwAngle, w.zwAngle);
        const wAlpha = Math.max(0.28, 1.0 - Math.abs(h.w - w.wCam) * 0.14);
        const hr = h.radius * hp[4] * (1 + h.pulse * 0.16);
        mat4TRS(this.model, hp[0], hp[1], hp[2], 0, 0, 0, hr, hr, hr);
        this.drawObj(this.hoopVAO, [1.0, 0.72, 0.10], [1.0, 0.95, 0.65], wAlpha, 0, h.w - w.wCam);
      }

      // 4. 4D Obtuse Titan Boss
      if (w.boss.active) {
        const bs = w.boss;
        const bp = project4Dto3D(bs.x, 2.2, bs.z, bs.w, w.wCam, w.xwAngle, w.zwAngle);
        const alpha = Math.max(0.22, 1.0 - Math.abs(bs.w - w.wCam) * 0.18);
        const sc = 1.65 * bp[4];
        mat4TRS(this.model, bp[0], 0, bp[2], 0, bs.yaw, 0, sc, sc, sc);
        const f = bs.hitFlash;
        this.drawObj(this.bossVAO, [0.92 + f * 0.08, 0.16 + f * 0.8, 0.32 + f * 0.6], [1.0, 0.5, 0.2], alpha, 0, bs.w - w.wCam);
      }

      // 5. 4D Black Holes
      for (const bh of w.blackHoles) {
        const bp = project4Dto3D(bh.x, bh.y, bh.z, bh.w, w.wCam, w.xwAngle, w.zwAngle);
        const r = (0.9 + Math.sin(timeSec * 14) * 0.12) * bp[4];
        mat4TRS(this.model, bp[0], bp[1], bp[2], 0, 0, 0, r, r, r);
        this.drawObj(this.sphereVAO, [0.05, 0.02, 0.10], [0.4, 0.1, 0.9], 0.96);
        mat4TRS(this.model, bp[0], bp[1], bp[2], Math.PI * 0.5, timeSec * 4, 0, r * 2.1, r * 2.1, r * 2.1);
        this.drawObj(this.ringVAO, [0.2, 0.92, 1.0], [0.9, 0.4, 1.0], 0.9);
      }

      // 6. 4D Gummy Bears (sorted back-to-front by W-distance + Z)
      const sorted = [...w.bears].sort((a, b) => Math.abs(b.w - w.wCam) - Math.abs(a.w - w.wCam));
      for (const b of sorted) {
        const p = project4Dto3D(b.x, b.y, b.z, b.w, w.wCam, w.xwAngle, w.zwAngle);
        const wDelta = b.w - w.wCam;
        const wAlpha = Math.max(0.24, 0.96 - Math.abs(wDelta) * 0.16);
        const sc = b.scale * p[4];
        mat4TRS(this.model, p[0], p[1], p[2], b.rx, b.ry, b.rz, sc, sc, sc);
        this.drawObj(this.bearVAO, b.flavor.rgb, b.flavor.core, wAlpha, b.frozen, wDelta, b.yamBoost, b.ripple);
      }

      // 7. 4D Shockwaves & Particles
      for (const sw of w.shockwaves) {
        const sp = project4Dto3D(sw.x, sw.y, sw.z, sw.w, w.wCam, w.xwAngle, w.zwAngle);
        mat4TRS(this.model, sp[0], sp[1], sp[2], Math.PI * 0.5, 0, 0, sw.r * sp[4], sw.r * sp[4], sw.r * sp[4]);
        this.drawObj(this.ringVAO, [0.22, 0.92, 1.0], [1, 1, 1], sw.alpha * 0.8);
      }
      for (const pt of w.particles) {
        const pp = project4Dto3D(pt.x, pt.y, pt.z, pt.w, w.wCam, w.xwAngle, w.zwAngle);
        const s = pt.size * pp[4];
        mat4TRS(this.model, pp[0], pp[1], pp[2], 0, 0, 0, s, s, s);
        this.drawObj(this.sphereVAO, [pt.r, pt.g, pt.b], [1, 1, 1], Math.min(1, pt.life));
      }
    }
  }

  // =========================================================================
  // BOOTSTRAP & UI WIRING
  // =========================================================================
  const canvas = document.getElementById('canvas-4d');
  const world = new World4D();
  const renderer = new Renderer4D(canvas, world);
  world.populate();

  let currentMode = 'grab';
  const scoreEl = document.getElementById('score-4d');
  const wSliceEl = document.getElementById('w-slice-val');
  const bearsEl = document.getElementById('bears-4d');
  const sliderW = document.getElementById('slider-w');
  const wLbl = document.getElementById('w-slider-lbl');
  const sliderXW = document.getElementById('slider-xw');
  const xwLbl = document.getElementById('xw-lbl');
  const sliderZW = document.getElementById('slider-zw');
  const zwLbl = document.getElementById('zw-lbl');
  const chkAuto = document.getElementById('chk-auto-4d');
  const bossHud = document.getElementById('boss-4d-hud');
  const bossFill = document.getElementById('boss-4d-fill');
  const bossHp = document.getElementById('boss-4d-hp');
  const bossW = document.getElementById('boss-w-val');
  const toastEl = document.getElementById('toast-4d');

  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }

  world.onScore = (s) => { if (scoreEl) scoreEl.textContent = String(s); };
  world.onToast = showToast;
  world.onBossUpdate = () => {
    if (!bossHud) return;
    bossHud.hidden = !world.boss.active;
    if (world.boss.active) {
      bossFill.style.width = `${(world.boss.hp / world.boss.maxHp) * 100}%`;
      bossHp.textContent = `${world.boss.hp} / ${world.boss.maxHp}`;
      bossW.textContent = world.boss.w.toFixed(1);
    }
  };

  function setWSlice(val) {
    world.wCam = Math.max(-5, Math.min(5, val));
    if (sliderW) sliderW.value = String(Math.round(world.wCam * 10));
    if (wSliceEl) wSliceEl.textContent = world.wCam.toFixed(1);
    if (wLbl) wLbl.textContent = world.wCam.toFixed(1);
  }

  function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tool-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  }

  document.querySelectorAll('.tool-btn').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.mode === 'wzap') {
      world.wPhaseZap();
      audio.playPortalWhoosh();
      showToast('⚡ Pulled all bears into your 4D W-Slice!');
      return;
    }
    setMode(b.dataset.mode);
    audio.playBoop(1.1);
  }));

  if (sliderW) sliderW.addEventListener('input', () => setWSlice(Number(sliderW.value) / 10));
  if (sliderXW) sliderXW.addEventListener('input', () => {
    world.xwAngle = (Number(sliderXW.value) * Math.PI) / 180;
    if (xwLbl) xwLbl.textContent = `${sliderXW.value}°`;
  });
  if (sliderZW) sliderZW.addEventListener('input', () => {
    world.zwAngle = (Number(sliderZW.value) * Math.PI) / 180;
    if (zwLbl) zwLbl.textContent = `${sliderZW.value}°`;
  });
  if (chkAuto) chkAuto.addEventListener('change', () => { world.autoRotate4D = chkAuto.checked; });

  document.getElementById('btn-drop-4d').addEventListener('click', () => {
    world.spawnBear((Math.random() - 0.5) * 8, 9, (Math.random() - 0.5) * 6, world.wCam);
    audio.playBoop(1.15);
  });
  document.getElementById('btn-quake-4d').addEventListener('click', () => {
    world.yamQuake();
    audio.playYamBoing();
    showToast('🍠 4D YAM QUAKE!');
  });
  document.getElementById('btn-boss-4d').addEventListener('click', () => {
    world.toggleBoss();
    audio.playWaveStart();
  });
  document.getElementById('btn-chaos-4d').addEventListener('click', () => {
    world.blackHoles.push({ x: 0, y: 4.5, z: 0, w: world.wCam, life: 4.0 });
    for (let i = 0; i < 4; i++) world.spawnBear((Math.random() - 0.5) * 8, 10, (Math.random() - 0.5) * 6, world.wCam);
    world.yamQuake();
    audio.playBlackHole();
    showToast('🎲 4D HYPER-CHAOS!');
  });
  document.getElementById('btn-reset-cam-4d').addEventListener('click', () => {
    renderer.cam.yaw = 0; renderer.cam.pitch = 0.34; renderer.cam.distance = 20.5;
    setWSlice(0);
    audio.playBoop(1.0);
  });

  // Pointer Controls (Orbit + 4D Tools)
  let dragging = false, orbiting = false, px = 0, py = 0, blasterOn = false, lastShot = 0;
  function screenToFloor(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const nx = ((cx - r.left) / r.width) * 2 - 1;
    const ny = 1 - ((cy - r.top) / r.height) * 2;
    return [nx * 9.5, Math.max(0.5, ny * 6 + 4), -ny * 4];
  }
  function findBearNear(pt) {
    let best = null, bestD = 3.2;
    for (const b of world.bears) {
      const p = project4Dto3D(b.x, b.y, b.z, b.w, world.wCam, world.xwAngle, world.zwAngle);
      const d = Math.hypot(p[0] - pt[0], p[1] - pt[1], p[2] - pt[2]);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; px = e.clientX; py = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    if (e.button === 1 || e.button === 2 || e.altKey) { orbiting = true; return; }
    orbiting = false;
    const pt = screenToFloor(e.clientX, e.clientY);
    const hit = findBearNear(pt);

    if (currentMode === 'grab') {
      if (hit) world.grab = { bear: hit, x: pt[0], y: pt[1], z: pt[2] };
      else orbiting = true;
    } else if (currentMode === 'slingshot') {
      const b = hit || world.spawnBear(pt[0], pt[1], pt[2], world.wCam);
      b.vx = -pt[0] * 1.6; b.vy = 11.5; b.vz = -pt[2] * 1.6 - 5; b.vw = (Math.random() - 0.5) * 6;
      audio.playLaunch(1.0);
    } else if (currentMode === 'wave') {
      world.shockwaves.push({ x: pt[0], y: 0.3, z: pt[2], w: world.wCam, r: 0.5, maxR: 8.5, alpha: 0.95 });
      for (const b of world.bears) {
        if (Math.hypot(b.x - pt[0], b.z - pt[2], b.w - world.wCam) < 7.5) {
          b.vy += 10.5; b.jiggle = 1.0; b.ripple = 1.0;
        }
      }
      audio.playBoop(0.9);
    } else if (currentMode === 'blaster') {
      blasterOn = true;
    } else if (currentMode === 'blackhole') {
      world.blackHoles.push({ x: pt[0], y: Math.max(2.5, pt[1]), z: pt[2], w: world.wCam, life: 4.5 });
      audio.playBlackHole();
    } else if (currentMode === 'vortex' || currentMode === 'puff' || currentMode === 'cryo' || currentMode === 'yams') {
      world.activeField = { type: currentMode, x: pt[0], y: 0, z: pt[2], shrink: e.shiftKey };
      audio.playBeamPulse(currentMode === 'yams' ? 'puff' : currentMode);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY;
    if (orbiting) {
      renderer.cam.yaw -= dx * 0.007;
      renderer.cam.pitch = Math.max(0.08, Math.min(1.25, renderer.cam.pitch + dy * 0.006));
      return;
    }
    const pt = screenToFloor(e.clientX, e.clientY);
    if (world.grab) {
      world.grab.x = pt[0]; world.grab.y = pt[1]; world.grab.z = pt[2];
    }
    if (world.activeField) {
      world.activeField.x = pt[0]; world.activeField.z = pt[2];
    }
  });

  const endPtr = () => {
    dragging = false; orbiting = false; blasterOn = false;
    world.grab = null; world.activeField = null;
  };
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    renderer.cam.distance = Math.max(9, Math.min(32, renderer.cam.distance + e.deltaY * 0.012));
  }, { passive: false });

  // Keyboard shortcuts
  const KEYS = { '1': 'grab', '2': 'slingshot', '3': 'wave', '4': 'vortex', '5': 'blaster', '6': 'puff', '7': 'cryo', '8': 'yams', '9': 'blackhole' };
  window.addEventListener('keydown', (e) => {
    if (KEYS[e.key]) { setMode(KEYS[e.key]); audio.playBoop(1.05); }
    else if (e.key === 'q' || e.key === 'Q') setWSlice(world.wCam - 0.5);
    else if (e.key === 'e' || e.key === 'E') setWSlice(world.wCam + 0.5);
    else if (e.key === 'y' || e.key === 'Y') { world.yamQuake(); audio.playYamBoing(); }
    else if (e.key === 'n' || e.key === 'N') world.spawnBear((Math.random() - 0.5) * 8, 9, (Math.random() - 0.5) * 6, world.wCam);
    else if (e.key === 'b' || e.key === 'B') world.toggleBoss();
    else if (e.key === 'r' || e.key === 'R') { renderer.cam.yaw = 0; renderer.cam.pitch = 0.34; renderer.cam.distance = 20.5; setWSlice(0); }
  });

  window.addEventListener('resize', () => renderer.syncSize());
  renderer.syncSize();

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) * 0.001;
    last = now;
    if (blasterOn && now - lastShot > 135) {
      lastShot = now;
      const b = world.spawnBear(0, 4, 8, world.wCam + (Math.random() - 0.5) * 2.5);
      b.vx = (Math.random() - 0.5) * 8; b.vy = 8; b.vz = -18;
      audio.playGatlingPop();
    }
    world.step(dt);
    if (bearsEl) bearsEl.textContent = String(world.bears.length);
    renderer.render(now * 0.001);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.GummyArena2 = { world, renderer };
})();
