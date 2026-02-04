// Game version - update this when releasing new versions
export const GAME_VERSION = '0.4.2';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

// Changelog entries - newest first
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.4.2',
    date: '2026-02-04',
    changes: [
      'Elemental quill effects: Lightning (stun), Ice (freeze), Fire (stacking burn), Poison (stacking damage amp)',
      'Chain lightning arcs to nearby enemies on shock proc',
      'Frozen enemies shatter on death dealing AOE damage',
      'Burning enemies explode on death, fire aura damages nearby foes',
      'Poison weakens enemies (bonus damage taken), spreads on death',
      'Fire and Poison stack on enemies for escalating damage',
      'New defense stats: Armor (damage reduction) and Evasion (dodge chance)',
      'Thorns damage reflection from Diamond Hide upgrade',
      'Mythic upgrade: Fate\'s Favor (30% chance to reroll failed procs)',
      'Mythic upgrade: Quill Apotheosis (every 5th volley auto-crits with all elements)',
      '26 new upgrades across all rarity tiers',
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
      'Improved anti-cheat score validation',
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
