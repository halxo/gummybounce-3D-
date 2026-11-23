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
    { id: 'photographer', icon: '📸', title: 'Candy Paparazzi', desc: 'Snap a PNG in Photo Mode.' },
    { id: 'bowling_strike', icon: '🎳', title: 'Candy Strike!', desc: 'Knock down all 10 bowling pins.' },
    { id: 'pinata_burst', icon: '🪅', title: 'Piñata Party', desc: 'Burst a Giant Piñata Bear!' },
    { id: 'blackhole_cast', icon: '🕳️', title: 'Event Horizon', desc: 'Summon a 3D Black Hole.' },
    { id: 'bungee_link', icon: '🪢', title: 'Sticky Buddies', desc: 'Link 2 bears with a Bungee Cord.' },
    { id: 'dj_rave', icon: '🎵', title: 'Candy DJ', desc: 'Drop the 128-BPM DJ Rave beat!' },
    { id: 'custom_bear', icon: '🎨', title: 'Master Candy Maker', desc: 'Spawn a custom-colored bear.' },
    { id: 'bubble_pop', icon: '🫧', title: 'Bubble Trouble', desc: 'Trap a bear in a Soap Bubble.' },
    { id: 'lava_floor', icon: '🌋', title: 'Floor is Lava', desc: 'Turn on Floor is Lava mode.' },
    { id: 'king_gummy', icon: '🐻', title: 'Royal Rumble', desc: 'Summon King Gummy Mega-Boss.' },
    { id: 'chaos_lord', icon: '🎲', title: 'Agent of Chaos', desc: 'Trigger a Random Chaos Event!' }
  ];

  const HATS = [
    { id: 'none', icon: '🧸', name: 'No Hat', unlockReq: null },
    { id: 'party', icon: '🎉', name: 'Party Cone', unlockReq: null },
    { id: 'cowboy', icon: '🤠', name: 'Cowboy Hat', unlockReq: null },
    { id: 'chef', icon: '👨‍🍳', name: 'Chef Toque', unlockReq: null },
    { id: 'propeller', icon: '🧢', name: 'Propeller Cap', unlockReq: null },
    { id: 'sombrero', icon: '👒', name: 'Sombrero', unlockReq: null },
    { id: 'tophat', icon: '🎩', name: 'Top Hat', unlockReq: 'first_hoop', hint: 'Unlock: Sweet Swish' },
    { id: 'crown', icon: '👑', name: 'Royal Crown', unlockReq: 'boss_slayer', hint: 'Unlock: Defeat Boss' },
    { id: 'wizard', icon: '🧙', name: 'Wizard Hat', unlockReq: 'portal_jump', hint: 'Unlock: Portal Jump' },
    { id: 'halo', icon: '😇', name: '24K Halo', unlockReq: 'mega_fuse', hint: 'Unlock: Mega-Bear' },
    { id: 'viking', icon: '🛡️', name: 'Viking Helm', unlockReq: 'bowling_strike', hint: 'Unlock: Bowling Strike' },
    { id: 'horns', icon: '😈', name: 'Devil Horns', unlockReq: 'chaos_lord', hint: 'Unlock: Chaos Event' }
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
    bowlingStrikes: 0,
    unlocked: {},
    selectedHat: 'none'
  };

  class GummyProgression {
    constructor() {
      this.data = this.load();
      this.onUnlock = null;
      this.onChange = null;
      this.onMissionComplete = null;
      this.missions = [
        { id: 'm_hoops', label: 'Score 3 Hoops', progress: 0, goal: 3, done: false, reward: 25 },
        { id: 'm_strike', label: 'Bowl a Strike', progress: 0, goal: 1, done: false, reward: 30 },
        { id: 'm_chaos', label: 'Trigger 2 Chaos Events', progress: 0, goal: 2, done: false, reward: 20 }
      ];
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
        // Ignore storage errors
      }
      if (this.onChange) this.onChange(this.data);
    }

    exportSave() {
      return btoa(unescape(encodeURIComponent(JSON.stringify(this.data))));
    }

    importSave(code) {
      try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        this.data = { ...DEFAULT_SAVE, ...parsed, unlocked: { ...(parsed.unlocked || {}) } };
        this.save();
        return true;
      } catch {
        return false;
      }
    }

    advanceMission(id, delta = 1) {
      const m = this.missions.find((x) => x.id === id);
      if (!m || m.done) return;
      m.progress = Math.min(m.goal, m.progress + delta);
      if (m.progress >= m.goal) {
        m.done = true;
        if (this.onMissionComplete) this.onMissionComplete(m);
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
      this.advanceMission('m_hoops', 1);
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

    recordStrike() {
      this.data.bowlingStrikes = (this.data.bowlingStrikes || 0) + 1;
      this.save();
      this.unlock('bowling_strike');
      this.advanceMission('m_strike', 1);
    }

    recordChaos() {
      this.unlock('chaos_lord');
      this.advanceMission('m_chaos', 1);
    }
  }

  window.GummyApp = window.GummyApp || {};
  window.GummyApp.ACHIEVEMENTS = ACHIEVEMENTS;
  window.GummyApp.HATS = HATS;
  window.GummyApp.progression = new GummyProgression();
})();
