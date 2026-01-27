# Quillstorm Audio System

## Overview

Quillstorm uses procedural audio generated via the Web Audio API. No external audio files are required - all sounds are synthesized in real-time.

## AudioManager API

Located in `src/systems/AudioManager.ts`

### Initialization

```typescript
// Must be called on first user interaction (browser requirement)
AudioManager.initialize();
AudioManager.resume(); // Resume if suspended
```

### Sound Effects

| Method | Description | When Used |
|--------|-------------|-----------|
| `playShoot()` | Quick high-pitched blip | Player fires quill |
| `playHit()` | Low thud with noise | Quill hits enemy (non-lethal) |
| `playEnemyDeath()` | Descending tone + noise | Enemy killed |
| `playPlayerDamage()` | Harsh sawtooth warning | Player takes damage |
| `playPickup()` | Ascending 3-note chime | Collect quill pickup |
| `playJump()` | Quick ascending tone | Player jumps |
| `playWaveComplete()` | Triumphant C-E-G-C arpeggio | Wave cleared |
| `playBossWarning()` | Deep pulsing alarm (3x) | Boss wave incoming |
| `playGameOver()` | Sad descending melody | Player dies |
| `playButtonClick()` | Quick UI blip | Menu button pressed |
| `playUpgradeSelect()` | Rising chime | Upgrade chosen |

### Volume Control

**In-Game Controls:**
- Press **M** during gameplay to toggle mute
- Open pause menu (ESC) to access volume slider

**API Methods:**
```typescript
AudioManager.setVolume(0.5);    // 0.0 to 1.0
AudioManager.getVolume();       // Returns current volume
AudioManager.toggleMute();      // Returns new mute state
AudioManager.getMuted();        // Check if muted
AudioManager.setMuted(true);    // Set mute directly
```

## Sound Design

### Waveforms Used
- **Square**: Retro 8-bit feel, sharp attack
- **Sine**: Smooth, melodic tones
- **Sawtooth**: Harsh, warning sounds

### Sound Characteristics

**Combat Sounds**
- Shoot: 800Hz → 600Hz, very short (50ms)
- Hit: 200Hz + white noise, 100ms
- Death: 300Hz → 200Hz cascade + noise burst

**Feedback Sounds**
- Pickup: 600Hz → 800Hz → 1000Hz ascending
- Damage: 150Hz → 100Hz sawtooth, threatening
- Jump: 300Hz → 400Hz quick rise

**Event Sounds**
- Wave Complete: C5-E5-G5-C6 arpeggio
- Boss Warning: 100Hz + 80Hz pulsing 3 times
- Game Over: 400-350-300-200 descending

## Integration Points

Audio is called from these locations:

| File | Sound |
|------|-------|
| `MenuScene.ts` | Button click, initialize audio |
| `GameScene.ts` | Shoot, hit, death, pickup, player damage, game over |
| `Player.ts` | Jump |
| `HUD.ts` | Wave complete, boss warning |
| `UpgradeScene.ts` | Upgrade select |
| `GameOverScene.ts` | Button clicks |

## Adding New Sounds

### Simple Tone
```typescript
static playMySound(): void {
  this.playTone(
    440,        // frequency (Hz)
    0.2,        // duration (seconds)
    'sine',     // waveform: sine, square, sawtooth, triangle
    0.5,        // volume multiplier (0-1)
    0           // delay (seconds, optional)
  );
}
```

### Multi-Note Melody
```typescript
static playMelody(): void {
  const notes = [440, 550, 660]; // A4, C#5, E5
  notes.forEach((freq, i) => {
    this.playTone(freq, 0.15, 'sine', 0.4, i * 0.1);
  });
}
```

### With Noise
```typescript
static playImpact(): void {
  this.playTone(200, 0.1, 'square', 0.4);
  this.playNoise(0.1, 0.5); // duration, volume
}
```

## Browser Considerations

- Audio context must be created after user interaction
- Call `initialize()` on first click/keypress
- Call `resume()` if context gets suspended
- Mobile browsers may require additional user gestures
