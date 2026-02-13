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
        navigator.maxTouchPoints > 0 ||
        'ontouchstart' in window ||
        'ontouchstart' in document.documentElement;
    }
    return this._isTouchDevice;
  }

  /** True when the screen is small enough to qualify as a phone/small tablet */
  static get isSmallScreen(): boolean {
    // Check both viewport and physical screen — either being small counts
    const viewport = Math.max(window.innerWidth, window.innerHeight);
    const screen = Math.max(window.screen.width, window.screen.height);
    return Math.min(viewport, screen) < 1400;
  }

  /** True on mobile devices — combines UA heuristic + touch + screen size */
  static get isMobile(): boolean {
    // Cache result on first call — detection runs once at startup
    if (this._isMobile === null) {
      const ua = navigator.userAgent;
      // 'Mobi' catches most mobile browsers including Chrome reduced UA
      // ("...Mobile Safari/537.36") and Firefox Mobile
      const uaMobile = /Android|iPhone|iPad|iPod|Mobi|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      // Modern UA Client Hints API (Chrome 90+)
      const uaDataMobile = (navigator as any).userAgentData?.mobile === true;
      this._isMobile = uaMobile || uaDataMobile || (this.isTouchDevice && this.isSmallScreen);

      // Log detection for debugging on real devices
      console.log('[MobileDetector]', {
        result: this._isMobile,
        uaMobile,
        uaDataMobile,
        touch: this.isTouchDevice,
        smallScreen: this.isSmallScreen,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screen: `${window.screen.width}x${window.screen.height}`,
        touchPoints: navigator.maxTouchPoints,
        ua: ua.substring(0, 80),
      });
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
