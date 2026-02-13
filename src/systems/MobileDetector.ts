/**
 * Detects mobile devices and exposes flags used to gate all mobile-specific
 * behavior (virtual controls, UI scaling, hover removal).
 *
 * Desktop users are completely unaffected — every mobile code path checks
 * these flags before activating.
 */
export class MobileDetector {
  private static _isTouchDevice: boolean | null = null;
  private static _isMobile: boolean | null = null;

  /** True when the device supports touch input */
  static get isTouchDevice(): boolean {
    if (this._isTouchDevice === null) {
      this._isTouchDevice =
        navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    }
    return this._isTouchDevice;
  }

  /** True when the screen is small enough to qualify as a phone/small tablet */
  static get isSmallScreen(): boolean {
    // Use innerWidth/innerHeight so Chrome DevTools device emulation works
    const w = Math.max(window.innerWidth, window.innerHeight);
    return w < 1024;
  }

  /** True on mobile devices — combines UA heuristic + touch + screen size */
  static get isMobile(): boolean {
    // Cache result on first call — detection runs once at startup
    if (this._isMobile === null) {
      const ua = navigator.userAgent;
      const uaMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      this._isMobile = uaMobile || (this.isTouchDevice && this.isSmallScreen);
    }
    return this._isMobile;
  }

  /**
   * Main gate for all mobile UI and input.
   * When true: show virtual joystick, scale UI, use touch aim.
   * When false: desktop behavior is completely unchanged.
   */
  static get showVirtualControls(): boolean {
    return this.isMobile;
  }

  /**
   * UI scale multiplier for font sizes and element dimensions.
   * Returns 1.0 on desktop (no change), 1.5 on mobile.
   */
  static get uiScale(): number {
    return this.showVirtualControls ? 1.5 : 1.0;
  }
}
