# Quillstorm Roadmap

## Completed Features

### Core Gameplay
- [x] Player movement and jumping
- [x] Quill shooting mechanics
- [x] Quill state system (full/patchy/sparse/naked)
- [x] Quill regeneration
- [x] 5 enemy types with unique AI
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
- [x] Volume settings in pause menu
- [x] Mute toggle (M key)
- [x] New upgrade types: shields, companions, explosions, homing, vampirism
- [x] Difficulty balancing (slower scurriers, ranged spitters)
- [x] Solo boss on wave 5, minions on later boss waves

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
- [ ] Additional enemy types
  - Burrower (emerges from ground)
  - Splitter (divides when killed)
  - Healer (buffs nearby enemies)
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
- [ ] Online leaderboards
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
