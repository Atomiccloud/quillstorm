# Quillstorm Level Design

## Arena System

The game features 5 distinct arena layouts that rotate after each boss wave (every 5 waves).

## Layout Templates

### Classic (Waves 1-5)
The original balanced layout for learning the game.

```
         [===]                     [===]
              [=====]   [=====]
    [===]        [======]        [===]
[====]         [====]          [====]
=================================================
```

- Lower tier: Easy jumps from ground
- Mid tier: Accessible from lower platforms
- Upper tier: Requires chaining jumps
- Good for: Learning enemy patterns

### Towers (Waves 6-10)
Vertical stacking on sides with open middle.

```
  [==]                             [==]
  [===]                           [===]
  [====]     [======]            [====]
            [========]
=================================================
```

- Left/right towers for vertical play
- Central bridges for crossing
- Open middle creates risk/reward
- Good for: Vertical combat, swooper fights

### Asymmetric (Waves 11-15)
Unbalanced layout requiring adaptation.

```
                           [===]
         [====]    [====]
    [=====]              [=====]
[====]      [======]           [=====]
=================================================
```

- No symmetry, must adapt positioning
- Varied heights create diverse combat
- Tests player spatial awareness
- Good for: Experienced players

### Sparse (Waves 16-20)
Fewer, larger platforms - more ground combat.

```
             [======]
       [======]     [======]
[========]   [==========]   [========]
=================================================
```

- Fewer platforms, larger surfaces
- More ground-based fighting
- Wide platforms for group fights
- Good for: Multi-enemy encounters

### Gauntlet (Waves 21-25)
Central corridor with flanking positions.

```
  [===]        [====]          [===]
  [====]      [======]        [====]
          [==========]
=================================================
```

- Strong central corridor
- Flanking platforms on sides
- Funnel-style combat
- Good for: Boss fights, defensive play

## Layout Cycling

Layouts change after defeating each boss:
- Wave 5 boss → Layout changes to Towers
- Wave 10 boss → Layout changes to Asymmetric
- Wave 15 boss → Layout changes to Sparse
- Wave 20 boss → Layout changes to Gauntlet
- Wave 25 boss → Cycles back to Classic

## Position Jitter

Each time a layout loads, platforms have minor random variation:
- **Horizontal**: ±20 pixels
- **Vertical**: ±10 pixels
- **Width**: ±10 pixels

This keeps layouts feeling fresh while maintaining playability.

## Design Principles

### Reachability
All platforms must be reachable:
- Maximum jump height: ~150 pixels
- Horizontal jump range: ~200 pixels with momentum
- No dead-end positions

### Combat Space
Platforms sized for combat:
- Minimum width: 100 pixels
- Enough room to dodge
- Multiple escape routes

### Enemy Compatibility
Layouts work with all enemy types:
- Ground enemies can reach player
- Swoopers have hover space
- Shellbacks have approach angles

## Spawn Points

Enemies spawn from screen edges:
- **Regular enemies**: Left or right edge, ground level
- **Swoopers**: Left or right edge, y=100
- **Boss**: Left or right edge, slightly elevated

Platform layouts don't affect spawn positions - enemies navigate to the player.
