# Quillstorm Roadmap

## Completed Features

### Core Gameplay
- [x] Player movement and jumping
- [x] Quill shooting mechanics
- [x] Quill state system (full/patchy/sparse/naked)
- [x] Quill regeneration
- [x] 8 enemy types with unique AI (+ splitlings)
- [x] Wave-based progression
- [x] Boss waves every 5 waves
- [x] 46 upgrades across 5 rarities
- [x] High score persistence

### Recent Improvements
- [x] Fixed swooper platform collision (hover mode)
- [x] Enhanced pickup system (visible, platform collision)
- [x] Enemy stat scaling per wave
- [x] Procedural audio system
- [x] Level layout rotation after boss waves
- [x] Volume settings in pause menu and main menu
- [x] Mute toggle (M key)
- [x] New upgrade types: shields, companions, explosions, homing, vampirism
- [x] Difficulty balancing (slower scurriers, ranged spitters)
- [x] Solo boss on wave 5, minions on later boss waves
- [x] Canvas sizing (1440x810) with resize jitter fix
- [x] Online leaderboard system (global + weekly)
- [x] Vercel deployment with Upstash Redis (Vercel KV)
- [x] Graceful fallback when KV is unavailable
- [x] 3 new enemy types: Burrower (wave 8), Splitter (wave 12), Healer (wave 15)
- [x] Shellback roll attack (invincible spinning charge)
- [x] Spawn pacing: ramps from slow to fast within each wave
- [x] Enemy cap at 100 per wave (prevents 400+ enemy marathons)
- [x] Rebalanced spawn weights for all enemy types

## Planned Features

### Short Term

**Visual Polish**
- [ ] Screen flash on damage
- [ ] Particle trails on fast-moving quills
- [ ] Better enemy death explosions
- [ ] Damage numbers floating text

**Audio Enhancements**
- [ ] Background music (procedural or looping)
- [ ] Ambient sounds
- [x] Volume settings in pause menu
- [x] Mute toggle (M key)

**Quality of Life**
- [x] Quick restart key (R)
- [ ] Run statistics on game over
- [ ] Tutorial/help overlay

### Medium Term

**New Content**
- [x] Additional enemy types
  - [x] Burrower (emerges from ground with AOE)
  - [x] Splitter (divides into 2 splitlings when killed)
  - [x] Healer (heals nearby allies, floats, flees from player)
  - [x] Shellback roll attack (invincible spinning charge)
- [ ] More upgrade varieties
- [ ] Additional arena layouts

**Meta Progression**
- [ ] Persistent unlocks
- [ ] Starting bonuses based on high scores
- [ ] Achievement system
- [ ] Statistics tracking (total kills, waves, etc.)

**Boss Improvements**
- [ ] Multiple boss types with different attacks
- [ ] Boss health phases
- [ ] Boss-specific arenas

### Long Term

**Procedural Generation**
- [ ] Fully procedural level layouts
- [ ] Constraint-based platform placement
- [ ] Difficulty-adjusted generation

**Multiplayer**
- [ ] Local co-op (same screen)
- [x] Online leaderboards (global + weekly)
- [ ] Daily challenge seeds

**Platform Support**
- [ ] Mobile touch controls
- [ ] Gamepad support
- [ ] Fullscreen toggle
- [ ] Resolution options

## Known Issues

### Minor
- Pickups can sometimes spawn in unreachable locations
- Quill regeneration visual could be clearer
- Some upgrade descriptions could be more specific

### Leaderboard Security
The leaderboard checksum uses a client-side salt that is visible in the JS bundle. This deters casual manipulation but a determined user could forge submissions by extracting the salt and computing valid checksums. Current mitigations:
- Rate limiting (6 requests/60s per IP)
- Submission cooldown (10s between submissions)
- Score/wave proportionality check (server rejects anomalous scores)
- Name sanitization (prevents XSS)

If cheating becomes a problem, consider adding a moderation endpoint to remove suspicious entries.

### Considered but Not Planned
- Save mid-run (conflicts with roguelike design)
- Difficulty settings (prefer skill-based progression)
- Inventory/equipment system (keep it simple)

## Design Philosophy

### Roguelike Principles
Following established roguelike design:
1. **Quick Restart** - Get back in the action fast
2. **Skill > Luck** - Player improvement matters most
3. **Meaningful Choices** - Upgrades should feel impactful
4. **Clear Feedback** - Always know what's happening
5. **Fair Challenge** - Deaths should feel earned, not cheap

### Balance Goals
- Early game should stay engaging (not trivial warmup)
- Late game should challenge mastery
- Multiple viable build paths
- Risk/reward in quill management
