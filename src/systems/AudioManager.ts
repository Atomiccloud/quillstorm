// Procedural audio system using Web Audio API
// No external sound files needed - generates retro 8-bit style sounds

export class AudioManager {
  private static context: AudioContext | null = null;
  private static masterVolume: number = 0.5;
  private static isMuted: boolean = false;

  static initialize(): void {
    if (this.context) return;
    this.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }

  static resume(): void {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  private static playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volumeMultiplier: number = 1,
    delay: number = 0
  ): void {
    if (!this.context || this.isMuted) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime + delay);

    const volume = this.masterVolume * volumeMultiplier;
    gainNode.gain.setValueAtTime(volume, this.context.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + delay + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.start(this.context.currentTime + delay);
    oscillator.stop(this.context.currentTime + delay + duration);
  }

  private static playNoise(duration: number, volumeMultiplier: number = 1): void {
    if (!this.context || this.isMuted) return;

    const bufferSize = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    const gainNode = this.context.createGain();
    const volume = this.masterVolume * volumeMultiplier * 0.3;
    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    noise.connect(gainNode);
    gainNode.connect(this.context.destination);

    noise.start();
  }

  // ============ Sound Effects ============

  // Quick high-pitched blip for shooting
  static playShoot(): void {
    this.playTone(800, 0.05, 'square', 0.3);
    this.playTone(600, 0.03, 'square', 0.2, 0.02);
  }

  // Low thud with noise for hitting enemy
  static playHit(): void {
    this.playTone(200, 0.08, 'square', 0.4);
    this.playNoise(0.05, 0.5);
  }

  // Descending tone with noise burst for enemy death
  static playEnemyDeath(): void {
    this.playTone(300, 0.1, 'square', 0.5);
    this.playTone(200, 0.15, 'square', 0.3, 0.05);
    this.playNoise(0.1, 0.4);
  }

  // Harsh sawtooth warning for player taking damage
  static playPlayerDamage(): void {
    this.playTone(150, 0.15, 'sawtooth', 0.5);
    this.playTone(100, 0.2, 'sawtooth', 0.3, 0.1);
  }

  // Ascending chime (3 notes) for pickup collection
  static playPickup(): void {
    this.playTone(600, 0.08, 'sine', 0.4);
    this.playTone(800, 0.08, 'sine', 0.4, 0.06);
    this.playTone(1000, 0.12, 'sine', 0.3, 0.12);
  }

  // Triumphant arpeggio for wave complete
  static playWaveComplete(): void {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 'sine', 0.4, i * 0.1);
    });
  }

  // Deep pulsing alarm for boss warning
  static playBossWarning(): void {
    for (let i = 0; i < 3; i++) {
      this.playTone(100, 0.25, 'square', 0.6, i * 0.35);
      this.playTone(80, 0.25, 'square', 0.4, i * 0.35 + 0.05);
    }
  }

  // Sad descending melody for game over
  static playGameOver(): void {
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.25, 'sawtooth', 0.4, i * 0.2);
    });
  }

  // Quick ascending tone for jump
  static playJump(): void {
    this.playTone(300, 0.06, 'sine', 0.2);
    this.playTone(400, 0.06, 'sine', 0.15, 0.03);
  }

  // UI button click feedback
  static playButtonClick(): void {
    this.playTone(500, 0.04, 'square', 0.2);
  }

  // Upgrade selection sound
  static playUpgradeSelect(): void {
    this.playTone(400, 0.1, 'sine', 0.3);
    this.playTone(600, 0.1, 'sine', 0.3, 0.08);
    this.playTone(800, 0.15, 'sine', 0.4, 0.16);
  }

  // Burrower surfacing - rumble then pop
  static playBurrowSurface(): void {
    this.playTone(80, 0.15, 'sawtooth', 0.4);
    this.playTone(120, 0.1, 'square', 0.5, 0.1);
    this.playNoise(0.12, 0.6);
  }

  // Healer heal beam - gentle ascending chime
  static playHeal(): void {
    this.playTone(500, 0.12, 'sine', 0.25);
    this.playTone(700, 0.12, 'sine', 0.2, 0.08);
  }

  // Splitter splitting into two - wet pop sound
  static playSplit(): void {
    this.playTone(250, 0.08, 'square', 0.4);
    this.playTone(180, 0.1, 'sawtooth', 0.3, 0.05);
    this.playNoise(0.06, 0.3);
  }

  // Shellback roll attack - grinding rumble
  static playShellRoll(): void {
    this.playTone(100, 0.3, 'sawtooth', 0.3);
    this.playTone(90, 0.3, 'square', 0.2, 0.05);
  }

  // ============ Progression System Sounds ============

  // Treasure chest open - magical sparkle ascending
  static playChestOpen(): void {
    const notes = [523, 659, 784, 988, 1175]; // C5, E5, G5, B5, D6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.15, 'sine', 0.35, i * 0.06);
    });
    // Add sparkle
    this.playTone(1500, 0.1, 'sine', 0.2, 0.25);
    this.playTone(1800, 0.1, 'sine', 0.15, 0.3);
  }

  // XP orb collect - quick quiet blip
  static playXPCollect(): void {
    this.playTone(700, 0.04, 'sine', 0.15);
    this.playTone(900, 0.03, 'sine', 0.1, 0.02);
  }

  // Level up - triumphant 5-note fanfare
  static playLevelUp(): void {
    const notes = [523, 659, 784, 1047, 1319]; // C5, E5, G5, C6, E6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.25, 'sine', 0.5, i * 0.12);
    });
    // Add bass undertone
    this.playTone(262, 0.5, 'triangle', 0.3);
    // Shimmer at the end
    this.playTone(1568, 0.15, 'sine', 0.2, 0.5);
    this.playTone(1760, 0.15, 'sine', 0.2, 0.55);
  }

  // Infinite swarm start - ominous deep drone building to tension
  static playInfiniteSwarmStart(): void {
    // Deep bass drone
    this.playTone(60, 1.0, 'sawtooth', 0.4);
    this.playTone(80, 0.8, 'square', 0.3, 0.2);
    // Rising tension
    this.playTone(100, 0.6, 'sawtooth', 0.35, 0.5);
    this.playTone(120, 0.4, 'square', 0.3, 0.7);
    // Alarm hits
    this.playTone(200, 0.2, 'square', 0.5, 0.9);
    this.playTone(250, 0.2, 'square', 0.5, 1.0);
  }

  // ============ Volume Control ============

  static setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  static getVolume(): number {
    return this.masterVolume;
  }

  static toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  static getMuted(): boolean {
    return this.isMuted;
  }

  static setMuted(muted: boolean): void {
    this.isMuted = muted;
  }
}
