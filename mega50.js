(() => {
  'use strict';

  const { FLAVORS_3D, PhysicsWorld3D, GummyRenderer3D } = window.GummyApp;

  // =========================================================================
  // 10 NEW SPECIAL GUMMY FLAVORS (Features 11-20)
  // =========================================================================
  const EXTRA_FLAVORS = {
    bubblegum: { id: 'bubblegum', name: 'Bubblegum', rgb: [1.0, 0.42, 0.78], coreRgb: [1.0, 0.82, 0.94], particle: [1.0, 0.56, 0.86], points: 2, isBubblegum: true },
    cottoncandy: { id: 'cottoncandy', name: 'Cotton Candy', rgb: [0.68, 0.82, 1.0], coreRgb: [1.0, 0.78, 0.95], particle: [0.85, 0.82, 1.0], points: 2, isFloaty: true },
    mint: { id: 'mint', name: 'Mint Chill', rgb: [0.22, 0.96, 0.76], coreRgb: [0.78, 1.0, 0.94], particle: [0.42, 1.0, 0.86], points: 2, isMint: true },
    lava: { id: 'lava', name: 'Lava Magma', rgb: [0.95, 0.16, 0.02], coreRgb: [1.0, 0.86, 0.18], particle: [1.0, 0.42, 0.04], points: 3, isLava: true, isSpicy: true },
    galaxy: { id: 'galaxy', name: 'Galaxy Cosmic', rgb: [0.28, 0.14, 0.78], coreRgb: [0.82, 0.48, 1.0], particle: [0.68, 0.42, 1.0], points: 3, isFloaty: true },
    toxic: { id: 'toxic', name: 'Toxic Lime', rgb: [0.44, 1.0, 0.08], coreRgb: [0.86, 1.0, 0.42], particle: [0.56, 1.0, 0.16], points: 2, isToxic: true },
    peach: { id: 'peach', name: 'Peach Fuzz', rgb: [1.0, 0.62, 0.46], coreRgb: [1.0, 0.88, 0.76], particle: [1.0, 0.72, 0.56], points: 2, isPeach: true },
    choco: { id: 'choco', name: 'Choco Fudge', rgb: [0.42, 0.22, 0.10], coreRgb: [0.74, 0.48, 0.28], particle: [0.58, 0.34, 0.18], points: 3, isHeavy: true },
    rainbow: { id: 'rainbow', name: 'Rainbow Sherbet', rgb: [1.0, 0.3, 0.6], coreRgb: [0.4, 1.0, 0.9], particle: [1.0, 0.85, 0.2], points: 4, isRainbow: true },
    diamond: { id: 'diamond', name: 'Diamond Crystal', rgb: [0.76, 0.94, 1.0], coreRgb: [1.0, 1.0, 1.0], particle: [0.86, 0.98, 1.0], points: 8, isWhite: true }
  };
  Object.assign(FLAVORS_3D, EXTRA_FLAVORS);

  function hexToRgb01(hex) {
    const clean = (hex || '#ff44aa').replace('#', '');
    const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  // =========================================================================
  // PHYSICS WORLD MEGA-50 EXTENSION
  // =========================================================================
  function ensureMegaState(w) {
    if (w._megaInit) return;
    w._megaInit = true;
    w.blackHoles = [];     // { x, y, z, life, maxLife }
    w.bombs = [];          // { x, y, z, vy, fuse }
    w.bungees = [];        // { a, b, restLen }
    w.bowling = { enabled: false, pins: [], strikes: 0, resetTimer: 0 };
    w.pendulum = { enabled: false, angle: 0, speed: 2.2, length: 8.5, pivotY: 10.5, radius: 1.25 };
    w.laserBar = { enabled: false, z: -6, dir: 1, y: 1.15 };
    w.fountain = { enabled: false, timer: 0, erupting: 0 };
    w.iceRink = false;
    w.moonGrav = false;
    w.autoTurret = { enabled: false, timer: 2.2 };
    w.boostStrips = false;
    w.lavaFloor = false;
    w.timeFreeze = false;
    w.gravFlipped = false;
    w.pinataBear = null;
    w.kingGummyBear = null;
    w.arenaTheme = 'default'; // 'default' | 'sunset' | 'space'
    w.autoOrbit = false;
    w.followCam = false;
    w.bungeePending = null;
    w.slowMoFlash = 0;

    // Mega callbacks
    w.onBombBoom = null;
    w.onBonk = null;
    w.onBubblePop = null;
    w.onBowlingStrike = null;
    w.onPinataBurst = null;
    w.onBlackHole = null;
    w.onBungeeLink = null;
    w.onChaosEvent = null;
  }

  const origSpawnBear = PhysicsWorld3D.prototype.spawnBear;
  PhysicsWorld3D.prototype.spawnBear = function (x, y, z, flavorKey, scale) {
    ensureMegaState(this);
    const bear = origSpawnBear.call(this, x, y, z, flavorKey, scale);
    if (bear && bear.flavor && bear.flavor.isPeach) {
      bear.yamBoost = 0.75;
    }
    if (bear && bear.flavor && bear.flavor.isRainbow) {
      bear.flavor = { ...bear.flavor, rgb: [...bear.flavor.rgb], coreRgb: [...bear.flavor.coreRgb] };
    }
    return bear;
  };

  PhysicsWorld3D.prototype.spawnCustomColorBear = function (hexColor, x = 0, y = 7.5, z = 0) {
    ensureMegaState(this);
    const rgb = hexToRgb01(hexColor);
    const coreRgb = [Math.min(1, rgb[0] + 0.35), Math.min(1, rgb[1] + 0.35), Math.min(1, rgb[2] + 0.35)];
    const bear = this.spawnBear(x, y, z, 'cherry');
    bear.flavor = { id: 'custom', name: 'Custom Candy', rgb, coreRgb, particle: rgb, points: 3 };
    this.spawnParticles(x, y, z, rgb, 16, 1.15);
    return bear;
  };

  PhysicsWorld3D.prototype.spawnBlackHole = function (x, y, z) {
    ensureMegaState(this);
    this.blackHoles.push({ x, y: Math.max(2.6, y), z, life: 4.5, maxLife: 4.5 });
    this.spawnParticles(x, Math.max(2.6, y), z, [0.55, 0.12, 1.0], 24, 1.4);
    if (this.onBlackHole) this.onBlackHole();
  };

  PhysicsWorld3D.prototype.dropCandyBomb = function (x, y, z) {
    ensureMegaState(this);
    this.bombs.push({ x, y: Math.max(2.0, y), z, vy: 0, fuse: 1.45 });
  };

  PhysicsWorld3D.prototype.cloneBear = function (bear) {
    ensureMegaState(this);
    if (!bear || this.bears.length >= 34) return null;
    const clone = this.spawnBear(bear.cx + 1.1, bear.cy + 0.9, bear.cz, bear.flavor.id, bear.scale);
    clone.yamBoost = bear.yamBoost || 0;
    clone.megaLevel = bear.megaLevel || 0;
    if (bear.flavor.id === 'custom') clone.flavor = { ...bear.flavor };
    clone.applyImpulse(3.2, 6.5, (Math.random() - 0.5) * 3, 4, 4, 3);
    this.spawnParticles(clone.cx, clone.cy, clone.cz, [0.35, 1.0, 0.85], 16, 1.1);
    return clone;
  };

  PhysicsWorld3D.prototype.bonkBear = function (bear) {
    ensureMegaState(this);
    if (!bear) return;
    for (const n of bear.nodes) {
      n.vy = -19.0;
      n.vx += (Math.random() - 0.5) * 4;
      n.vz += (Math.random() - 0.5) * 4;
    }
    bear.jellyRipple = 1.0;
    bear.exciteJiggle(10.0);
    if (bear.isPinata) this.hitPinataBear(bear);
    if (bear.isKingGummy) this.hitKingGummy(bear);
    this.spawnParticles(bear.cx, bear.cy + 0.6, bear.cz, [1.0, 0.92, 0.16], 20, 1.4);
    this.shockwaves.push({ x: bear.cx, y: Math.max(0.25, bear.cy), z: bear.cz, r: 0.4, maxR: 4.8, alpha: 0.9 });
    if (this.onBonk) this.onBonk(bear);
  };

  PhysicsWorld3D.prototype.paintBearRandom = function (bear) {
    ensureMegaState(this);
    if (!bear) return;
    const keys = Object.keys(FLAVORS_3D).filter((k) => k !== 'white');
    const pick = keys[Math.floor(Math.random() * keys.length)];
    const f = FLAVORS_3D[pick];
    bear.flavor = f.isRainbow ? { ...f, rgb: [...f.rgb], coreRgb: [...f.coreRgb] } : f;
    bear.exciteJiggle(5.0);
    this.spawnParticles(bear.cx, bear.cy, bear.cz, bear.flavor.particle, 14, 1.0);
  };

  PhysicsWorld3D.prototype.linkBungee = function (bear) {
    ensureMegaState(this);
    if (!bear) return null;
    if (!this.bungeePending || this.bungeePending === bear || !this.bears.includes(this.bungeePending)) {
      this.bungeePending = bear;
      this.spawnParticles(bear.cx, bear.cy, bear.cz, [1.0, 0.84, 0.16], 10, 0.8);
      return 'pending';
    }
    const a = this.bungeePending;
    const b = bear;
    this.bungeePending = null;
    this.bungees.push({ a, b, restLen: 2.6 });
    this.spawnParticles((a.cx + b.cx) * 0.5, (a.cy + b.cy) * 0.5, (a.cz + b.cz) * 0.5, [0.22, 1.0, 0.82], 18, 1.1);
    if (this.onBungeeLink) this.onBungeeLink(a, b);
    return 'linked';
  };

  PhysicsWorld3D.prototype.toggleBubbleBear = function (bear) {
    ensureMegaState(this);
    if (!bear) return;
    if (bear.inBubble) {
      bear.inBubble = false;
      bear.applyImpulse((Math.random() - 0.5) * 6, 4, (Math.random() - 0.5) * 6, 3, 3, 3);
      this.spawnParticles(bear.cx, bear.cy, bear.cz, [0.75, 0.96, 1.0], 18, 1.1);
      if (this.onBubblePop) this.onBubblePop(bear);
    } else {
      bear.inBubble = true;
      bear.glued = null;
      this.spawnParticles(bear.cx, bear.cy, bear.cz, [0.78, 0.92, 1.0], 12, 0.9);
    }
  };

  PhysicsWorld3D.prototype.triggerDiscoPulse = function () {
    ensureMegaState(this);
    this.shockwaves.push({ x: 0, y: 0.3, z: 0, r: 0.6, maxR: 13.0, alpha: 0.95 });
    for (const b of this.bears) {
      if (b.isHeld || b.isStolen || b.yamPinned) continue;
      b.applyImpulse((Math.random() - 0.5) * 5, 8.5 + Math.random() * 4, (Math.random() - 0.5) * 5, 5, 6, 5);
      b.exciteJiggle(7.5);
    }
    this.spawnParticles(0, 3.5, 0, [1.0, 0.35, 0.92], 32, 1.7);
  };

  PhysicsWorld3D.prototype.setupBowlingPins = function (enabled) {
    ensureMegaState(this);
    this.bowling.enabled = Boolean(enabled);
    this.bowling.pins = [];
    this.bowling.resetTimer = 0;
    if (!this.bowling.enabled) return;
    // Standard 10-pin bowling triangle at back-center of arena
    const rows = [
      [0, -2.0],
      [-0.85, -3.1], [0.85, -3.1],
      [-1.7, -4.2], [0, -4.2], [1.7, -4.2],
      [-2.55, -5.3], [-0.85, -5.3], [0.85, -5.3], [2.55, -5.3]
    ];
    for (const [x, z] of rows) {
      this.bowling.pins.push({ x, z, fallen: false, tilt: 0, vx: 0, vz: 0 });
    }
  };

  PhysicsWorld3D.prototype.spawnPinataBear = function () {
    ensureMegaState(this);
    const b = this.spawnBear(0, 6.0, 0.5, 'rainbow', 1.75);
    b.isPinata = true;
    b.pinataHits = 0;
    this.pinataBear = b;
    this.spawnParticles(0, 6.0, 0.5, [1.0, 0.85, 0.15], 28, 1.5);
    return b;
  };

  PhysicsWorld3D.prototype.hitPinataBear = function (bear) {
    if (!bear || !bear.isPinata) return;
    bear.pinataHits = (bear.pinataHits || 0) + 1;
    this.spawnParticles(bear.cx, bear.cy, bear.cz, [1.0, 0.84, 0.2], 16, 1.2);
    if (bear.pinataHits >= 5) {
      const idx = this.bears.indexOf(bear);
      if (idx !== -1) this.bears.splice(idx, 1);
      this.pinataBear = null;
      this.score += 35;
      this.spawnParticles(bear.cx, bear.cy, bear.cz, [1.0, 0.84, 0.14], 45, 2.0);
      this.shockwaves.push({ x: bear.cx, y: bear.cy, z: bear.cz, r: 0.5, maxR: 9.0, alpha: 1.0 });
      for (let i = 0; i < 6 && this.bears.length < 34; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const baby = this.spawnBear(bear.cx + Math.cos(ang), bear.cy + 0.5, bear.cz + Math.sin(ang), i % 2 === 0 ? 'gold' : 'rainbow', 0.85);
        baby.applyImpulse(Math.cos(ang) * 9, 10, Math.sin(ang) * 9, 5, 5, 4);
      }
      if (this.onPinataBurst) this.onPinataBurst(this.score);
    }
  };

  PhysicsWorld3D.prototype.spawnKingGummy = function () {
    ensureMegaState(this);
    const b = this.spawnBear(0, 7.0, -1.5, 'gold', 2.25);
    b.isKingGummy = true;
    b.kingHp = 8;
    b.megaLevel = 3;
    this.kingGummyBear = b;
    this.shockwaves.push({ x: 0, y: 0.35, z: -1.5, r: 0.6, maxR: 8.5, alpha: 0.95 });
    this.spawnParticles(0, 7.0, -1.5, [1.0, 0.84, 0.12], 32, 1.8);
    return b;
  };

  PhysicsWorld3D.prototype.hitKingGummy = function (bear) {
    if (!bear || !bear.isKingGummy) return;
    bear.kingHp = (bear.kingHp || 1) - 1;
    if (this.bears.length < 34) {
      const mini = this.spawnBear(bear.cx, bear.cy + 1.2, bear.cz, 'gold', 0.65);
      mini.applyImpulse((Math.random() - 0.5) * 10, 9.5, (Math.random() - 0.5) * 10, 4, 4, 4);
    }
    if (bear.kingHp <= 0) {
      bear.isKingGummy = false;
      this.kingGummyBear = null;
      this.score += 60;
      this.slowMoFlash = 0.85;
      this.spawnParticles(bear.cx, bear.cy, bear.cz, [1.0, 0.86, 0.16], 55, 2.2);
      if (this.onBossDefeat) this.onBossDefeat(this.score);
    }
  };

  PhysicsWorld3D.prototype.triggerMeteorShower = function () {
    ensureMegaState(this);
    for (let i = 0; i < 6 && this.bears.length < 34; i++) {
      const rx = -10 + i * 3.8;
      const b = this.spawnBear(rx, 12.5 + i * 0.9, (Math.random() - 0.5) * 6, i % 2 === 0 ? 'lava' : 'cinnamon', 1.0);
      b.applyImpulse(6.5, -10.5, (Math.random() - 0.5) * 5, 5, 5, 5);
    }
  };

  PhysicsWorld3D.prototype.fireConfettiCannon = function () {
    ensureMegaState(this);
    const cols = [[1, 0.2, 0.5], [0.2, 0.9, 1], [1, 0.85, 0.1], [0.3, 1, 0.4], [0.7, 0.3, 1]];
    for (let i = 0; i < 60; i++) {
      const c = cols[i % cols.length];
      this.particles.push({
        x: (Math.random() - 0.5) * 4,
        y: 1.2,
        z: (Math.random() - 0.5) * 3,
        vx: (Math.random() - 0.5) * 18,
        vy: 10 + Math.random() * 14,
        vz: (Math.random() - 0.5) * 18,
        r: c[0], g: c[1], b: c[2],
        size: 0.11, life: 1.6 + Math.random() * 0.9, decay: 0.65
      });
    }
  };

  PhysicsWorld3D.prototype.triggerRandomChaos = function () {
    ensureMegaState(this);
    const events = [
      { name: 'Meteor Shower!', fn: () => this.triggerMeteorShower() },
      { name: 'Yam Quake!', fn: () => this.yamQuake() },
      { name: 'Confetti Cannon!', fn: () => this.fireConfettiCannon() },
      { name: '3D Black Hole!', fn: () => this.spawnBlackHole(0, 4.5, 0) },
      { name: 'Disco Party Pulse!', fn: () => this.triggerDiscoPulse() },
      { name: 'Giant Piñata Bear!', fn: () => this.spawnPinataBear() }
    ];
    const pick = events[Math.floor(Math.random() * events.length)];
    pick.fn();
    if (this.onChaosEvent) this.onChaosEvent(pick.name);
    return pick.name;
  };

  // Wrap PhysicsWorld3D.prototype.step cleanly
  const origStep = PhysicsWorld3D.prototype.step;
  PhysicsWorld3D.prototype.step = function (rawDt) {
    ensureMegaState(this);
    const dt = Math.min(Math.max(rawDt, 0.001), 1 / 30);

    // Slow-Mo Action Replay Flash (Feature 40)
    if (this.slowMoFlash > 0) {
      this.slowMoFlash = Math.max(0, this.slowMoFlash - rawDt);
      this.timeScale = this.slowMoFlash > 0 ? 0.25 : 1.0;
    }

    // Time Freeze (Feature 10)
    if (this.timeFreeze) {
      return;
    }

    // Gravity Flip (Feature 4) & Moon Gravity (Feature 26)
    const prevBaseGrav = this.baseGravity;
    if (this.gravFlipped) this.baseGravity = Math.abs(prevBaseGrav);
    else this.baseGravity = -Math.abs(prevBaseGrav);

    origStep.call(this, rawDt);
    this.baseGravity = prevBaseGrav;

    const nowSec = performance.now() * 0.001;

    // Rainbow Sherbet color cycling + Special flavor physics (Features 11-20)
    for (const b of this.bears) {
      if (b.flavor && b.flavor.isRainbow) {
        b.flavor.rgb[0] = 0.55 + 0.45 * Math.sin(nowSec * 3.0 + b.id);
        b.flavor.rgb[1] = 0.55 + 0.45 * Math.sin(nowSec * 3.0 + b.id + 2.09);
        b.flavor.rgb[2] = 0.55 + 0.45 * Math.sin(nowSec * 3.0 + b.id + 4.18);
      }
      if (b.flavor && b.flavor.isFloaty && !b.yamPinned) {
        for (const n of b.nodes) n.vy += 12.5 * dt;
      }
      if (b.flavor && b.flavor.isToxic && !b.yamPinned && Math.random() < 0.08) {
        b.exciteJiggle(2.2);
      }
      if (b.inBubble && !b.yamPinned) {
        for (const n of b.nodes) {
          n.vy += (27.5 - n.vy * 2.5) * dt;
          n.vx *= 0.985;
          n.vz *= 0.985;
        }
        if (b.cy > this.ceilingY - 1.6) {
          this.toggleBubbleBear(b);
        }
      }
      // Ice Rink Floor (Feature 25)
      if (this.iceRink && b.cy < 1.3 * b.scale && !b.yamPinned) {
        for (const n of b.nodes) {
          n.vx *= 1.012;
          n.vz *= 1.012;
        }
      }
      // Floor is Lava Mode (Feature 33)
      if (this.lavaFloor && b.cy < 1.15 * b.scale && !b.yamPinned && !b.isHeld) {
        for (const n of b.nodes) n.vy = Math.max(n.vy, 16.5);
        b.exciteJiggle(6.5);
        this.spawnParticles(b.cx, 0.25, b.cz, [1.0, 0.35, 0.05], 8, 1.0);
      }
      // Speed Boost Strips (Feature 28)
      if (this.boostStrips && b.cy < 1.3 * b.scale && Math.abs(b.cz - 3.8) < 1.35 && !b.yamPinned) {
        for (const n of b.nodes) n.vx += 28.0 * dt;
      }
    }

    // Black Holes (Feature 1)
    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      bh.life -= rawDt;
      for (const b of this.bears) {
        if (b.isHeld || b.yamPinned) continue;
        const dx = bh.x - b.cx;
        const dy = bh.y - b.cy;
        const dz = bh.z - b.cz;
        const d = Math.hypot(dx, dy, dz) || 0.1;
        if (d < 12.0) {
          const pull = 36.0 * dt;
          for (const n of b.nodes) {
            n.vx += (dx / d) * pull - (dz / d) * 14.0 * dt;
            n.vy += (dy / d) * pull;
            n.vz += (dz / d) * pull + (dx / d) * 14.0 * dt;
          }
        }
      }
      if (bh.life <= 0) {
        this.shockwaves.push({ x: bh.x, y: bh.y, z: bh.z, r: 0.5, maxR: 12.0, alpha: 1.0 });
        this.spawnParticles(bh.x, bh.y, bh.z, [0.7, 0.25, 1.0], 35, 2.0);
        for (const b of this.bears) {
          if (b.yamPinned) continue;
          const dx = b.cx - bh.x;
          const dy = b.cy - bh.y;
          const dz = b.cz - bh.z;
          const d = Math.hypot(dx, dy, dz) || 0.2;
          if (d < 10.0) b.applyImpulse((dx / d) * 18, Math.max(8, (dy / d) * 14), (dz / d) * 18, 6, 6, 5);
        }
        this.blackHoles.splice(i, 1);
      }
    }

    // Candy Bombs (Feature 2)
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bm = this.bombs[i];
      bm.vy += -22 * dt;
      bm.y += bm.vy * dt;
      if (bm.y < 0.55) { bm.y = 0.55; bm.vy = Math.abs(bm.vy) * 0.5; }
      bm.fuse -= rawDt;
      if (bm.fuse <= 0) {
        this.shockwaves.push({ x: bm.x, y: bm.y, z: bm.z, r: 0.5, maxR: 10.5, alpha: 1.0 });
        this.spawnParticles(bm.x, bm.y, bm.z, [1.0, 0.45, 0.08], 38, 1.9);
        for (const b of this.bears) {
          if (b.yamPinned) continue;
          const dx = b.cx - bm.x;
          const dy = b.cy - bm.y;
          const dz = b.cz - bm.z;
          const d = Math.hypot(dx, dy, dz) || 0.2;
          if (d < 9.5) b.applyImpulse((dx / d) * 20, Math.max(10, (dy / d) * 16 + 8), (dz / d) * 20, 7, 7, 6);
        }
        if (this.onBombBoom) this.onBombBoom();
        this.bombs.splice(i, 1);
      }
    }

    // Bungee Cords (Feature 7)
    for (let i = this.bungees.length - 1; i >= 0; i--) {
      const bg = this.bungees[i];
      if (!this.bears.includes(bg.a) || !this.bears.includes(bg.b)) {
        this.bungees.splice(i, 1);
        continue;
      }
      const dx = bg.b.cx - bg.a.cx;
      const dy = bg.b.cy - bg.a.cy;
      const dz = bg.b.cz - bg.a.cz;
      const d = Math.hypot(dx, dy, dz) || 0.1;
      if (d > bg.restLen) {
        const pull = (d - bg.restLen) * 14.0 * dt;
        const ux = dx / d; const uy = dy / d; const uz = dz / d;
        if (!bg.a.yamPinned) for (const n of bg.a.nodes) { n.vx += ux * pull; n.vy += uy * pull; n.vz += uz * pull; }
        if (!bg.b.yamPinned) for (const n of bg.b.nodes) { n.vx -= ux * pull; n.vy -= uy * pull; n.vz -= uz * pull; }
      }
    }

    // 3D Bowling Pins (Features 21 & 31)
    if (this.bowling.enabled) {
      let standing = 0;
      for (const pin of this.bowling.pins) {
        if (pin.fallen) {
          pin.tilt = Math.min(Math.PI * 0.5, pin.tilt + rawDt * 7.0);
          pin.x += pin.vx * dt;
          pin.z += pin.vz * dt;
          pin.vx *= 0.94; pin.vz *= 0.94;
          continue;
        }
        standing++;
        for (const b of this.bears) {
          const d = Math.hypot(b.cx - pin.x, b.cz - pin.z);
          if (d < 0.72 + b.boundRadius * 0.85 && b.cy < 2.4) {
            pin.fallen = true;
            pin.vx = (pin.x - b.cx) * 8 + b.vx * 0.6;
            pin.vz = (pin.z - b.cz) * 8 + b.vz * 0.6;
            this.score += 3;
            this.spawnParticles(pin.x, 1.0, pin.z, [1.0, 0.95, 0.95], 8, 0.9);
            standing--;
            break;
          }
        }
      }
      if (standing === 0 && this.bowling.pins.length > 0) {
        if (this.bowling.resetTimer <= 0) {
          this.bowling.resetTimer = 2.4;
          this.bowling.strikes += 1;
          this.score += 30;
          this.slowMoFlash = 0.6;
          this.fireConfettiCannon();
          if (this.onBowlingStrike) this.onBowlingStrike(this.bowling.strikes, this.score);
        } else {
          this.bowling.resetTimer -= rawDt;
          if (this.bowling.resetTimer <= 0) this.setupBowlingPins(true);
        }
      }
    }

    // Giant Pendulum Wrecking Ball (Feature 22)
    if (this.pendulum.enabled) {
      const p = this.pendulum;
      p.angle = Math.sin(nowSec * p.speed) * 0.88;
      const bx = Math.sin(p.angle) * p.length;
      const by = p.pivotY - Math.cos(p.angle) * p.length;
      const bz = 0;
      for (const b of this.bears) {
        if (b.isHeld || b.yamPinned) continue;
        const d = Math.hypot(b.cx - bx, b.cy - by, b.cz - bz);
        if (d < p.radius + b.boundRadius) {
          const dirX = Math.cos(nowSec * p.speed) >= 0 ? 1 : -1;
          b.applyImpulse(dirX * 16.5, 9.5, (Math.random() - 0.5) * 6, 6, 6, 5);
          b.exciteJiggle(8.0);
          this.spawnParticles(bx, by, bz, [1.0, 0.78, 0.14], 12, 1.1);
        }
      }
    }

    // Moving Laser Hurdle (Feature 23)
    if (this.laserBar.enabled) {
      const lb = this.laserBar;
      lb.z += lb.dir * 5.2 * dt;
      if (lb.z > this.boundsZ - 1.2) lb.dir = -1;
      if (lb.z < -this.boundsZ + 1.2) lb.dir = 1;
      for (const b of this.bears) {
        if (b.isHeld || b.yamPinned) continue;
        if (Math.abs(b.cz - lb.z) < 0.75 && Math.abs(b.cy - lb.y) < 1.1) {
          b.applyImpulse(0, 14.5, lb.dir * 8.5, 5, 5, 4);
          this.spawnParticles(b.cx, lb.y, lb.z, [1.0, 0.15, 0.35], 10, 1.0);
        }
      }
    }

    // Candy Fountain Geyser (Feature 24)
    if (this.fountain.enabled) {
      const ft = this.fountain;
      ft.timer += rawDt;
      if (ft.timer > 3.5) {
        ft.timer = 0;
        ft.erupting = 1.25;
      }
      if (ft.erupting > 0) {
        ft.erupting -= rawDt;
        if (Math.random() < 0.55) {
          this.particles.push({ x: (Math.random() - 0.5) * 1.4, y: 0.3, z: (Math.random() - 0.5) * 1.4, vx: (Math.random() - 0.5) * 3, vy: 15, vz: (Math.random() - 0.5) * 3, r: 0.25, g: 0.92, b: 1.0, size: 0.1, life: 0.75, decay: 1.3 });
        }
        for (const b of this.bears) {
          if (b.yamPinned || b.isHeld) continue;
          if (Math.hypot(b.cx, b.cz) < 2.5 && b.cy < 9.5) {
            for (const n of b.nodes) n.vy += 45.0 * dt;
          }
        }
      }
    }

    // Auto-Turret Cannon (Feature 27)
    if (this.autoTurret.enabled) {
      this.autoTurret.timer -= rawDt;
      if (this.autoTurret.timer <= 0) {
        this.autoTurret.timer = 2.6;
        if (this.bears.length < 28) this.cannonLaunch('random');
      }
    }
  };

  // =========================================================================
  // RENDERER MEGA-50 EXTENSION (Hats, Gadgets, Themes, Cameras)
  // =========================================================================
  const origDrawBearHat = GummyRenderer3D.prototype.drawBearHat;
  GummyRenderer3D.prototype.drawBearHat = function (bear, hatId, timeSec) {
    // Also draw a giant crown on King Gummy!
    const effHat = bear.isKingGummy ? 'crown' : hatId;
    if (!effHat || effHat === 'none') return;
    if (['halo', 'crown', 'tophat', 'party', 'wizard'].includes(effHat)) {
      origDrawBearHat.call(this, bear, effHat, timeSec);
      return;
    }
    const head = bear.nodes[2];
    if (!head) return;
    const s = bear.scale;
    const hx = head.x + bear.rotMat[3] * (0.48 * s);
    const hy = head.y + bear.rotMat[4] * (0.48 * s);
    const hz = head.z + bear.rotMat[5] * (0.48 * s);
    const M = this.modelMat;
    const trs = (tx, ty, tz, rx, ry, rz, sx, sy, sz) => {
      M[0] = sx; M[1] = 0; M[2] = 0; M[3] = 0;
      M[4] = 0; M[5] = sy; M[6] = 0; M[7] = 0;
      M[8] = 0; M[9] = 0; M[10] = sz; M[11] = 0;
      M[12] = tx; M[13] = ty; M[14] = tz; M[15] = 1;
    };
    if (effHat === 'cowboy') {
      trs(hx, hy + 0.04 * s, hz, 0, 0, 0, 0.56 * s, 0.06 * s, 0.44 * s);
      this.drawMesh(this.cylVAO, M, 0, 0.58, 0.34, 0.14, 1.0);
      trs(hx, hy + 0.22 * s, hz, 0, 0, 0, 0.28 * s, 0.30 * s, 0.28 * s);
      this.drawMesh(this.cylVAO, M, 0, 0.48, 0.26, 0.10, 1.0);
    } else if (effHat === 'chef') {
      trs(hx, hy + 0.12 * s, hz, 0, 0, 0, 0.30 * s, 0.24 * s, 0.30 * s);
      this.drawMesh(this.cylVAO, M, 0, 0.98, 0.98, 1.0, 1.0);
      trs(hx, hy + 0.34 * s, hz, 0, 0, 0, 0.36 * s, 0.26 * s, 0.36 * s);
      this.drawMesh(this.sphereVAO, M, 0, 1.0, 1.0, 1.0, 1.0);
    } else if (effHat === 'propeller') {
      trs(hx, hy + 0.06 * s, hz, 0, 0, 0, 0.34 * s, 0.22 * s, 0.34 * s);
      this.drawMesh(this.sphereVAO, M, 2, 0.15, 0.58, 1.0, 1.0, [1.0, 0.85, 0.1]);
      trs(hx, hy + 0.28 * s, hz, 0, timeSec * 12, 0, 0.46 * s, 0.04 * s, 0.08 * s);
      this.drawMesh(this.cylVAO, M, 0, 1.0, 0.2, 0.25, 1.0);
    } else if (effHat === 'sombrero') {
      trs(hx, hy + 0.04 * s, hz, 0, 0, 0, 0.68 * s, 0.07 * s, 0.68 * s);
      this.drawMesh(this.cylVAO, M, 2, 1.0, 0.72, 0.12, 1.0, [0.95, 0.18, 0.35]);
      trs(hx, hy + 0.22 * s, hz, 0, 0, 0, 0.26 * s, 0.32 * s, 0.26 * s);
      this.drawMesh(this.cylVAO, M, 0, 0.98, 0.62, 0.10, 1.0);
    } else if (effHat === 'viking') {
      trs(hx, hy + 0.06 * s, hz, 0, 0, 0, 0.34 * s, 0.26 * s, 0.34 * s);
      this.drawMesh(this.sphereVAO, M, 0, 0.55, 0.60, 0.68, 1.0);
      trs(hx - 0.36 * s, hy + 0.22 * s, hz, 0, 0, 0, 0.10 * s, 0.26 * s, 0.10 * s);
      this.drawMesh(this.cylVAO, M, 0, 0.96, 0.92, 0.82, 1.0);
      trs(hx + 0.36 * s, hy + 0.22 * s, hz, 0, 0, 0, 0.10 * s, 0.26 * s, 0.10 * s);
      this.drawMesh(this.cylVAO, M, 0, 0.96, 0.92, 0.82, 1.0);
    } else if (effHat === 'horns') {
      trs(hx - 0.22 * s, hy + 0.18 * s, hz, 0, 0, 0, 0.09 * s, 0.30 * s, 0.09 * s);
      this.drawMesh(this.cylVAO, M, 0, 0.92, 0.08, 0.16, 1.0);
      trs(hx + 0.22 * s, hy + 0.18 * s, hz, 0, 0, 0, 0.09 * s, 0.30 * s, 0.09 * s);
      this.drawMesh(this.cylVAO, M, 0, 0.92, 0.08, 0.16, 1.0);
    }
  };

  const origRender = GummyRenderer3D.prototype.render;
  GummyRenderer3D.prototype.render = function (timeSec) {
    const w = this.world;
    ensureMegaState(w);

    // Auto-Orbit & Bear Follow Cam (Features 43 & 44)
    if (w.autoOrbit) {
      this.cam.yaw += 0.008;
    }
    if (w.followCam && w.bears.length > 0) {
      let fastest = w.bears[0];
      let bestSpd = -1;
      for (const b of w.bears) {
        const spd = Math.hypot(b.vx, b.vy, b.vz);
        if (spd > bestSpd) { bestSpd = spd; fastest = b; }
      }
      this.cam.target[0] += (fastest.cx - this.cam.target[0]) * 0.1;
      this.cam.target[1] += (Math.max(1.8, fastest.cy) - this.cam.target[1]) * 0.1;
      this.cam.target[2] += (fastest.cz - this.cam.target[2]) * 0.1;
    } else {
      this.cam.target[0] += (0 - this.cam.target[0]) * 0.1;
      this.cam.target[1] += (2.3 - this.cam.target[1]) * 0.1;
      this.cam.target[2] += (0 - this.cam.target[2]) * 0.1;
    }

    origRender.call(this, timeSec);

    // Overlay Mega-50 3D props using stageProg
    const gl = this.gl;
    gl.useProgram(this.stageProg);
    const M = this.modelMat;
    const setT = (tx, ty, tz, sx, sy, sz) => {
      M[0] = sx; M[1] = 0; M[2] = 0; M[3] = 0;
      M[4] = 0; M[5] = sy; M[6] = 0; M[7] = 0;
      M[8] = 0; M[9] = 0; M[10] = sz; M[11] = 0;
      M[12] = tx; M[13] = ty; M[14] = tz; M[15] = 1;
    };

    // Black Holes
    for (const bh of w.blackHoles) {
      const p = 0.85 + Math.sin(timeSec * 14) * 0.14;
      setT(bh.x, bh.y, bh.z, p, p, p);
      this.drawMesh(this.sphereVAO, M, 0, 0.05, 0.02, 0.10, 0.98);
      setT(bh.x, bh.y, bh.z, p * 2.1, p * 0.2, p * 2.1);
      this.drawMesh(this.thinRingVAO, M, 3, 0.68, 0.18, 1.0, 0.9);
    }

    // Ticking Candy Bombs
    for (const bm of w.bombs) {
      const flash = Math.sin(timeSec * 28) > 0 ? 1.0 : 0.35;
      setT(bm.x, bm.y, bm.z, 0.55, 0.55, 0.55);
      this.drawMesh(this.sphereVAO, M, 0, flash, 0.15, 0.18, 1.0);
    }

    // Soap Bubbles around bubbled bears
    for (const b of w.bears) {
      if (b.inBubble) {
        const r = 1.45 * b.scale;
        setT(b.cx, b.cy, b.cz, r, r, r);
        this.drawMesh(this.sphereVAO, M, 3, 0.72, 0.94, 1.0, 0.34);
      }
      if (b.isPinata) {
        const r = 1.7 * b.scale;
        setT(b.cx, b.cy, b.cz, r, 0.12, r);
        this.drawMesh(this.thinRingVAO, M, 3, 1.0, 0.82, 0.14, 0.88);
      }
    }

    // 3D Bowling Pins
    if (w.bowling.enabled) {
      for (const pin of w.bowling.pins) {
        const y = pin.fallen ? 0.28 : 0.95;
        const sx = pin.fallen ? 0.85 : 0.28;
        const sy = pin.fallen ? 0.28 : 1.75;
        setT(pin.x, y, pin.z, sx, sy, 0.28);
        this.drawMesh(this.cylVAO, M, 2, 1.0, 0.98, 0.98, 1.0, [0.95, 0.14, 0.22]);
      }
    }

    // Giant Pendulum Wrecking Ball
    if (w.pendulum.enabled) {
      const p = w.pendulum;
      const bx = Math.sin(p.angle) * p.length;
      const by = p.pivotY - Math.cos(p.angle) * p.length;
      setT(bx, by, 0, p.radius, p.radius, p.radius);
      this.drawMesh(this.sphereVAO, M, 0, 0.98, 0.76, 0.12, 1.0);
    }

    // Moving Laser Hurdle
    if (w.laserBar.enabled) {
      setT(0, w.laserBar.y, w.laserBar.z, w.boundsX * 1.9, 0.16, 0.16);
      this.drawMesh(this.cylVAO, M, 3, 1.0, 0.12, 0.32, 0.92);
    }

    // Candy Fountain Base
    if (w.fountain.enabled) {
      setT(0, 0.18, 0, 2.2, 0.32, 2.2);
      this.drawMesh(this.cylVAO, M, 0, 0.18, 0.86, 1.0, 0.95);
    }

    // Speed Boost Strip
    if (w.boostStrips) {
      setT(0, 0.05, 3.8, 16.0, 0.06, 2.2);
      this.drawMesh(this.cylVAO, M, 3, 0.16, 1.0, 0.52, 0.65);
    }

    // Lava Floor Glow
    if (w.lavaFloor) {
      setT(0, 0.03, 0, w.boundsX * 1.8, 0.04, w.boundsZ * 1.8);
      this.drawMesh(this.cylVAO, M, 3, 1.0, 0.28, 0.04, 0.32);
    }
  };
})();
