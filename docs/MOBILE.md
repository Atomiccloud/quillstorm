# Mobile Support

Quillstorm supports mobile browsers as a Progressive Web App (PWA). All mobile-specific code is gated behind `MobileDetector.showVirtualControls` — desktop behavior is completely unchanged.

## Architecture

### MobileDetector (`src/systems/MobileDetector.ts`)
Static utility class that gates all mobile behavior:
- `isMobile` — UA heuristic + touch capability + small screen check
- `isTouchDevice` — `navigator.maxTouchPoints > 0`
- `showVirtualControls` — main flag for virtual joystick, UI scaling, touch aim
- `uiScale` — returns 1.5 on mobile, 1.0 on desktop

Every mobile code path checks one of these flags. Desktop users see zero changes.

### VirtualJoystick (`src/ui/VirtualJoystick.ts`)
Custom Phaser Container (no plugin dependencies):
- **Position**: bottom-left (180, 660) in game coordinates
- **Outer ring**: 120px radius, semi-transparent
- **Inner thumb**: 40px radius, tracks finger position
- **Capture radius**: 200px — touch must land within this to activate
- **Deadzone**: 0.3 horizontal, 0.5 vertical (for jump)
- **Output**: normalized `forceX`/`forceY` (-1 to 1)
- **Multi-touch**: tracks a specific pointer ID to avoid conflicts with aim pointer

### Touch Aim System (`src/scenes/GameScene.ts`)
- Any touch not captured by the joystick becomes the aim pointer
- Auto-fires toward the aim position while held
- Stores aim position as scene-level `mobileAimX`/`mobileAimY`
- `Player.getAimAngle()` and `HUD.drawAimLine()` read from these on mobile

### UI Scaling
All scenes conditionally scale fonts and elements:
```typescript
const m = MobileDetector.showVirtualControls;
fontSize: m ? '30px' : '22px'
```
- Fonts scale ~1.4-1.5x for readability at 0.48x physical scale
- Health/quill bars widen from 200px to 280px
- Buttons enlarge for touch targets (min 44px physical)
- Hover effects disabled on touch devices (prevents sticky states)

## PWA Setup

### Files
- `public/manifest.json` — App manifest (fullscreen, landscape orientation)
- `public/sw.js` — Service worker (cache-first for assets, network-first for API)
- `public/icons/` — App icons (192px, 512px)

### index.html Changes
- Viewport: `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`
- Mobile CSS: full-bleed container, no border/shadow
- Portrait warning overlay: CSS-only, shows "rotate device" message
- `touch-action: none` on game container
- Service worker registration

### Installation
On mobile browsers, users can "Add to Home Screen" for a PWA experience:
- Fullscreen (no browser chrome)
- Landscape orientation lock
- Offline shell caching

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move left/right | A/D or arrows | Virtual joystick horizontal |
| Jump | W/Space/Up | Virtual joystick push up |
| Aim | Mouse position | Touch position (right side) |
| Shoot | Click/hold | Touch/hold (auto-fires) |
| Pause | ESC | Pause button (top-right) |
| Stats | TAB | Stats button (top-right) |
| Mute | M | Settings menu |

## Performance

- Mobile devices default to `auto` graphics quality (downgrades based on FPS)
- Particle counts reduced by 40% on mobile
- Existing auto-FPS monitoring handles runtime quality adjustment
- Fullscreen button on menu helps hide browser chrome

## Testing

### Chrome DevTools
Toggle device toolbar → select a phone (e.g., iPhone 14 Pro) in landscape → enables touch emulation and correct viewport size. Note: multi-touch requires a real device.

### Local Network
```bash
npx vite --host
```
Access from phone at `http://<local-ip>:3003`

### USB Debugging (Android)
Chrome remote debugging via `chrome://inspect` — see console logs and use DevTools from desktop.

### Key Test Cases
1. Joystick movement (left/right/jump)
2. Touch aim + auto-fire (simultaneous with joystick)
3. Upgrade card selection (no stuck hover states)
4. Pause via on-screen button
5. Stats panel toggle and scroll
6. Portrait orientation warning
7. PWA install and fullscreen launch

## Future: App Store Distribution

### TWA (Google Play)
Use Bubblewrap or PWABuilder CLI to wrap the PWA as a Trusted Web Activity. No code changes needed — purely configuration. Estimated: 1-2 days.

### Capacitor (iOS + Android)
For native features (push notifications, deep OS integration), migrate to Capacitor. Wraps the same web app in a native shell. Estimated: 4-6 weeks additional work.
