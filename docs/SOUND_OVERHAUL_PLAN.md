# Sound System Overhaul Plan

## Context
The game has grown significantly since the original sound effects were added (v0.5.0 era). Major systems — elemental effects, stage mechanics, dodge counter, knockback, bomb zones, achievements, and more — were added without corresponding audio. Currently 22 sound effects exist with 88 call sites, but ~42 game events are silent. The elemental combat loop (the game's core differentiator) is entirely soundless, and all 4 stage-specific mechanics (wind, darkness, lightning, crumble) lack audio feedback.

## Scope
Add **~20 new sound effects** focused on combat feel and environmental feedback. Also add subtle pitch randomization to frequently-repeated sounds (hits, deaths, shoots) to reduce listener fatigue.

---

## New Sounds by Priority

### Tier 1 — Core Combat Feel (highest impact)

| Sound | Trigger | Synthesis Approach |
|-------|---------|-------------------|
| `playShockProc()` | Shock/stun applied to enemy | High-freq noise burst (2000-4000Hz) + rapid square wave pulse, 80ms — electric zap |
| `playChainLightningArc()` | Each chain lightning arc hop | Shorter/quieter version of shock — pitched noise crackle, 50ms, lower volume |
| `playFreezeProc()` | Enemy frozen (T2+) | High crystalline tone (1200Hz sine) + short noise, 100ms — glass snap |
| `playChillProc()` | Enemy chilled (T1 ice) | Softer version of freeze — gentle high sine sweep down, 60ms |
| `playBurnProc()` | Burn DoT applied | Low-mid noise sweep (200-800Hz) + sawtooth undertone, 80ms — fire whoosh |
| `playPoisonProc()` | Poison applied | Wobbling low sine (150-250Hz) with slow modulation, 100ms — wet/bubbly |
| `playDodgeCounter()` | Dodge triggers counter-attack | Sharp ascending two-tone (500→800Hz) + noise hit, 80ms — satisfying slash |
| `playExplosion()` | AoE explosion (fire T4, quill explosion upgrade) | Deep noise burst + low sawtooth rumble (80Hz), 150ms |

### Tier 2 — Stage Mechanics & Environment

| Sound | Trigger | Synthesis Approach |
|-------|---------|-------------------|
| `playWindGust()` | Wind activates (Stage 2) | Filtered noise sweep (low-pass, rising then falling), 400ms — whoosh |
| `playLightningStrikeWarning()` | Lightning strike warning phase (Stage 4) | Rising high tone (600→1200Hz sine), 300ms — building tension |
| `playLightningStrikeHit()` | Lightning strike lands (Stage 4) | Loud crack: noise burst + high square pulse, 100ms |
| `playPlatformCrumble()` | Platform crumbles away (Stage 5) | Low rumbling noise + descending tone (200→80Hz), 200ms |
| `playPlatformRestore()` | Platform regenerates (Stage 5) | Gentle ascending chime (400→600Hz sine), 150ms |

### Tier 3 — Combat Feedback & Danger

| Sound | Trigger | Synthesis Approach |
|-------|---------|-------------------|
| `playBombWarning()` | Bomber creates bomb zone | Pulsing low tone (120Hz square, 2 pulses), 300ms — ominous ticking |
| `playBombExplode()` | Bomb zone detonates | Reuse `playExplosion()` or slight variant |
| `playThornsHit()` | Thorns damage reflects to enemy | Quick metallic ping (800Hz square, 40ms) — sharp ricochet |
| `playShieldBreak()` | Player loses last shield point | Descending crack: noise + falling tone (400→150Hz), 120ms |
| `playIceShatter()` | Frozen enemy shatters on death (T4) | Crystalline burst: high noise + multiple sine pings (1000-1500Hz), 120ms |

### Tier 4 — Polish & UI

| Sound | Trigger | Synthesis Approach |
|-------|---------|-------------------|
| `playAchievementUnlock()` | Achievement earned notification | Triumphant 3-note arpeggio (distinct from levelUp), 300ms |
| `playCompanionShoot()` | Companion fires quill | Softer/higher pitched variant of playShoot(), ~60% volume |

---

## Elemental Sound Cooldowns

Add a per-element cooldown system to prevent audio spam from rapid procs:

- Store `lastPlayTime` per element type: `shock`, `freeze`, `burn`, `poison`, `explosion`
- Cooldown: **150ms** — if the same element sound was played within 150ms, skip it
- Implementation: A `private static elementCooldowns: Record<string, number> = {}` map in AudioManager
- Helper: `private static canPlayElemental(element: string): boolean` checks and updates the timestamp
- Chain lightning arcs are exempt from cooldown (they're sequential by nature and already spaced)

---

## Ambient Stage Drones

Add a looping low-volume background drone per stage to differentiate atmosphere:

| Stage | Drone | Synthesis |
|-------|-------|-----------|
| The Thicket (1) | None (default, keeps it clean) | — |
| The Canopy (2) | Airy wind hum | Low-pass filtered noise + gentle sine (80Hz), very quiet |
| The Depths (3) | Deep subterranean rumble | Very low sawtooth (40-50Hz) + filtered noise, ominous |
| The Stormfront (4) | Distant thunder ambience | Periodic low noise pulses + mid-range hum |
| The Void (5) | Eerie atonal drone | Detuned sine waves (slight beating), unsettling |

Implementation:
- `startAmbientDrone(stageId: string)` — creates looping OscillatorNode(s) + GainNode
- `stopAmbientDrone()` — fades out and disconnects nodes
- Volume: 0.05-0.08 pre-master (barely perceptible, felt more than heard)
- Called in GameScene.create() after stage is determined, and stopAmbientDrone() in shutdown()
- Drone pauses when game is paused (PauseScene), resumes on unpause

---

## Pitch Randomization

Add subtle pitch variation (±5-10%) to frequently-triggered sounds to reduce repetition fatigue:

- `playShoot()` — randomize base frequencies ±8%
- `playHit()` — randomize ±10%
- `playEnemyDeath()` — randomize ±5%
- `playXPCollect()` — randomize ±10%
- All new elemental proc sounds — randomize ±8%

Implementation: Add a `randomizePitch(freq: number, variance: number): number` helper to AudioManager that returns `freq * (1 + (Math.random() - 0.5) * 2 * variance)`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/systems/AudioManager.ts` | Add ~20 new static methods, `randomizePitch()` helper, elemental cooldown system, ambient drone system; add pitch variance to existing sounds |
| `src/scenes/GameScene.ts` | Add AudioManager calls at: elemental procs, chain lightning, dodge counter, explosions, thorns, bomb zones, stage mechanics (wind/lightning/crumble), shield break, companion shoot; call `startAmbientDrone()`/`stopAmbientDrone()` |
| `src/entities/Enemy.ts` | Possibly add sound call for ice shatter on death (if handleElementalOnDeath is there) |
| `src/systems/AchievementManager.ts` | Add AudioManager call when achievement is earned |
| `src/scenes/PauseScene.ts` | Pause/resume ambient drone on pause/unpause |

---

## Implementation Order

1. Add `randomizePitch()` helper + elemental cooldown system + apply pitch variance to existing sounds
2. Implement Tier 1 sounds in AudioManager (8 elemental + dodge + explosion)
3. Wire Tier 1 sounds into GameScene (elemental procs, dodge counter, explosions)
4. Implement Tier 2 sounds (5 stage mechanics)
5. Wire Tier 2 sounds into GameScene (wind, lightning, crumble)
6. Implement ambient drone system (startAmbientDrone/stopAmbientDrone + per-stage drones)
7. Wire ambient drones (GameScene create/shutdown, PauseScene pause/resume)
8. Implement Tier 3 sounds (4 combat feedback)
9. Wire Tier 3 sounds into GameScene (bombs, thorns, shield, shatter)
10. Implement Tier 4 sounds (2 polish)
11. Wire Tier 4 sounds (achievement, companion)
12. Playtesting pass — adjust volumes, frequencies, and durations

---

## Volume Balancing Guidelines

- Elemental procs: 0.15-0.25 volume (frequent, shouldn't overwhelm)
- Stage mechanics: 0.3-0.4 volume (important environmental cues)
- Combat feedback (dodge, explosion): 0.3-0.5 volume (satisfying impact)
- UI/meta (achievement): 0.3-0.4 volume (noticeable but not jarring)
- Companion shoot: 0.1-0.15 volume (background, non-distracting)

All volumes are pre-master (master volume of 0.2 applied on top).

---

## Verification

1. Run `npm run dev` and play through waves 1-20+
2. Verify each elemental type produces distinct audio when proccing
3. Verify chain lightning arcs each produce a crackle sound
4. Verify dodge counter has satisfying audio feedback
5. Test Stage 2 (wind whoosh), Stage 4 (lightning), Stage 5 (crumble)
6. Confirm bomb zones have warning + detonation sounds
7. Confirm achievement unlock produces distinct sound
8. Verify no sounds are overwhelming at high proc rates (multiple enemies with elemental)
9. Run `npm run build` to ensure no TypeScript errors
