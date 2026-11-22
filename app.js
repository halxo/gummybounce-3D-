(() => {
  'use strict';

  const { PhysicsWorld3D, GummyRenderer3D, audio, progression, ACHIEVEMENTS, HATS } = window.GummyApp;

  const canvas = document.getElementById('gummy-canvas');
  const announcer = document.getElementById('sr-announcer');
  const modeHint = document.getElementById('mode-hint');
  const hoopScoreEl = document.getElementById('hoop-score');
  const stolenCountEl = document.getElementById('stolen-count');
  const thiefBadgeDot = document.getElementById('thief-badge-dot');
  const comboPill = document.getElementById('combo-pill');
  const toastRegion = document.getElementById('toast-region');
  const toastLive = document.getElementById('toast-live');
  const toolbar = document.getElementById('main-toolbar');
  const traitorHud = document.getElementById('traitor-hud');
  const traitorSuspectText = document.getElementById('traitor-suspect-text');
  const btnCallPurple = document.getElementById('btn-call-purple');
  const hardcoreHud = document.getElementById('hardcore-hud');
  const repelledCountEl = document.getElementById('repelled-count');
  const yellowGiftCountEl = document.getElementById('yellow-gift-count');
  const bossHud = document.getElementById('boss-hud');
  const bossHpFill = document.getElementById('boss-hp-fill');
  const bossHpText = document.getElementById('boss-hp-text');
  const taHud = document.getElementById('timeattack-hud');
  const taTimerEl = document.getElementById('ta-timer');
  const taScoreEl = document.getElementById('ta-score');
  const taBestEl = document.getElementById('ta-best');
  const survHud = document.getElementById('survival-hud');
  const survWaveEl = document.getElementById('surv-wave');
  const survRepelledEl = document.getElementById('surv-repelled');
  const photoHud = document.getElementById('photo-hud');
  const btnPhotoMode = document.getElementById('btn-photo-mode');
  const victoryDialog = document.getElementById('victory-dialog');
  const victorySummary = document.getElementById('victory-summary');
  let awaitingPurpleTarget = false;
  let repelledCount = 0;
  let yellowGiftCount = 0;
  let photoMode = false;

  // 1. Toolbar Accessibility: Interest Invoker Tooltip Upgrade + Focusgroup Fallback
  function wireToolbarAccessibility() {
    if ('interestForElement' in HTMLButtonElement.prototype && CSS.supports('position-area', 'block-end')) {
      toolbar.querySelectorAll('button[title]').forEach((btn, i) => {
        const tipText = btn.title.trim();
        if (!tipText) return;
        const tip = Object.assign(document.createElement('div'), {
          id: `toolbar-tip-${i}`,
          textContent: tipText
        });
        tip.setAttribute('popover', 'hint');
        btn.setAttribute('interestfor', tip.id);
        btn.removeAttribute('title');
        document.body.append(tip);

        const accName = (btn.getAttribute('aria-label') || btn.textContent || '').trim().replace(/\s+/g, ' ');
        if (!accName) {
          btn.setAttribute('aria-labelledby', tip.id);
        } else if (accName !== tipText) {
          tip.setAttribute('role', 'tooltip');
          if (!btn.hasAttribute('aria-describedby') && !btn.hasAttribute('commandfor')) {
            btn.setAttribute('aria-describedby', tip.id);
          }
        }
      });
    }

    if (!('focusGroup' in HTMLElement.prototype)) {
      const items = Array.from(toolbar.querySelectorAll('button'));
      items.forEach((b, i) => {
        b.tabIndex = i === 0 ? 0 : -1;
      });
      toolbar.addEventListener('focusin', ({ target }) => {
        if (items.includes(target)) {
          items.forEach((b) => {
            b.tabIndex = b === target ? 0 : -1;
          });
        }
      });
      toolbar.addEventListener('keydown', (event) => {
        const idx = items.indexOf(document.activeElement);
        if (idx === -1) return;
        const rtl = getComputedStyle(toolbar).direction === 'rtl';
        let nextIdx = -1;
        if (event.key === 'ArrowRight') nextIdx = (idx + (rtl ? -1 : 1) + items.length) % items.length;
        else if (event.key === 'ArrowLeft') nextIdx = (idx + (rtl ? 1 : -1) + items.length) % items.length;
        else if (event.key === 'Home') nextIdx = 0;
        else if (event.key === 'End') nextIdx = items.length - 1;

        if (nextIdx !== -1) {
          event.preventDefault();
          items.forEach((b, i) => {
            b.tabIndex = i === nextIdx ? 0 : -1;
          });
          items[nextIdx].focus();
        }
      });
    }

    document.querySelectorAll('[popover="auto"]').forEach((pop) => {
      const trigger = document.querySelector(`[commandfor="${pop.id}"]`);
      if (!trigger) return;
      pop.addEventListener('toggle', (event) => {
        trigger.setAttribute('aria-expanded', String(event.newState === 'open'));
      });
    });
  }

  wireToolbarAccessibility();

  const world = new PhysicsWorld3D();
  const renderer = new GummyRenderer3D(canvas, world);
  if (progression) {
    world.selectedHat = progression.data.selectedHat || 'none';
  }

  let currentMode = 'grab';
  let selectedFlavor = 'random';
  let announceTimer = null;

  const MODE_HINTS = {
    grab: '<strong>1 · 3D Grab &amp; Throw:</strong> Drag any 3D ear, paw, or snout to stretch &amp; toss! Drag empty floor (or <strong>Right-drag</strong>) to orbit 360°; <strong>Scroll</strong> to zoom.',
    slingshot: '<strong>2 · 3D Slingshot:</strong> Pull back on any bear (or empty air to spawn one!), aim the 3D arc through the Golden Hoops, and release!',
    wave: '<strong>3 · Jiggle Wand:</strong> Click and sweep across the 3D floor to send bass-drop jelly shockwaves through nearby bears!',
    vortex: '<strong>4 · Cotton-Candy Vortex:</strong> Hold &amp; steer a 3D tornado funnel that spins bears skyward and flings them out the top!',
    gatling: '<strong>5 · 3D Gummy Blaster:</strong> Hold down the pointer to rapid-fire high-speed 3D gummy bears right at your target!',
    puff: '<strong>6 · Puff / Shrink Ray:</strong> Hold on bears to inflate Giant Jumbo Chonks until they <strong>POP</strong> into 3 mini bears! Hold <kbd>Shift</kbd> to shrink.',
    cryo: '<strong>7 · Cryo Freeze Ray:</strong> Sweep to freeze bears into sliding Ice-Candy Statues — click or slam a frozen bear to shatter the ice!',
    magnet: '<strong>8 · 3D Magnet Orb:</strong> Hold to clump bears into a floating 3D Gummy Katamari ball, then release for a <strong>Supernova Launch</strong>!',
    fuse: '<strong>9 · Sticky Glue &amp; Fusion:</strong> Click near 2+ bears to fuse them into a Giant <strong>Mega-Bear</strong>, or click a lone bear to glue/unglue it on the nearest wall or ceiling!',
    portal: '<strong>0 · 3D Portal Gun:</strong> Click anywhere to place linked <strong>Cyan</strong> &amp; <strong>Orange</strong> 3D portals! Bears flying in warp out at boosted speed. (<kbd>Alt</kbd>+click to clear).',
    heat: '<strong>- · Heat Laser:</strong> Hold to melt bears stretchy &amp; extra bouncy, thaw Cryo ice, and overheat them to <strong>POP like popcorn</strong>!',
    yams: '<strong>= · 🍠 Yams Ray:</strong> Hold on any gummy bear to pump up their <strong>jiggly 3D butt cheeks</strong>! Hold <kbd>Shift</kbd> to deflate.'
  };

  function announce(msg) {
    if (!announcer) return;
    announcer.textContent = msg;
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announcer.textContent = '';
    }, 1600);
  }

  let nextToastId = 1;
  function restackToasts() {
    if (!toastRegion) return;
    let offset = 0;
    const openToasts = Array.from(toastRegion.querySelectorAll('.toast-item'));
    for (let i = openToasts.length - 1; i >= 0; i--) {
      const el = openToasts[i];
      el.style.setProperty('--toast-offset', `${offset}px`);
      offset += (el.offsetHeight || 52) + 10;
    }
  }

  function showCornerToast(message, variant = 'green') {
    if (!toastRegion || (victoryDialog && victoryDialog.open)) return;
    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : canvas;
    const id = `green-toast-${nextToastId++}`;

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = 'toast-item';
    toast.dataset.variant = variant;
    toast.setAttribute('popover', 'manual');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = variant === 'red'
      ? '🔥'
      : variant === 'yellow'
        ? '🟡'
        : variant === 'obtuse'
          ? '🥊'
          : variant === 'gold'
            ? '✨'
            : variant === 'purple'
              ? '🟣'
              : variant === 'blue'
                ? '🔵'
                : '🏃‍♂️';

    const textSpan = document.createElement('span');
    textSpan.className = 'toast-text';
    textSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('popovertarget', id);
    closeBtn.setAttribute('popovertargetaction', 'hide');
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.textContent = '✕';

    toast.append(icon, textSpan, closeBtn);
    toastRegion.append(toast);

    if (typeof toast.showPopover === 'function') {
      toast.showPopover();
    }
    restackToasts();

    // Announce strictly the toast's visible text via ariaNotify() or assertive live-region fallback
    if (typeof document.ariaNotify === 'function') {
      document.ariaNotify(message);
    } else if (toastLive) {
      toastLive.textContent = '';
      requestAnimationFrame(() => {
        toastLive.textContent = message;
      });
    }

    let autoTimer = null;
    const removeToast = (wasManualFocus) => {
      if (autoTimer) clearTimeout(autoTimer);
      if (toast.isConnected) {
        if (typeof toast.hidePopover === 'function') {
          try { toast.hidePopover(); } catch { /* ignore if already hidden */ }
        }
        toast.remove();
      }
      restackToasts();
      if (wasManualFocus) {
        const remaining = toastRegion.querySelector('.toast-item .toast-close');
        if (remaining instanceof HTMLElement) {
          remaining.focus();
        } else if (priorFocus && priorFocus.isConnected) {
          priorFocus.focus();
        }
      }
    };

    const scheduleDismiss = (delayMs = 5800) => {
      if (autoTimer) clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        if (toast.contains(document.activeElement)) {
          // Pause dismissal while focus is inside the toast
          scheduleDismiss(2000);
          return;
        }
        removeToast(false);
      }, delayMs);
    };

    toast.addEventListener('toggle', (ev) => {
      if (ev.newState === 'closed') {
        const hadFocus = toast.contains(document.activeElement) || document.activeElement === document.body;
        removeToast(hadFocus);
      }
    });
    closeBtn.addEventListener('click', () => {
      removeToast(true);
    });
    toast.addEventListener('focusout', () => {
      scheduleDismiss(3200);
    });

    scheduleDismiss(5800);
  }

  // Physics event hooks
  world.onSquish = (intensity) => audio.playSquish(intensity);
  world.onTrampoline = () => audio.playTrampoline();
  world.onPopSplit = (bear) => {
    audio.playPopSplit();
    announce(`Giant ${bear.flavor.name} gummy bear popped into 3 mini bears!`);
  };
  world.onIceShatter = () => audio.playIceShatter();
  world.onGreenManSteal = (_bear, count, variant = 'green') => {
    if (stolenCountEl) stolenCountEl.textContent = String(count);
    if (thiefBadgeDot) {
      thiefBadgeDot.textContent = variant === 'red' ? '🔴' : variant === 'blue' ? '🔵' : '🟢';
    }
    audio.playGreenManHeist(variant);
    const thiefTitle = variant === 'red' ? 'Red' : variant === 'blue' ? 'Blue' : 'Green';
    showCornerToast(`The ${thiefTitle} man took your bear`, variant);
  };
  world.onTraitorEat = () => {
    // Silent disappearance — no audio cue so the player cannot hear when a bear vanishes!
    syncTraitorHud();
  };
  world.onGoldenManBless = () => {
    audio.playGoldenBlessing();
    showCornerToast('The Golden Man blessed you with 2 White gummy bears!', 'gold');
  };
  world.onRedManRepelled = (count) => {
    repelledCount += 1;
    if (stolenCountEl) stolenCountEl.textContent = String(count);
    if (thiefBadgeDot) thiefBadgeDot.textContent = '💀';
    syncHardcoreHud();
    audio.playRedManRepelled();
    showCornerToast('You clicked the Red man away from your bears!', 'red');
  };
  world.onYellowManGift = (giftBear, count) => {
    repelledCount += 1;
    yellowGiftCount += 1;
    if (stolenCountEl) stolenCountEl.textContent = String(count);
    if (thiefBadgeDot) thiefBadgeDot.textContent = '🟡';
    syncHardcoreHud();
    audio.playYellowManGift();
    showCornerToast(`10% Luck! He became the Yellow man and gave you a ${giftBear.flavor.name} bear!`, 'yellow');
  };
  world.onObtuseManBeatdown = () => {
    if (thiefBadgeDot) thiefBadgeDot.textContent = '🥊';
    audio.playObtuseBeatdown();
    showCornerToast('The Obtuse man beat up the Yellow man and ran away!', 'obtuse');
  };
  world.onPurpleManCollect = (bear, caught, count) => {
    if (stolenCountEl) stolenCountEl.textContent = String(count);
    if (thiefBadgeDot) thiefBadgeDot.textContent = '🟣';
    audio.playGreenManHeist('purple');
    if (caught) {
      showCornerToast(`The Purple man caught the ${bear.flavor.name} Traitor!`, 'purple');
    } else {
      showCornerToast(`Innocent ${bear.flavor.name} bear! Red man incoming for 5 bears!`, 'purple');
    }
    syncTraitorHud();
  };
  world.onRedPenaltySteal = (takenCount, count) => {
    if (stolenCountEl) stolenCountEl.textContent = String(count);
    if (thiefBadgeDot) thiefBadgeDot.textContent = '🔴';
    audio.playWrongSuspect();
    audio.playGreenManHeist('red');
    showCornerToast(`Wrong bear! The Red man took ${takenCount} of your bears`, 'red');
    syncTraitorHud();
  };
  world.onTraitorWin = (stats) => {
    awaitingPurpleTarget = false;
    if (btnTraitorMode) btnTraitorMode.setAttribute('aria-pressed', 'false');
    if (togTraitorMode) togTraitorMode.setAttribute('aria-pressed', 'false');
    if (thiefBadgeDot) thiefBadgeDot.textContent = '🟢';
    syncTraitorHud();

    // Clear transient background toasts before opening the modal victory dialog
    if (toastRegion) {
      toastRegion.querySelectorAll('.toast-item').forEach((el) => {
        if (typeof el.hidePopover === 'function') {
          try { el.hidePopover(); } catch { /* ignore */ }
        }
        el.remove();
      });
    }

    if (victorySummary) {
      const mealWord = stats.meals === 1 ? '1 innocent bear' : `${stats.meals} innocent bears`;
      victorySummary.innerHTML =
        `The Purple Man hauled away the sneaky <strong>${stats.flavorName}</strong> Traitor! ` +
        `It devoured <strong>${mealWord}</strong> before you cracked the case, and <strong>${stats.survivors}</strong> gummy bears survived.`;
    }
    audio.playTraitorWin();
    if (victoryDialog && !victoryDialog.open) {
      victoryDialog.showModal();
    }
  };
  world.onScore = (score, combo, pts, bear) => {
    hoopScoreEl.textContent = String(score);
    if (combo > 1) {
      comboPill.hidden = false;
      comboPill.textContent = `x${combo} Combo!`;
    } else {
      comboPill.hidden = true;
    }
    audio.playScore(combo);
    if (progression) progression.recordHoopScore(score, combo);
    announce(`${bear.flavor.name} bear scored +${pts}! Total score ${score}.`);
  };

  function syncModeHuds() {
    if (bossHud) {
      bossHud.hidden = !world.boss.active;
      if (world.boss.active) {
        const pct = Math.max(0, Math.min(100, (world.boss.hp / world.boss.maxHp) * 100));
        if (bossHpFill) bossHpFill.style.width = `${pct}%`;
        if (bossHpText) bossHpText.textContent = `${world.boss.hp} / ${world.boss.maxHp}`;
      }
    }
    if (taHud) {
      taHud.hidden = !world.timeAttack.active;
      if (world.timeAttack.active) {
        if (taTimerEl) taTimerEl.textContent = `${world.timeAttack.timeLeft.toFixed(1)}s`;
        if (taScoreEl) taScoreEl.textContent = String(world.timeAttack.score);
        if (taBestEl && progression) taBestEl.textContent = String(progression.data.bestTimeAttack || 0);
      }
    }
    if (survHud) {
      survHud.hidden = !world.survival.active;
      if (world.survival.active) {
        if (survWaveEl) survWaveEl.textContent = String(world.survival.wave);
        if (survRepelledEl) survRepelledEl.textContent = String(world.survival.repelled);
      }
    }
    const togBoss = document.getElementById('tog-boss-mode');
    if (togBoss) togBoss.setAttribute('aria-pressed', String(world.boss.active));
    const togTa = document.getElementById('tog-timeattack-mode');
    if (togTa) togTa.setAttribute('aria-pressed', String(world.timeAttack.active));
    const togSurv = document.getElementById('tog-survival-mode');
    if (togSurv) togSurv.setAttribute('aria-pressed', String(world.survival.active));
  }

  function renderTrophiesUI() {
    if (!progression) return;
    const d = progression.data;
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
    setTxt('stat-best-score', d.bestHoopScore);
    setTxt('stat-best-ta', d.bestTimeAttack);
    setTxt('stat-best-wave', d.bestSurvivalWave);
    setTxt('stat-bosses', d.bossesDefeated);

    const hatGrid = document.getElementById('hat-grid');
    if (hatGrid && HATS) {
      hatGrid.innerHTML = '';
      for (const h of HATS) {
        const unlocked = progression.isHatUnlocked(h.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hat-btn';
        btn.disabled = !unlocked;
        btn.setAttribute('aria-pressed', String(d.selectedHat === h.id));
        btn.innerHTML = `<span>${h.icon} ${h.name}</span>${!unlocked && h.hint ? `<span class="hat-hint">🔒 ${h.hint}</span>` : ''}`;
        btn.addEventListener('click', () => {
          if (progression.setHat(h.id)) {
            world.selectedHat = h.id;
            audio.playBoop(1.18);
            renderTrophiesUI();
          }
        });
        hatGrid.append(btn);
      }
    }

    const achList = document.getElementById('ach-list');
    const achProg = document.getElementById('ach-progress');
    if (achList && ACHIEVEMENTS) {
      achList.innerHTML = '';
      let count = 0;
      for (const a of ACHIEVEMENTS) {
        const isDone = Boolean(d.unlocked[a.id]);
        if (isDone) count++;
        const item = document.createElement('div');
        item.className = `ach-item${isDone ? ' unlocked' : ''}`;
        item.innerHTML = `<span class="ach-icon">${a.icon}</span><div class="ach-meta"><strong>${a.title}</strong><small>${a.desc}</small></div>`;
        achList.append(item);
      }
      if (achProg) achProg.textContent = `${count}/${ACHIEVEMENTS.length}`;
    }
  }

  if (progression) {
    progression.onUnlock = (ach) => {
      audio.playAchievement();
      showCornerToast(`🏆 Achievement Unlocked: ${ach.title}!`, 'gold');
      renderTrophiesUI();
    };
    progression.onChange = () => renderTrophiesUI();
    renderTrophiesUI();
  }

  world.onPortalJump = () => {
    audio.playPortalWhoosh();
    if (progression) progression.recordPortalJump();
  };
  world.onBearPopcorn = () => {
    audio.playHeatPop();
    if (progression) progression.recordPopcornPop();
  };
  world.onBearFuse = (bear, count) => {
    audio.playFuseChime();
    if (progression) progression.recordFuse();
    showCornerToast(`🧬 Fused ${count} bears into a Giant Mega-Bear!`, 'purple');
  };
  world.onBearGlue = () => {
    audio.playGlueSplat();
  };
  world.onBumperHit = (score) => {
    hoopScoreEl.textContent = String(score);
    audio.playBumperDing();
    if (progression) progression.recordBumperHit();
  };
  world.onElectricZap = () => {
    audio.playElectricZap();
  };
  world.onBossHit = () => {
    audio.playBossHit();
    syncModeHuds();
  };
  world.onBossDefeat = (score) => {
    hoopScoreEl.textContent = String(score);
    audio.playBossDefeat();
    if (progression) progression.recordBossDefeat();
    syncModeHuds();
    showCornerToast('👑 GIANT OBTUSE BOSS DEFEATED! +50 pts + Gold & White Bears!', 'gold');
  };
  world.onTimeAttackEnd = (stats) => {
    audio.playBossDefeat();
    if (progression) progression.recordTimeAttack(stats.score);
    syncModeHuds();
    showCornerToast(`⏱️ Time-Attack Over! Score: ${stats.score} (Max Combo x${stats.maxCombo})`, 'gold');
  };
  world.onSurvivalWave = (wave, count) => {
    audio.playWaveStart();
    if (progression) progression.recordSurvivalWave(wave);
    syncModeHuds();
    showCornerToast(`👻 Wave ${wave}! ${count} thieves incoming!`, wave >= 3 ? 'blue' : 'red');
  };
  world.onSurvivalRepel = () => {
    hoopScoreEl.textContent = String(world.score);
    audio.playRedManRepel();
    syncModeHuds();
  };
  world.onSurvivalEnd = (stats) => {
    audio.playObtuseBeatdown();
    syncModeHuds();
    showCornerToast(`💀 Survival Over! Reached Wave ${stats.wave} (${stats.repelled} repelled)`, 'red');
  };

  function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode));
    });
    canvas.classList.toggle('cursor-aim', mode !== 'grab' || awaitingPurpleTarget);
    modeHint.innerHTML = MODE_HINTS[mode] || MODE_HINTS.grab;
  }

  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
      audio.playBoop(1.08);
    });
  });

  // Flavor chips
  document.querySelectorAll('.flavor-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      selectedFlavor = chip.dataset.flavor;
      document.querySelectorAll('.flavor-chip').forEach((c) => {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      const rx = (Math.random() - 0.5) * 7;
      const rz = (Math.random() - 0.5) * 5;
      const bear = world.spawnBear(rx, 8.5, rz, selectedFlavor);
      world.spawnParticles(rx, 8.5, rz, bear.flavor.particle, 10, 0.9);
      audio.playBoop(1.15);
      announce(`Dropped a 3D ${bear.flavor.name} gummy bear.`);
    });
  });

  // Toolbar Quick Actions
  document.getElementById('btn-spawn').addEventListener('click', () => {
    const rx = (Math.random() - 0.5) * 7;
    const rz = (Math.random() - 0.5) * 5;
    const bear = world.spawnBear(rx, 8.5, rz, selectedFlavor);
    world.spawnParticles(rx, 8.5, rz, bear.flavor.particle, 12, 1.0);
    audio.playBoop(1.05);
    announce(`Dropped a 3D ${bear.flavor.name} gummy bear.`);
  });

  document.getElementById('btn-jiggle-all').addEventListener('click', () => {
    world.jiggleAll();
    audio.playJiggleQuake();
    announce(`Jiggled all ${world.bears.length} 3D gummy bears!`);
  });

  document.getElementById('btn-launch-random').addEventListener('click', () => {
    const bear = world.cannonLaunch(selectedFlavor);
    audio.playLaunch(0.95);
    announce(`Cannon launched ${bear.flavor.name} bear in 3D!`);
  });

  const btnSlowMo = document.getElementById('btn-slowmo');
  function toggleSlowMo() {
    const active = world.timeScale > 0.5;
    world.timeScale = active ? 0.28 : 1.0;
    btnSlowMo.setAttribute('aria-pressed', String(active));
    audio.playBoop(active ? 0.72 : 1.25);
    announce(active ? 'Slow-motion 0.28x enabled.' : 'Normal speed restored.');
  }
  btnSlowMo.addEventListener('click', toggleSlowMo);

  const btnHardMode = document.getElementById('btn-hard-mode');
  const togHardMode = document.getElementById('tog-hard-mode');
  const btnHardcoreMode = document.getElementById('btn-hardcore-mode');
  const togHardcoreMode = document.getElementById('tog-hardcore-mode');
  const btnTraitorMode = document.getElementById('btn-traitor-mode');
  const togTraitorMode = document.getElementById('tog-traitor-mode');

  function syncHardcoreHud() {
    if (!hardcoreHud) return;
    hardcoreHud.hidden = !world.hardcoreMode;
    if (repelledCountEl) repelledCountEl.textContent = String(repelledCount);
    if (yellowGiftCountEl) yellowGiftCountEl.textContent = String(yellowGiftCount);
    if (!world.hardcoreMode) {
      canvas.classList.remove('cursor-target-thief');
    }
  }

  function syncTraitorHud() {
    if (!traitorHud) return;
    if (!world.traitorMode) {
      traitorHud.hidden = true;
      awaitingPurpleTarget = false;
      if (btnCallPurple) {
        btnCallPurple.dataset.targeting = 'false';
        btnCallPurple.setAttribute('aria-disabled', 'false');
      }
      canvas.classList.toggle('cursor-aim', currentMode !== 'grab');
      return;
    }

    traitorHud.hidden = false;
    if (world.suspectBear && (!world.bears.includes(world.suspectBear) || world.suspectBear.isStolen)) {
      world.suspectBear = null;
    }

    const busy = world.greenMan.active;
    if (btnCallPurple) {
      btnCallPurple.setAttribute('aria-disabled', String(busy));
      btnCallPurple.dataset.targeting = String(awaitingPurpleTarget && !busy);
    }

    if (traitorSuspectText) {
      if (busy && world.greenMan.actionType === 'purple_collect') {
        traitorSuspectText.textContent = 'Purple Man collecting suspect…';
      } else if (busy && world.greenMan.actionType === 'red_penalty') {
        traitorSuspectText.textContent = 'Red Man taking 5 bears!';
      } else if (awaitingPurpleTarget) {
        traitorSuspectText.textContent = 'Click the suspected bear now!';
      } else if (world.suspectBear) {
        traitorSuspectText.textContent = `Suspect: ${world.suspectBear.flavor.name} Bear`;
      } else {
        traitorSuspectText.textContent = 'Click a bear to mark suspect';
      }
    }

    canvas.classList.toggle('cursor-aim', currentMode !== 'grab' || awaitingPurpleTarget);
  }

  function dispatchPurpleManForSuspect(bear) {
    if (!world.traitorMode || world.greenMan.active || !bear) return false;
    if (world.callPurpleMan(bear)) {
      awaitingPurpleTarget = false;
      audio.playBoop(1.26);
      syncTraitorHud();
      announce(`Called the Purple Man to collect the suspected ${bear.flavor.name} bear!`);
      return true;
    }
    return false;
  }

  function handleCallPurpleClick() {
    if (!world.traitorMode) {
      setTraitorModeUI(true);
      return;
    }
    if (world.greenMan.active) return;

    if (world.suspectBear && world.bears.includes(world.suspectBear) && !world.suspectBear.isStolen) {
      dispatchPurpleManForSuspect(world.suspectBear);
      return;
    }

    awaitingPurpleTarget = !awaitingPurpleTarget;
    audio.playBoop(awaitingPurpleTarget ? 1.18 : 0.92);
    syncTraitorHud();
    announce(
      awaitingPurpleTarget
        ? 'Purple Man ready: click the gummy bear you suspect!'
        : 'Cancelled Purple Man targeting.'
    );
  }

  if (btnCallPurple) {
    btnCallPurple.addEventListener('click', handleCallPurpleClick);
  }

  function setHardModeUI(next) {
    world.setHardMode(next);
    if (btnHardMode) btnHardMode.setAttribute('aria-pressed', String(next));
    if (togHardMode) togHardMode.setAttribute('aria-pressed', String(next));
    if (next) {
      if (btnHardcoreMode) btnHardcoreMode.setAttribute('aria-pressed', 'false');
      if (togHardcoreMode) togHardcoreMode.setAttribute('aria-pressed', 'false');
      if (btnTraitorMode) btnTraitorMode.setAttribute('aria-pressed', 'false');
      if (togTraitorMode) togTraitorMode.setAttribute('aria-pressed', 'false');
    }
    if (thiefBadgeDot) thiefBadgeDot.textContent = next ? '🔴' : '🟢';
    syncTraitorHud();
    syncHardcoreHud();
    audio.playBoop(next ? 1.38 : 0.92);
    announce(
      next
        ? 'Hard Mode enabled! The fast Red Man will steal a bear every 10 seconds!'
        : 'Hard Mode disabled. Normal 60-second Green and Blue Man schedule restored.'
    );
  }
  function toggleHardMode() {
    setHardModeUI(!world.hardMode);
  }
  if (btnHardMode) btnHardMode.addEventListener('click', toggleHardMode);
  if (togHardMode) togHardMode.addEventListener('click', toggleHardMode);

  function setHardcoreModeUI(next) {
    world.setHardcoreMode(next);
    if (btnHardcoreMode) btnHardcoreMode.setAttribute('aria-pressed', String(next));
    if (togHardcoreMode) togHardcoreMode.setAttribute('aria-pressed', String(next));
    if (next) {
      if (btnHardMode) btnHardMode.setAttribute('aria-pressed', 'false');
      if (togHardMode) togHardMode.setAttribute('aria-pressed', 'false');
      if (btnTraitorMode) btnTraitorMode.setAttribute('aria-pressed', 'false');
      if (togTraitorMode) togTraitorMode.setAttribute('aria-pressed', 'false');
    }
    if (thiefBadgeDot) thiefBadgeDot.textContent = next ? '💀' : '🟢';
    syncTraitorHud();
    syncHardcoreHud();
    audio.playBoop(next ? 1.46 : 0.92);
    announce(
      next
        ? 'Hardcore Mode enabled! The Red Man spawns every 4 to 7 seconds — click him to shoo him away! 10% chance he becomes the Yellow Man and gifts a bear before the Obtuse Man beats him up!'
        : 'Hardcore Mode disabled. Normal play restored.'
    );
  }
  function toggleHardcoreMode() {
    setHardcoreModeUI(!world.hardcoreMode);
  }
  if (btnHardcoreMode) btnHardcoreMode.addEventListener('click', toggleHardcoreMode);
  if (togHardcoreMode) togHardcoreMode.addEventListener('click', toggleHardcoreMode);

  function setTraitorModeUI(next) {
    world.setTraitorMode(next);
    awaitingPurpleTarget = false;
    if (btnTraitorMode) btnTraitorMode.setAttribute('aria-pressed', String(next));
    if (togTraitorMode) togTraitorMode.setAttribute('aria-pressed', String(next));
    if (next) {
      if (btnHardMode) btnHardMode.setAttribute('aria-pressed', 'false');
      if (togHardMode) togHardMode.setAttribute('aria-pressed', 'false');
      if (btnHardcoreMode) btnHardcoreMode.setAttribute('aria-pressed', 'false');
      if (togHardcoreMode) togHardcoreMode.setAttribute('aria-pressed', 'false');
      if (thiefBadgeDot) thiefBadgeDot.textContent = '🟣';
    } else if (thiefBadgeDot) {
      thiefBadgeDot.textContent = world.hardcoreMode ? '💀' : world.hardMode ? '🔴' : '🟢';
    }
    syncTraitorHud();
    syncHardcoreHud();
    audio.playBoop(next ? 1.24 : 0.92);
    announce(
      next
        ? 'Traitor Mode started! One of your existing gummy bears is secretly the Traitor and will eat a bear every 60 seconds. Watch for a bulging belly or cheeky smirk, then call the Purple Man!'
        : 'Traitor Mode disabled. Normal play restored.'
    );
  }
  function toggleTraitorMode() {
    setTraitorModeUI(!world.traitorMode);
  }
  if (btnTraitorMode) btnTraitorMode.addEventListener('click', toggleTraitorMode);
  if (togTraitorMode) togTraitorMode.addEventListener('click', toggleTraitorMode);

  if (victoryDialog) {
    victoryDialog.addEventListener('close', () => {
      const choice = victoryDialog.returnValue;
      victoryDialog.returnValue = '';
      if (choice === 'replay') {
        setTraitorModeUI(true);
      }
    });

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outsideDialog = (ev) => {
        const r = victoryDialog.getBoundingClientRect();
        return ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
      };
      let pressedOutside = false;
      victoryDialog.addEventListener('pointerdown', (ev) => {
        pressedOutside = ev.target === victoryDialog && outsideDialog(ev);
      });
      victoryDialog.addEventListener('pointerup', (ev) => {
        if (pressedOutside && ev.target === victoryDialog && outsideDialog(ev)) {
          victoryDialog.close();
        }
        pressedOutside = false;
      });
    }
  }

  document.getElementById('btn-cam-reset').addEventListener('click', () => {
    renderer.resetCamera();
    audio.playBoop(1.0);
    announce('3D camera view reset.');
  });

  const btnSound = document.getElementById('btn-sound');
  const soundIcon = document.getElementById('sound-icon');
  btnSound.addEventListener('click', () => {
    const next = !audio.enabled;
    audio.setEnabled(next);
    btnSound.setAttribute('aria-pressed', String(next));
    soundIcon.textContent = next ? '🔊' : '🔇';
    if (next) audio.playBoop(1.1);
  });

  // Camera HUD Pills
  document.getElementById('cam-left').addEventListener('click', () => renderer.orbitCamera(-0.42, 0));
  document.getElementById('cam-right').addEventListener('click', () => renderer.orbitCamera(0.42, 0));
  document.getElementById('cam-top').addEventListener('click', () => {
    renderer.cam.pitch = 1.18;
    renderer.cam.distance = 20.5;
    renderer.updateCameraMatrices();
  });
  document.getElementById('cam-front').addEventListener('click', () => renderer.resetCamera());

  // Arena Gadgets & Style Toggles
  const bindToggle = (id, initialGetter, setter, label) => {
    const el = document.getElementById(id);
    el.addEventListener('click', () => {
      const next = !initialGetter();
      setter(next);
      el.setAttribute('aria-pressed', String(next));
      audio.playBoop(next ? 1.18 : 0.88);
      announce(`${label} ${next ? 'enabled' : 'disabled'}.`);
    });
  };

  bindToggle('tog-trampoline', () => world.trampoline.enabled, (v) => { world.trampoline.enabled = v; }, '3D Jelly Trampoline');
  bindToggle('tog-sweeper', () => world.sweeper.enabled, (v) => { world.sweeper.enabled = v; }, 'Spinning Candy Sweeper');
  bindToggle('tog-hoops', () => world.hoops[0].enabled, (v) => {
    world.hoops.forEach((h) => { h.enabled = v; });
  }, '3D Golden Hoops');
  bindToggle('tog-sugar', () => world.sugarCoat, (v) => { world.sugarCoat = v; }, 'Sour Sugar Coating');
  bindToggle('tog-neon', () => renderer.neonMode, (v) => {
    renderer.neonMode = v;
    document.documentElement.dataset.theme = v ? 'neon' : 'light';
  }, 'Neon Rave Mode');
  bindToggle('tog-bumpers', () => world.bumpers.enabled, (v) => { world.bumpers.enabled = v; }, 'Pinball Bumpers & Launch Pads');
  bindToggle('tog-fan', () => world.fan.enabled, (v) => { world.fan.enabled = v; }, 'Upward Wind Tunnel Fan');
  bindToggle('tog-boss-mode', () => world.boss.active, (v) => {
    world.setBossMode(v);
    syncModeHuds();
    if (v) {
      audio.playWaveStart();
      showCornerToast('👹 GIANT OBTUSE BOSS ENTERED! Slingshot or Blast bears to KO him!', 'red');
    }
  }, 'Boss Fight Mode');
  bindToggle('tog-timeattack-mode', () => world.timeAttack.active, (v) => {
    world.setTimeAttackMode(v);
    syncModeHuds();
    if (v) {
      audio.playWaveStart();
      showCornerToast('⏱️ 60s Time-Attack Started! Score through the moving hoops!', 'gold');
    }
  }, 'Time-Attack Mode');
  bindToggle('tog-survival-mode', () => world.survival.active, (v) => {
    world.setSurvivalMode(v);
    syncModeHuds();
  }, 'Wave Survival Mode');

  // Photo Mode (freeze physics, hide HUD, orbit 3D camera, download PNG)
  function setPhotoMode(next) {
    photoMode = Boolean(next);
    document.body.classList.toggle('photo-mode', photoMode);
    if (photoHud) photoHud.hidden = !photoMode;
    if (btnPhotoMode) btnPhotoMode.setAttribute('aria-pressed', String(photoMode));
    if (photoMode) {
      renderer.syncSize();
      audio.playBoop(1.25);
    } else {
      renderer.syncSize();
      audio.playBoop(0.92);
    }
  }

  function capturePhotoPng() {
    renderer.render(performance.now() * 0.001);
    audio.playShutter();
    const link = document.createElement('a');
    link.download = `gummy-bounce-3d-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (progression) progression.recordPhotoSnap();
    showCornerToast('📸 PNG Snapshot saved!', 'gold');
  }

  if (btnPhotoMode) btnPhotoMode.addEventListener('click', () => setPhotoMode(!photoMode));
  const btnPhotoSnap = document.getElementById('btn-photo-snap');
  if (btnPhotoSnap) btnPhotoSnap.addEventListener('click', capturePhotoPng);
  const btnPhotoExit = document.getElementById('btn-photo-exit');
  if (btnPhotoExit) btnPhotoExit.addEventListener('click', () => setPhotoMode(false));

  document.getElementById('btn-party-rain').addEventListener('click', () => {
    for (let i = 0; i < 8; i++) {
      const rx = (Math.random() - 0.5) * 14;
      const ry = 8.5 + i * 0.85;
      const rz = (Math.random() - 0.5) * 10;
      const b = world.spawnBear(rx, ry, rz, selectedFlavor);
      b.applyImpulse((Math.random() - 0.5) * 4, -2, (Math.random() - 0.5) * 4, 3, 4, 2);
    }
    audio.playJiggleQuake();
    announce('Rained 8 bouncy 3D gummy bears from the sky!');
  });

  document.getElementById('btn-summon-green').addEventListener('click', () => {
    if (world.triggerGreenManHeist()) {
      audio.playBoop(0.75);
      const who = world.greenMan.variant === 'red'
        ? 'Red Man'
        : world.greenMan.variant === 'blue'
          ? 'rare Blue Man'
          : 'Green Man';
      announce(`The tall ${who} is sprinting in!`);
    }
  });

  // Jelly Lab Sliders
  const sliderJiggle = document.getElementById('slider-jiggle');
  const valJiggle = document.getElementById('val-jiggle');
  sliderJiggle.addEventListener('input', () => {
    const v = Number(sliderJiggle.value) / 100;
    world.jiggleSoftness = v;
    valJiggle.textContent = v < 0.35 ? 'Chewy' : v < 0.72 ? 'Juicy' : 'Ultra Jelly!';
  });

  const sliderBounce = document.getElementById('slider-bounce');
  const valBounce = document.getElementById('val-bounce');
  sliderBounce.addEventListener('input', () => {
    const v = Number(sliderBounce.value);
    world.bounciness = v / 100;
    valBounce.textContent = `${v}%`;
  });

  const sliderGravity = document.getElementById('slider-gravity');
  const valGravity = document.getElementById('val-gravity');
  let savedGrav = 100;
  function applyGravityUI(v) {
    sliderGravity.value = String(v);
    world.gravityScale = v / 100;
    valGravity.textContent = v === 0 ? 'Zero-G' : `${(v / 100).toFixed(1)}x`;
  }
  sliderGravity.addEventListener('input', () => {
    const v = Number(sliderGravity.value);
    if (v > 0) savedGrav = v;
    applyGravityUI(v);
  });

  document.getElementById('btn-zero-g').addEventListener('click', () => {
    if (world.gravityScale > 0.01) {
      applyGravityUI(0);
      for (const b of world.bears) {
        b.applyImpulse((Math.random() - 0.5) * 3, 3.5 + Math.random() * 3, (Math.random() - 0.5) * 3, 2, 2, 2);
      }
      announce('3D Zero Gravity enabled!');
    } else {
      applyGravityUI(savedGrav || 100);
      announce('Gravity restored.');
    }
    audio.playBoop(world.gravityScale === 0 ? 1.35 : 0.9);
  });

  const sliderSize = document.getElementById('slider-size');
  const valSize = document.getElementById('val-size');
  sliderSize.addEventListener('input', () => {
    const v = Number(sliderSize.value) / 100;
    world.setDefaultBearScale(v);
    valSize.textContent = `${v.toFixed(2)}x`;
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    const wasTraitorMode = world.traitorMode;
    world.grab = null;
    world.slingshot = null;
    world.activeField = null;
    world.populateStarterPile();
    if (wasTraitorMode) {
      world.setTraitorMode(true);
      syncTraitorHud();
    }
    audio.playJiggleQuake();
    announce(wasTraitorMode ? 'Reset 3D gummy bear pile and chose a new secret Traitor!' : 'Reset 3D gummy bear pile.');
  });

  // =========================================================================
  // 3D Pointer, Orbit Camera & 8-Tool Interaction State Machine
  // =========================================================================
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  let activePointerId = null;
  let interactionKind = null; // 'orbit' | 'grab' | 'slingshot' | 'wave' | 'gatling' | 'field'
  let downClientX = 0;
  let downClientY = 0;
  let prevClientX = 0;
  let prevClientY = 0;
  let downTime = 0;
  let maxMovePx = 0;
  let grabRefPoint = [0, 1, 0];
  let flingVel3D = [0, 0, 0];
  let lastMoveTime = 0;
  let gatlingAim = [0, 1, 0];
  let lastGatlingShot = 0;
  let lastWavePulse = 0;

  canvas.addEventListener('pointerdown', (event) => {
    if (activePointerId !== null) return;
    if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;

    activePointerId = event.pointerId;
    downClientX = event.clientX;
    downClientY = event.clientY;
    prevClientX = event.clientX;
    prevClientY = event.clientY;
    downTime = performance.now();
    lastMoveTime = downTime;
    maxMovePx = 0;
    flingVel3D = [0, 0, 0];

    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');

    // Photo Mode always orbits the frozen 3D camera
    if (photoMode) {
      interactionKind = 'orbit';
      return;
    }

    // Alt+click in Portal mode clears both portals
    if (currentMode === 'portal' && event.altKey && event.button === 0) {
      world.clearPortals();
      audio.playBoop(0.75);
      showCornerToast('🌀 Cleared 3D Portals', 'blue');
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.classList.remove('is-dragging');
      activePointerId = null;
      interactionKind = null;
      return;
    }

    // Right-drag, Middle-drag, or Alt+drag always orbits the 3D camera
    if (event.button === 1 || event.button === 2 || event.altKey) {
      interactionKind = 'orbit';
      return;
    }

    const { orig, dir } = renderer.screenToRay(event.clientX, event.clientY);

    // Wave Survival Mode: Clicking any thief immediately repels them!
    if (world.survival.active) {
      const hitThief = world.hitSurvivalThiefRay(orig, dir);
      if (hitThief) {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        canvas.classList.remove('is-dragging');
        activePointerId = null;
        interactionKind = null;
        world.repelSurvivalThief(hitThief);
        return;
      }
    }

    // Hardcore Mode: Clicking the Red Man immediately shoos him away (or 10% Yellow Man + Obtuse Man!)
    if (world.raycastClickableRedMan(orig, dir)) {
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      canvas.classList.remove('is-dragging');
      canvas.classList.remove('cursor-target-thief');
      activePointerId = null;
      interactionKind = null;
      world.repelHardcoreRedMan();
      if (progression) progression.recordHardcoreRepel();
      return;
    }

    const hit = world.raycastBears(orig, dir, 0.22);
    const arenaPt = world.raycastArena(orig, dir);

    if (world.traitorMode && hit && !hit.bear.isStolen) {
      world.suspectBear = hit.bear;
      if (awaitingPurpleTarget) {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
        canvas.classList.remove('is-dragging');
        activePointerId = null;
        interactionKind = null;
        dispatchPurpleManForSuspect(hit.bear);
        return;
      }
      syncTraitorHud();
    }

    // Quick Shift+drag in Grab mode launches Slingshot!
    const effectiveMode = (currentMode === 'grab' && event.shiftKey) ? 'slingshot' : currentMode;

    if (effectiveMode === 'grab') {
      if (hit) {
        interactionKind = 'grab';
        hit.bear.isHeld = true;
        const n = hit.bear.nodes[hit.nodeIndex];
        grabRefPoint = [n.x, n.y, n.z];
        world.grab = {
          bear: hit.bear,
          nodeIndex: hit.nodeIndex,
          x: n.x,
          y: n.y,
          z: n.z
        };
        audio.playBoop(0.95 + Math.random() * 0.2);
      } else {
        // Dragging empty floor in Grab mode orbits camera; quick tap ripples!
        interactionKind = 'orbit';
      }
      return;
    }

    if (effectiveMode === 'slingshot') {
      interactionKind = 'slingshot';
      const bear = hit
        ? hit.bear
        : world.spawnBear(arenaPt[0], Math.max(1.6, arenaPt[1] + 1.5), arenaPt[2], selectedFlavor);
      bear.isHeld = true;
      grabRefPoint = [bear.cx, bear.cy, bear.cz];
      world.slingshot = {
        bear,
        anchorX: bear.cx,
        anchorY: bear.cy,
        anchorZ: bear.cz,
        pullX: bear.cx,
        pullY: bear.cy,
        pullZ: bear.cz
      };
      audio.playBoop(1.1);
      return;
    }

    if (effectiveMode === 'wave') {
      interactionKind = 'wave';
      const pt = hit ? hit.point : arenaPt;
      world.applyJiggleWave(pt[0], pt[1], pt[2], 6.0, 10.5);
      audio.playBoop(0.92);
      lastWavePulse = downTime;
      return;
    }

    if (effectiveMode === 'gatling') {
      interactionKind = 'gatling';
      gatlingAim = hit ? hit.point : arenaPt;
      world.fireGatlingBear(renderer.cam.eye, gatlingAim, selectedFlavor);
      audio.playGatlingPop();
      lastGatlingShot = downTime;
      return;
    }

    if (effectiveMode === 'cryo' && hit && hit.bear.frozen > 0.65) {
      // Clicking an already frozen bear shatters it right away!
      world.shatterBearIce(hit.bear);
      hit.bear.applyImpulse((Math.random() - 0.5) * 6, 8.5, (Math.random() - 0.5) * 6, 4, 5, 3);
      interactionKind = 'field';
      const pt = hit.point;
      world.activeField = { type: 'cryo', x: pt[0], y: pt[1], z: pt[2], shrink: false };
      return;
    }

    if (effectiveMode === 'fuse') {
      const pt = hit ? hit.point : arenaPt;
      const res = world.tryFuseOrGlueAt(pt[0], pt[1], pt[2], hit ? hit.bear : null);
      if (!res) {
        audio.playBoop(0.8);
      } else if (res.action === 'unglue') {
        audio.playBoop(1.1);
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.classList.remove('is-dragging');
      activePointerId = null;
      interactionKind = null;
      return;
    }

    if (effectiveMode === 'portal') {
      const pt = hit ? hit.point : [arenaPt[0], Math.max(2.2, arenaPt[1] + 2.4), arenaPt[2]];
      const slot = world.placePortal(pt[0], pt[1], pt[2]);
      audio.playPortalWhoosh();
      announce(`Placed ${slot === 'a' ? 'Cyan' : 'Orange'} 3D portal.`);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.classList.remove('is-dragging');
      activePointerId = null;
      interactionKind = null;
      return;
    }

    if (effectiveMode === 'vortex' || effectiveMode === 'puff' || effectiveMode === 'cryo' || effectiveMode === 'magnet' || effectiveMode === 'heat' || effectiveMode === 'yams') {
      interactionKind = 'field';
      const pt = hit ? [hit.bear.cx, 0, hit.bear.cz] : arenaPt;
      world.activeField = {
        type: effectiveMode,
        x: pt[0],
        y: pt[1],
        z: pt[2],
        shrink: Boolean(event.shiftKey)
      };
      audio.playBeamPulse((effectiveMode === 'heat' || effectiveMode === 'yams') ? 'puff' : effectiveMode);
    }
  });

  canvas.addEventListener('pointermove', (event) => {
    if (activePointerId === null) {
      if (world.isRedManClickable()) {
        const { orig, dir } = renderer.screenToRay(event.clientX, event.clientY);
        canvas.classList.toggle('cursor-target-thief', world.raycastClickableRedMan(orig, dir));
      } else {
        canvas.classList.remove('cursor-target-thief');
      }
      return;
    }
    if (!canvas.hasPointerCapture(event.pointerId) || event.pointerId !== activePointerId) return;

    const now = performance.now();
    const dtSec = Math.max(0.004, (now - lastMoveTime) * 0.001);
    const dxPx = event.clientX - prevClientX;
    const dyPx = event.clientY - prevClientY;
    maxMovePx = Math.max(maxMovePx, Math.hypot(event.clientX - downClientX, event.clientY - downClientY));

    prevClientX = event.clientX;
    prevClientY = event.clientY;
    lastMoveTime = now;

    if (interactionKind === 'orbit') {
      renderer.orbitCamera(-dxPx * 0.0075, dyPx * 0.0065);
      return;
    }

    if (interactionKind === 'grab' && world.grab) {
      const nextPt = renderer.projectOntoCameraPlane(event.clientX, event.clientY, grabRefPoint);
      const ivx = (nextPt[0] - world.grab.x) / dtSec;
      const ivy = (nextPt[1] - world.grab.y) / dtSec;
      const ivz = (nextPt[2] - world.grab.z) / dtSec;
      flingVel3D[0] = flingVel3D[0] * 0.55 + ivx * 0.45;
      flingVel3D[1] = flingVel3D[1] * 0.55 + ivy * 0.45;
      flingVel3D[2] = flingVel3D[2] * 0.55 + ivz * 0.45;

      world.grab.x = nextPt[0];
      world.grab.y = nextPt[1];
      world.grab.z = nextPt[2];
      grabRefPoint = nextPt;
      return;
    }

    if (interactionKind === 'slingshot' && world.slingshot) {
      const nextPt = renderer.projectOntoCameraPlane(event.clientX, event.clientY, grabRefPoint);
      // Pull back also pulls slightly toward camera (+Z) so bears launch deep into the 3D arena!
      const pullDown = Math.max(0, (event.clientY - downClientY) * 0.025);
      world.slingshot.pullX = nextPt[0];
      world.slingshot.pullY = Math.max(0.55, nextPt[1]);
      world.slingshot.pullZ = Math.min(world.boundsZ - 0.5, nextPt[2] + pullDown);
      const { power } = world.getSlingshotVelocity();
      if (power > 0.12) audio.playStretchTick(power);
      return;
    }

    const { orig, dir } = renderer.screenToRay(event.clientX, event.clientY);
    const hit = world.raycastBears(orig, dir, 0.2);
    const arenaPt = world.raycastArena(orig, dir);

    if (interactionKind === 'wave' && now - lastWavePulse > 80) {
      lastWavePulse = now;
      const pt = hit ? hit.point : arenaPt;
      world.applyJiggleWave(pt[0], pt[1], pt[2], 5.2, 8.5);
      audio.playStretchTick(0.45);
      return;
    }

    if (interactionKind === 'gatling') {
      gatlingAim = hit ? hit.point : arenaPt;
      return;
    }

    if (interactionKind === 'field' && world.activeField) {
      const pt = hit ? [hit.bear.cx, 0, hit.bear.cz] : arenaPt;
      world.activeField.x = pt[0];
      world.activeField.y = pt[1];
      world.activeField.z = pt[2];
      world.activeField.shrink = Boolean(event.shiftKey);
      audio.playBeamPulse(world.activeField.type);
    }
  });

  function endInteraction(event) {
    canvas.classList.remove('is-dragging');
    const heldMs = performance.now() - downTime;

    if (interactionKind === 'orbit' && event && event.button === 0 && !event.altKey && maxMovePx < 6 && heldMs < 240) {
      // Quick click on empty floor sends a localized 3D jiggle ripple!
      const { orig, dir } = renderer.screenToRay(event.clientX, event.clientY);
      const pt = world.raycastArena(orig, dir);
      world.applyJiggleWave(pt[0], pt[1], pt[2], 4.8, 7.8);
      audio.playBoop(0.88);
    } else if (interactionKind === 'grab' && world.grab) {
      const { bear, nodeIndex } = world.grab;
      bear.isHeld = false;
      world.grab = null;

      if (maxMovePx < 7 && heldMs < 250) {
        world.boopBear(bear, nodeIndex);
        audio.playBoop(1.18);
      } else {
        const stale = performance.now() - lastMoveTime;
        const spd = stale < 95 ? Math.hypot(flingVel3D[0], flingVel3D[1], flingVel3D[2]) : 0;
        if (spd > 4.5) {
          const cap = Math.min(30.0, spd * 0.78);
          const k = cap / spd;
          for (const n of bear.nodes) {
            n.vx = n.vx * 0.3 + flingVel3D[0] * k;
            n.vy = n.vy * 0.3 + flingVel3D[1] * k + 2.0;
            n.vz = n.vz * 0.3 + flingVel3D[2] * k;
          }
          bear.exciteJiggle(6.5);
          audio.playLaunch(Math.min(1, cap / 24));
        }
      }
    } else if (interactionKind === 'slingshot' && world.slingshot) {
      const res = world.releaseSlingshot();
      if (res && res.launched) {
        audio.playLaunch(res.power);
        announce(`Launched 3D ${res.bear.flavor.name} gummy bear at ${Math.round(res.power * 100)}% power!`);
      } else {
        audio.playBoop(1.0);
      }
    } else if (interactionKind === 'field' && world.activeField) {
      if (world.activeField.type === 'magnet') {
        const count = world.detonateMagnetSupernova();
        audio.playSupernova();
        if (count > 0) announce(`Supernova blasted ${count} gummy bears across the 3D arena!`);
      } else {
        world.activeField = null;
      }
    }

    activePointerId = null;
    interactionKind = null;
  }

  canvas.addEventListener('pointerup', (event) => {
    if (event.pointerId !== activePointerId) return;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    endInteraction(event);
  });

  canvas.addEventListener('lostpointercapture', () => {
    if (activePointerId !== null) {
      endInteraction(null);
    }
  });

  // Scroll wheel zooms 3D camera (or pushes/pulls grabbed bear in 3D depth!)
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (world.grab) {
      const fwdX = renderer.cam.target[0] - renderer.cam.eye[0];
      const fwdY = renderer.cam.target[1] - renderer.cam.eye[1];
      const fwdZ = renderer.cam.target[2] - renderer.cam.eye[2];
      const len = Math.hypot(fwdX, fwdY, fwdZ) || 1;
      const step = -Math.sign(event.deltaY) * 0.65;
      grabRefPoint[0] += (fwdX / len) * step;
      grabRefPoint[1] = Math.max(0.5, grabRefPoint[1] + (fwdY / len) * step);
      grabRefPoint[2] += (fwdZ / len) * step;
      world.grab.x = grabRefPoint[0];
      world.grab.y = grabRefPoint[1];
      world.grab.z = grabRefPoint[2];
    } else {
      renderer.zoomCamera(event.deltaY * 0.012);
    }
  }, { passive: false });

  // Double-click empty floor to spawn a 3D bear right at that 3D spot
  canvas.addEventListener('dblclick', (event) => {
    const { orig, dir } = renderer.screenToRay(event.clientX, event.clientY);
    if (!world.raycastBears(orig, dir, 0.1)) {
      const pt = world.raycastArena(orig, dir);
      const bear = world.spawnBear(pt[0], pt[1] + 1.4, pt[2], selectedFlavor);
      world.spawnParticles(pt[0], pt[1] + 1.2, pt[2], bear.flavor.particle, 12, 1.0);
      audio.playBoop(1.22);
    }
  });

  // Keyboard shortcuts (1-9, 0, - tools, Space/J jiggle, L cannon, N drop, T slow-mo, C photo mode, R reset camera)
  const TOOL_KEYS = {
    '1': 'grab',
    '2': 'slingshot',
    '3': 'wave',
    '4': 'vortex',
    '5': 'gatling',
    '6': 'puff',
    '7': 'cryo',
    '8': 'magnet',
    '9': 'fuse',
    '0': 'portal',
    '-': 'heat'
  };

  window.addEventListener('keydown', (event) => {
    const tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (toolbar.contains(event.target) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) return;

    if (event.key === 'Escape' && photoMode) {
      setPhotoMode(false);
      return;
    }

    if (TOOL_KEYS[event.key]) {
      setMode(TOOL_KEYS[event.key]);
      audio.playBoop(1.06);
      return;
    }

    switch (event.key) {
      case 'c':
      case 'C':
        event.preventDefault();
        setPhotoMode(!photoMode);
        break;
      case ' ':
      case 'j':
      case 'J':
        if (tag === 'BUTTON' && event.key === ' ') return;
        event.preventDefault();
        world.jiggleAll();
        audio.playJiggleQuake();
        announce(`Jiggled all ${world.bears.length} 3D gummy bears!`);
        break;
      case 'l':
      case 'L': {
        event.preventDefault();
        const bear = world.cannonLaunch(selectedFlavor);
        audio.playLaunch(0.95);
        announce(`Launched ${bear.flavor.name} bear!`);
        break;
      }
      case 'n':
      case 'N': {
        event.preventDefault();
        const rx = (Math.random() - 0.5) * 7;
        const rz = (Math.random() - 0.5) * 5;
        const bear = world.spawnBear(rx, 8.5, rz, selectedFlavor);
        world.spawnParticles(rx, 8.5, rz, bear.flavor.particle, 10, 1.0);
        audio.playBoop(1.05);
        break;
      }
      case 't':
      case 'T':
        event.preventDefault();
        toggleSlowMo();
        break;
      case 'h':
      case 'H':
        event.preventDefault();
        toggleHardMode();
        break;
      case 'k':
      case 'K':
        event.preventDefault();
        toggleHardcoreMode();
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        toggleTraitorMode();
        break;
      case 'p':
      case 'P':
        event.preventDefault();
        handleCallPurpleClick();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        renderer.resetCamera();
        audio.playBoop(1.0);
        break;
      case 'g':
      case 'G':
        event.preventDefault();
        if (world.triggerGreenManHeist()) {
          audio.playBoop(0.75);
        }
        break;
      case 'ArrowLeft':
        renderer.orbitCamera(-0.18, 0);
        break;
      case 'ArrowRight':
        renderer.orbitCamera(0.18, 0);
        break;
      case 'ArrowUp':
        renderer.orbitCamera(0, 0.12);
        break;
      case 'ArrowDown':
        renderer.orbitCamera(0, -0.12);
        break;
      default:
        break;
    }
  });

  window.addEventListener('resize', () => renderer.syncSize());

  renderer.syncSize();
  world.populateStarterPile();
  if (window.location.hash.startsWith('#preview-heist')) {
    const h = window.location.hash;
    if (h === '#preview-heist-red') {
      setHardModeUI(true);
      world.triggerGreenManHeist('red');
    } else if (h === '#preview-heist-blue') {
      world.triggerGreenManHeist('blue');
    } else {
      world.triggerGreenManHeist('green');
    }
    if (world.greenMan.targetBear) {
      world.greenMan.x = world.greenMan.targetBear.cx - 0.55;
      world.greenMan.z = world.greenMan.targetBear.cz;
      world.step(0.035);
    }
  } else if (window.location.hash.startsWith('#preview-traitor')) {
    const h = window.location.hash;
    setTraitorModeUI(true);
    // Settle pile briefly
    for (let i = 0; i < 18; i++) world.step(0.02);

    if (h === '#preview-traitor-eat' && world.traitorBear) {
      const tb = world.traitorBear;
      const victim = world.bears.find((b) => b !== tb && !b.isTraitor);
      if (victim) {
        world.executeTraitorChomp(victim);
      }
      // Position traitor front-and-center facing camera (+Z) so bulging belly & cheeky smirk are crystal clear
      for (const n of tb.nodes) {
        n.x = 0.0 + n.rx;
        n.y = 1.48 + n.ry;
        n.z = 3.6 + n.rz;
        n.vx = 0;
        n.vy = 0;
        n.vz = 0;
      }
      tb.updateShapeFrame();
      tb.syncGpuNodes();
      tb.cheekyAmount = 0.65;
      tb.bellyBulge = 0.55;
      world.suspectBear = tb;
      renderer.cam.distance = 11.2;
      renderer.cam.pitch = 0.22;
      renderer.cam.yaw = 0.0;
      renderer.updateCameraMatrices();
      syncTraitorHud();
    } else if (h === '#preview-traitor-purple' && world.traitorBear) {
      const tb = world.traitorBear;
      world.suspectBear = tb;
      dispatchPurpleManForSuspect(tb);
      world.greenMan.x = tb.cx - 0.55;
      world.greenMan.z = tb.cz;
      for (let s = 0; s < 10; s++) world.step(0.022);
    } else if (h === '#preview-traitor-penalty') {
      // Trigger the 5-bear Red Man penalty directly and step until he's carrying 5 bears!
      world.triggerRedManPenalty(5);
      for (let s = 0; s < 140 && world.greenMan.phase === 'approach'; s++) {
        if (world.greenMan.targetBear) {
          world.greenMan.x = world.greenMan.targetBear.cx - 0.5;
          world.greenMan.z = world.greenMan.targetBear.cz;
        }
        world.step(0.025);
      }
      world.greenMan.x = -1.5;
      world.greenMan.z = 1.5;
      for (let s = 0; s < 8; s++) world.step(0.02);
    } else if (h === '#preview-traitor-win') {
      world.setTraitorMode(false);
      if (world.onTraitorWin) {
        world.onTraitorWin({ flavorName: 'Cherry', meals: 2, survivors: 7 });
      }
    }
  } else if (window.location.hash.startsWith('#preview-golden')) {
    for (let i = 0; i < 16; i++) world.step(0.02);
    world.triggerGoldenManBlessing();
    if (window.location.hash === '#preview-golden-descend') {
      // Descend partway from the sky carrying the 2 exclusive White gummy bears!
      for (let s = 0; s < 38; s++) world.step(0.045);
    } else {
      // Step until he hovers and bestows the 2 White gummy bears with toast & sparkles!
      for (let s = 0; s < 70; s++) world.step(0.045);
    }
  } else if (window.location.hash.startsWith('#preview-hardcore')) {
    const h = window.location.hash;
    setHardcoreModeUI(true);
    for (let i = 0; i < 16; i++) world.step(0.02);
    world.triggerGreenManHeist('red');
    world.greenMan.x = -3.8;
    world.greenMan.z = 1.4;
    world.greenMan.yaw = Math.PI * 0.42;

    if (h === '#preview-hardcore-yellow') {
      world.repelHardcoreRedMan(true);
      for (let s = 0; s < 8; s++) world.step(0.03);
    } else if (h === '#preview-hardcore-obtuse') {
      world.greenMan.x = -1.2;
      world.greenMan.z = 1.8;
      world.repelHardcoreRedMan(true);
      // Step until Obtuse Man sprints across and starts beating up the Yellow Man!
      for (let s = 0; s < 26; s++) world.step(0.035);
    }
  }

  let lastFrameTime = performance.now();
  function frame(now) {
    const dt = Math.max(0, (now - lastFrameTime) * 0.001);
    lastFrameTime = now;

    if (!document.hidden) {
      if (!photoMode) {
        if (interactionKind === 'gatling' && now - lastGatlingShot > 130) {
          lastGatlingShot = now;
          world.fireGatlingBear(renderer.cam.eye, gatlingAim, selectedFlavor);
          audio.playGatlingPop();
        }
        if (interactionKind === 'field' && world.activeField) {
          audio.playBeamPulse((world.activeField.type === 'heat' || world.activeField.type === 'yams') ? 'puff' : world.activeField.type);
        }

        world.step(dt);
        if (world.traitorMode) {
          syncTraitorHud();
        }
        if (world.timeAttack.active || world.boss.active || world.survival.active) {
          syncModeHuds();
        }
      }
      renderer.render(now * 0.001);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
