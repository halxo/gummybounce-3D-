(() => {
  'use strict';

  const STORAGE_KEY = 'gummybounce3d_save_v1';

  const ACHIEVEMENTS = [
    { id: 'first_hoop', icon: '🎯', title: 'Sweet Swish', desc: 'Score your first 3D hoop!' },
    { id: 'combo_5', icon: '🔥', title: 'Sugar Rush x5', desc: 'Reach a x5 hoop combo.' },
    { id: 'mega_fuse', icon: '🧬', title: 'Mega-Bear Scientist', desc: 'Fuse bears into a Giant Mega-Bear.' },
    { id: 'portal_jump', icon: '🌀', title: 'Thinking with Jelly', desc: 'Send a bear through a 3D Portal.' },
    { id: 'popcorn_chef', icon: '🍿', title: 'Popcorn Chef', desc: 'Pop a bear with the Heat Laser.' },
    { id: 'boss_slayer', icon: '👑', title: 'Giant Slayer', desc: 'Defeat the Giant Obtuse Man Boss!' },
    { id: 'wave_3', icon: '👻', title: 'Ghost Buster', desc: 'Reach Wave 3 in Wave Survival.' },
    { id: 'time_attack_20', icon: '⏱️', title: 'Arcade Legend', desc: 'Score 20+ in Time-Attack mode.' },
    { id: 'pinball_wizard', icon: '🎰', title: 'Pinball Wizard', desc: 'Hit Pinball Bumpers 10 times.' },
    { id: 'photographer', icon: '📸', title: 'Candy Paparazzi', desc: 'Snap a PNG in Photo Mode.' }
  ];

  const HATS = [
    { id: 'none', icon: '🧸', name: 'No Hat', unlockReq: null },
    { id: 'party', icon: '🎉', name: 'Party Cone', unlockReq: null },
    { id: 'tophat', icon: '🎩', name: 'Top Hat', unlockReq: 'first_hoop', hint: 'Unlock: Sweet Swish' },
    { id: 'crown', icon: '👑', name: 'Royal Crown', unlockReq: 'boss_slayer', hint: 'Unlock: Defeat Boss' },
    { id: 'wizard', icon: '🧙', name: 'Wizard Hat', unlockReq: 'portal_jump', hint: 'Unlock: Portal Jump' },
    { id: 'halo', icon: '😇', name: '24K Halo', unlockReq: 'mega_fuse', hint: 'Unlock: Mega-Bear' }
  ];

  const DEFAULT_SAVE = {
    bestHoopScore: 0,
    bestTimeAttack: 0,
    bestSurvivalWave: 0,
    bossesDefeated: 0,
    bearsFused: 0,
    portalJumps: 0,
    popcornPops: 0,
    bumperHits: 0,
    hardcoreRepelled: 0,
    unlocked: {},
    selectedHat: 'none'
  };

  class GummyProgression {
    constructor() {
      this.data = this.load();
      this.onUnlock = null;
      this.onChange = null;
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_SAVE, unlocked: {} };
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SAVE,
          ...parsed,
          unlocked: { ...(parsed.unlocked || {}) }
        };
      } catch {
        return { ...DEFAULT_SAVE, unlocked: {} };
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch {
        // Ignore storage quota / privacy mode errors
      }
      if (this.onChange) this.onChange(this.data);
    }

    unlock(id) {
      if (this.data.unlocked[id]) return false;
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (!ach) return false;
      this.data.unlocked[id] = Date.now();
      this.save();
      if (this.onUnlock) this.onUnlock(ach);
      return true;
    }

    isHatUnlocked(hatId) {
      const hat = HATS.find((h) => h.id === hatId);
      if (!hat) return false;
      if (!hat.unlockReq) return true;
      return Boolean(this.data.unlocked[hat.unlockReq]);
    }

    setHat(hatId) {
      if (!this.isHatUnlocked(hatId)) return false;
      this.data.selectedHat = hatId;
      this.save();
      return true;
    }

    recordHoopScore(totalScore, combo) {
      let changed = false;
      if (totalScore > this.data.bestHoopScore) {
        this.data.bestHoopScore = totalScore;
        changed = true;
      }
      this.unlock('first_hoop');
      if (combo >= 5) this.unlock('combo_5');
      if (changed) this.save();
    }

    recordTimeAttack(score) {
      if (score > this.data.bestTimeAttack) {
        this.data.bestTimeAttack = score;
        this.save();
      }
      if (score >= 20) this.unlock('time_attack_20');
    }

    recordSurvivalWave(wave) {
      if (wave > this.data.bestSurvivalWave) {
        this.data.bestSurvivalWave = wave;
        this.save();
      }
      if (wave >= 3) this.unlock('wave_3');
    }

    recordBossDefeat() {
      this.data.bossesDefeated += 1;
      this.save();
      this.unlock('boss_slayer');
    }

    recordFuse() {
      this.data.bearsFused += 1;
      this.save();
      this.unlock('mega_fuse');
    }

    recordPortalJump() {
      this.data.portalJumps += 1;
      this.save();
      this.unlock('portal_jump');
    }

    recordPopcornPop() {
      this.data.popcornPops += 1;
      this.save();
      this.unlock('popcorn_chef');
    }

    recordBumperHit() {
      this.data.bumperHits += 1;
      this.save();
      if (this.data.bumperHits >= 10) this.unlock('pinball_wizard');
    }

    recordHardcoreRepel() {
      this.data.hardcoreRepelled += 1;
      this.save();
    }

    recordPhotoSnap() {
      this.unlock('photographer');
    }
  }

  window.GummyApp = window.GummyApp || {};
  window.GummyApp.ACHIEVEMENTS = ACHIEVEMENTS;
  window.GummyApp.HATS = HATS;
  window.GummyApp.progression = new GummyProgression();
})();
