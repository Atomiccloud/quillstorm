const STORAGE_KEY = 'quillstorm_graphics';

export type QualityPreset = 'low' | 'medium' | 'high' | 'auto';
export type StatusOverlayDetail = 'full' | 'simple' | 'tint';

interface GraphicsConfig {
  preset: QualityPreset;
  deathParticleCount: number;
  elementalParticleCount: number;
  shatterParticleCount: number;
  glowEffects: boolean;
  pulseEffects: boolean;
  trailParticles: boolean;
  statusOverlayDetail: StatusOverlayDetail;
  screenShake: boolean;
  eliteGlowPulse: boolean;
  combatText: boolean;
}

const PRESETS: Record<'low' | 'medium' | 'high', Omit<GraphicsConfig, 'preset'>> = {
  high: {
    deathParticleCount: 8,
    elementalParticleCount: 10,
    shatterParticleCount: 8,
    glowEffects: true,
    pulseEffects: true,
    trailParticles: true,
    statusOverlayDetail: 'full',
    screenShake: true,
    eliteGlowPulse: true,
    combatText: true,
  },
  medium: {
    deathParticleCount: 4,
    elementalParticleCount: 5,
    shatterParticleCount: 4,
    glowEffects: true,
    pulseEffects: true,
    trailParticles: true,
    statusOverlayDetail: 'simple',
    screenShake: true,
    eliteGlowPulse: true,
    combatText: true,
  },
  low: {
    deathParticleCount: 2,
    elementalParticleCount: 0,
    shatterParticleCount: 0,
    glowEffects: false,
    pulseEffects: false,
    trailParticles: false,
    statusOverlayDetail: 'tint',
    screenShake: false,
    eliteGlowPulse: false,
    combatText: false,
  },
};

export class GraphicsSettings {
  private static preset: QualityPreset = 'high';
  private static config: GraphicsConfig = { preset: 'high', ...PRESETS.high };

  // For auto mode: track the effective quality level separately from the user's choice
  private static autoEffective: 'low' | 'medium' | 'high' = 'high';

  static load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.preset && (data.preset === 'low' || data.preset === 'medium' || data.preset === 'high' || data.preset === 'auto')) {
          this.setPreset(data.preset, false);
          return;
        }
      }
    } catch {
      // Storage not available
    }
    this.setPreset('high', false);
  }

  static save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset: this.preset }));
    } catch {
      // Storage not available
    }
  }

  static setPreset(preset: QualityPreset, persist: boolean = true): void {
    this.preset = preset;
    if (preset === 'auto') {
      this.autoEffective = 'high';
      this.config = { preset: 'auto', ...PRESETS.high };
    } else {
      this.config = { preset, ...PRESETS[preset] };
    }
    if (persist) this.save();
  }

  static getPreset(): QualityPreset {
    return this.preset;
  }

  static getEffectiveQuality(): 'low' | 'medium' | 'high' {
    if (this.preset === 'auto') return this.autoEffective;
    return this.preset;
  }

  // Auto mode: step down quality
  static autoDowngrade(): boolean {
    if (this.preset !== 'auto') return false;
    if (this.autoEffective === 'high') {
      this.autoEffective = 'medium';
      this.config = { preset: 'auto', ...PRESETS.medium };
      return true;
    } else if (this.autoEffective === 'medium') {
      this.autoEffective = 'low';
      this.config = { preset: 'auto', ...PRESETS.low };
      return true;
    }
    return false;
  }

  // Auto mode: step up quality
  static autoUpgrade(): boolean {
    if (this.preset !== 'auto') return false;
    if (this.autoEffective === 'low') {
      this.autoEffective = 'medium';
      this.config = { preset: 'auto', ...PRESETS.medium };
      return true;
    } else if (this.autoEffective === 'medium') {
      this.autoEffective = 'high';
      this.config = { preset: 'auto', ...PRESETS.high };
      return true;
    }
    return false;
  }

  // Accessors for individual settings
  static get deathParticleCount(): number { return this.config.deathParticleCount; }
  static get elementalParticleCount(): number { return this.config.elementalParticleCount; }
  static get shatterParticleCount(): number { return this.config.shatterParticleCount; }
  static get glowEffects(): boolean { return this.config.glowEffects; }
  static get pulseEffects(): boolean { return this.config.pulseEffects; }
  static get trailParticles(): boolean { return this.config.trailParticles; }
  static get statusOverlayDetail(): StatusOverlayDetail { return this.config.statusOverlayDetail; }
  static get screenShake(): boolean { return this.config.screenShake; }
  static get eliteGlowPulse(): boolean { return this.config.eliteGlowPulse; }
  static get combatText(): boolean { return this.config.combatText; }
}

// Load on import
GraphicsSettings.load();
