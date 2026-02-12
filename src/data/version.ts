// Game version - update this when releasing new versions
export const GAME_VERSION = '0.5.6';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

// Changelog entries - newest first
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.5.6',
    date: '2026-02-12',
    changes: [
      'New rare upgrade: Blood Quills — +3 vampirism strength, +20% damage',
      'Vampire Lord buffed — vampirism strength 3→5, damage 30%→50%',
      'Upgrade cards now show all stat effects (crit damage, bouncing, quill speed, jump, quill size, knockback, range damage)',
      'Armor and evasion reworked — new exponential saturation formula reaches 90-95% with heavy stacking',
      'Fixed infinite swarm timer overlapping HP/DMG stats, and level up / wave complete banners no longer overlap',
      'Restart and main menu buttons now require confirmation during a run to prevent accidental progress loss',
    ],
  },
  {
    version: '0.5.5',
    date: '2026-02-11',
    changes: [
      '"Killed By" display on game over screen — shows exactly what killed you',
      'Death recap panel — last 5 hits with wave number, damage amount, and timing',
      'Wave survival timer added to game over stats — shows how long you lasted in your final wave',
      'Infinite swarm survival timer — live mm:ss counter that color-shifts through all 4 stages',
      'Flying enemies (swoopers, bombers) now spawn across the full top of the screen instead of only at edges',
      'New legendary upgrade: Lodestone — periodic magnetic pulse pulls all pickups toward you',
      'Treasure chest despawn time increased (9s → 15s)',
      'Pinecone despawn time increased (12s → 15s)',
      'Armor scaling buffed — single pick now gives ~13% reduction, heavy investment reaches ~69%',
      'Evasion scaling buffed — single pick now gives ~10% dodge, heavy investment reaches ~61%',
    ],
  },
  {
    version: '0.5.4',
    date: '2026-02-10',
    changes: [
      'Fixed shellback stunlock exploit — status effects no longer apply during rolling or burrowed states',
      'Shellback roll now locks direction at start instead of tracking the player mid-roll',
      'Shellback roll speed increased (100 → 160)',
      'Movement speed cap reduced (600 → 500 px/sec)',
      'Scurriers now commit to a direction briefly before reversing (250ms delay)',
      'Scurrier jump cooldown added (1.2s after landing) and jump frequency reduced',
    ],
  },
  {
    version: '0.5.3',
    date: '2026-02-07',
    changes: [
      'Achievement system — 18 achievements across combat, survival, score, and style categories',
      'Cumulative stats tracking: kills, boss kills, elite kills, waves survived, perfect waves',
      'Per-run stats: score, wave, upgrade count, infinite swarm survival, and more',
      'Wave-timing achievements (e.g., complete a wave without damage) trigger mid-game',
      'Achievements unlock exclusive cosmetics (Spectral skin, Inferno skin, Party Hat, Halo)',
      'Achievement progress syncs to server across devices',
      'Achievement counter shown on game over screen',
    ],
  },
  {
    version: '0.5.2',
    date: '2026-02-06',
    changes: [
      // Spawn reorder
      'Rebalanced enemy spawn order for smoother difficulty curve',
      'Swoopers now appear at wave 2, spitters at wave 4, shellbacks at wave 6',
      'Burrowers moved to wave 9, splitters to wave 11',
      // Burrower improvements
      'Burrower HP reduced (50 → 38) to compensate for underground invulnerability',
      'Burrower warning phase extended with exclamation mark and repeating dirt particles',
      // Bomber
      'New enemy: Bomber — flying crow that drops AoE danger zones',
      'Bomber replaces healer at wave 15, creating area denial mechanics',
      // Spawn pacing
      'Slightly increased breathing room between enemy spawns in later waves',
      // Upgrade balance pass
      'Thick Quills buffed: bigger quills, knockback, and bonus damage',
      'Quick Draw + Aerodynamic merged into Swift Quills (fire rate + speed + distance damage)',
      'All armor upgrades now include thorns reflection',
      'All evasion upgrades buffed — dodging can now counter-attack enemies',
      // New mechanics
      'New mechanic: Knockback — quills push enemies on hit',
      'New mechanic: Distance Damage — quills deal bonus damage at range',
      'New mechanic: Dodge Counter — successful dodges can execute attackers',
      // Companion overhaul
      'Companions now inherit your build — damage, crit, speed, elemental, and more at scaled efficiency',
      'Companion efficiency: 40% base + 3% per companion (up to 70%)',
      'Companions fire 20% of your projectile count and scale with your fire rate',
      'Companion range increased to 600px',
      // Kill handling fixes
      'All kill sources now properly award score, XP, and drops (burn, explosion, shatter, thorns)',
      // Elemental overhaul
      'Elemental overhaul: each element now evolves through 4 tiers at strength 2/5/8/12',
      'Lightning: stun + chain arcs that scale with strength (more arcs, longer stun, arc stun chance)',
      'Ice: 70% slow at T1 → direct freeze at T2 → frost aura at T3 → shatter on death at T4',
      'Fire: burn DoT with +50% DPS at T2, death spread at T2+, burn slow at T3, explosion at T4',
      'Poison: 25% amp per strength per stack, stack growth at T2, death spread at T3, execute <15% HP at T4',
      '4 new dual-element epic upgrades: Tempest, Wildfire, Frostfire, Venomshock',
      'New legendary: Elemental Convergence (+3 all elements, 20% secondary proc chance)',
      'Removed 8 old elemental upgrades absorbed into evolution tiers (73 total upgrades)',
    ],
  },
  {
    version: '0.5.1',
    date: '2026-02-06',
    changes: [
      // Boss Respite Choice
      'Boss waves now offer a choice: Restoration or Power (upgrades)',
      'Restoration options: Full HP, Full Quills, or Balance (30-60% of both)',
      'Choice is blind — commit before seeing what\'s available',
      // Vampirism rework
      'Vampirism reworked: stack-based proc chance and healing (no longer damage-dependent)',
      'Life Leech now gives +1 vampirism strength (4.8% proc, 11 HP per heal)',
      'Vampire Lord now gives +3 vampirism strength plus bonus damage',
      'Vampirism stacks scale with diminishing returns on proc, linear on healing',
      // Wave quill bonus
      '+5 quills restored on normal wave completion',
      // Level scaling
      '+5% damage per level to smooth early-game power curve',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-02-05',
    changes: [
      // Elemental system
      'Elemental quill effects: Lightning (stun), Ice (freeze), Fire (stacking burn), Poison (stacking damage amp)',
      'Elemental strength system — diminishing returns formula for balanced stacking',
      'All elemental upgrades now infinitely stackable (Legendary alone = 33% proc chance)',
      'Chain lightning arcs to nearby enemies on shock proc (+3 targets per upgrade)',
      'Frozen enemies shatter on death dealing AOE damage (+50% max HP per upgrade)',
      'Burning enemies explode on death (+80px radius per upgrade), fire aura damages nearby',
      'Poison cloud on death (+50px per upgrade), damage amp scales with strength',
      'Fire DPS and Poison amp scale with your damage modifier',
      // Defense system
      'New defense stats: Armor (damage reduction) and Evasion (dodge chance)',
      'Thorns damage reflection from Diamond Hide upgrade',
      // Mythic upgrades
      'Mythic upgrade: Fate\'s Favor (30% chance to reroll failed procs)',
      'Mythic upgrade: Quill Apotheosis (every 5th volley auto-crits with all elements)',
      '26 new upgrades across all rarity tiers',
      // Balance overhaul
      'Major balance overhaul — shield, prosperity, and crit systems rebalanced',
      'Shield charges now cap at 10, iframes diminish with rapid hits (400ms→100ms)',
      'Shield upgrades restructured: Rare (+1), Epic (+2, +30 HP), Legendary (+4, +100 HP)',
      'Prosperity no longer grants crit bonus — focus on drops and rarity',
      'Chest drop chance now uses logarithmic curve (7% at 100 prosperity, caps at 14%)',
      'New two-phase level-up rarity system — uncommon peaks at 60% at 100 prosperity',
      'Chest rarity now scales linearly (rare peaks at 60% at 500 prosperity)',
      'Crit chance now has diminishing returns: raw/(raw+1) formula',
      'Movement speed capped at 600 px/sec to prevent uncontrollable gameplay',
      'Explosion radius capped at 400px maximum',
      'Stats panel now scrollable to fit armor/evasion display',
      'Score submission cap removed (was 2,999,999)',
      // Multi-stage infinite swarm
      '4-stage infinite swarm: Swarm (0-3 min), Surge (3-6 min), Frenzy (6-9 min), Apocalypse (9+ min)',
      'Swarm enemies gain colored tint at each stage (orange → red → purple)',
      'Stage transitions with screen flash and sound effect',
      'Enemy damage fully uncapped — scales naturally with swarm multipliers',
      'Elite spawn chance scales with stage (+0%/+5%/+10%/+20%)',
      'Quadratic explosion scaling in Apocalypse stage — expect death by 12-15 minutes',
    ],
  },
  {
    version: '0.4.1',
    date: '2026-02-04',
    changes: [
      'Rebalanced infinite swarm — enemies are tankier but deal less damage',
      'Split HP and damage scaling (quadratic HP, square root damage with per-type caps)',
      'Slower spawn rate ramp — 10ms floor now reached at ~12 min instead of ~7 min',
      'Bosses now spawn during infinite swarm at danger level 5+',
      'Boss spawn chance and cooldown scale with danger level',
      'Added shield visual indicator — cyan diamond icon with charge pips above player',
      'Shield charges now regenerate over time during infinite swarm (1 per 30s)',
      'Taking a hit resets the shield regen timer',
      'Shield upgrades picked mid-wave now grant charges immediately',
      'Quill regen delay now scales down with regen rate upgrades (600ms base → 100ms at 200%)',
      'Separate elite kills section on game over screen',
      'Fixed wave scaling bug that inflated swarm enemy stats',
      'HUD now shows separate HP and damage multipliers during infinite swarm',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-02-04',
    changes: [
      'Added elite enemies — rare, tougher variants with gold glow and boosted rewards',
      'Added Danger Level system — opt-in difficulty upgrades that scale enemy strength and rewards',
      'Added Elite Hunter and Elite Slayer upgrade cards for bonus damage vs elites',
      'Added mythic rarity tier (ultra-rare, red border)',
      'Added Expanded Options mythic upgrade — see 4 cards instead of 3',
      'Added kill breakdown panel on game over screen with elite kill tracking',
      'Added detailed stats panel (Tab) with danger level breakdown',
      'Added variable-height jumping — tap for short hops, hold for full jumps',
      'Added rainbow quill color cycling for Rainbow Quills cosmetic',
      'Redesigned main menu with mascot art and rounded buttons',
      'Improved hat positioning and rendering on porcupine',
      'HUD reorganized — quill count under quill bar, level under XP bar',
      'Leaderboard now accessible from game over screen',
      'Minimum wave 5 required to submit to leaderboard',
      'Player data now syncs to server across sessions',
    ],
  },
  {
    version: '0.3.3',
    date: '2026-02-03',
    changes: [
      'Added porcupine walk cycle animation with leg movement and body bob',
      'Added landing squash effect when hitting the ground',
      'Added quill sway that trails behind movement direction',
      'Quills now distribute along the body shape for a natural look',
      'Smoother quill depletion with 5 visual tiers instead of 3',
      'Made porcupine body more oval to match menu art',
      'Added coyote time for more forgiving jumps',
      'Added effects opacity slider to pause menu',
      'Fixed chests floating in air from flying enemies',
      'Fixed despawn timers running during pause/upgrades',
      'Fixed crash on game over screen from null body references',
      'Fixed XP orbs and pinecones hovering in mid-air',
      'Vampirism is now chance-on-hit instead of healing every hit',
      'Improved score validation',
    ],
  },
  {
    version: '0.3.2',
    date: '2026-02-03',
    changes: [
      'Improved canvas scaling and aspect ratio handling',
      'Improved shop card layout and readability',
      'Improved leaderboard submission reliability',
      'General server stability improvements',
    ],
  },
  {
    version: '0.3.1',
    date: '2026-02-01',
    changes: [
      'Added low health warning - character pulses red when below 20% HP',
      'Added stats panel to game over screen (press TAB to view)',
      'Fixed shop card layout (descriptions no longer overlap buttons)',
      'Fixed accidental quill shooting when selecting powerups',
      'Fixed boss getting stuck under platforms after charging',
      'Improved boss drop handling during level transitions',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-02-01',
    changes: [
      'Added stage color themes that change after each boss',
      'Added HP numbers to health bar for clarity',
      'Added version number and changelog to menu',
      'Increased treasure chest despawn time (7s → 9s)',
      'Fixed treasure chests falling through floor after boss waves',
      'Fixed XP orbs falling through floor after boss waves',
      'Fixed boss getting stuck after charge attack',
      'Fixed player being able to jump off top of screen',
      'Fixed spam-click issues on upgrade selection',
      'Fixed accidental clicks on game over screen',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-01-30',
    changes: [
      'Added Shop with pinecone currency',
      'Added cosmetic skins, hats, quill styles, and trails',
      'Added Google Sign-In for cross-device progress sync',
      'Pinecones drop from enemies (4% chance) and bosses (guaranteed)',
      'Added pinecone counter to HUD',
    ],
  },
  {
    version: '0.1.5',
    date: '2026-01-28',
    changes: [
      'Fixed wave 21 bug - waves now cap at 20 before infinite swarm',
      'Prevented wave double-starts from stacked delayed calls',
      'Fixed name input keyboard capture issues',
      'Name input modal now always shows (can change name between runs)',
    ],
  },
  {
    version: '0.1.4',
    date: '2026-01-26',
    changes: [
      'Added quadratic boss HP scaling by tier',
      'Improved infinite swarm difficulty scaling',
      'Balanced boss health progression',
    ],
  },
  {
    version: '0.1.3',
    date: '2026-01-24',
    changes: [
      'Added Infinite Swarm mode after wave 20',
      'Added XP/leveling system with level-up upgrades',
      'Added treasure chests with guaranteed rare+ drops',
      'Added prosperity stat affecting drop rates',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-01-20',
    changes: [
      'Initial release',
      'Core gameplay: shoot quills, defeat enemies, survive waves',
      '8 enemy types + 2 boss types',
      'Upgrade system with 5 rarity tiers',
      'Online leaderboards (global and weekly)',
    ],
  },
];
