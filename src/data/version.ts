// Game version - update this when releasing new versions
export const GAME_VERSION = '0.3.2';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

// Changelog entries - newest first
export const CHANGELOG: ChangelogEntry[] = [
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
