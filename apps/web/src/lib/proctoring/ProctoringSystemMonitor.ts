import { ProctoringEventLogger } from './proctoring.types';

export class ProctoringSystemMonitor {
  constructor(
    private logger: ProctoringEventLogger,
    private onViolation: (kind: string) => void,
    private isActiveGetter: () => { isEnded: boolean; isPaused: boolean; suppressViolations: boolean }
  ) {}

  addEventListeners(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('paste', this.handlePaste);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  removeEventListeners(): void {
    if (typeof window === 'undefined') return;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  private handleVisibilityChange = (): void => {
    const { isEnded, isPaused, suppressViolations } = this.isActiveGetter();
    if (isEnded || isPaused || suppressViolations) return;
    const isHidden = document.hidden;
    const kind = isHidden ? 'tab_hidden' : 'tab_visible';
    const severity = isHidden ? 'warning' : 'info';
    this.logger.logEvent(kind, severity, 'browser');
    if (isHidden) {
      this.onViolation('tab_hidden');
    }
  };

  private handleFullscreenChange = (): void => {
    const { isEnded, isPaused, suppressViolations } = this.isActiveGetter();
    if (isEnded || isPaused || suppressViolations) return;
    const isFS = !!document.fullscreenElement;
    const kind = isFS ? 'fullscreen_enter' : 'fullscreen_exit';
    const severity = isFS ? 'info' : 'warning';
    this.logger.logEvent(kind, severity, 'browser');
    if (!isFS) {
      this.onViolation('fullscreen_exit');
    }
  };

  private handleFocus = (): void => {
    const { isEnded, isPaused, suppressViolations } = this.isActiveGetter();
    if (isEnded || isPaused || suppressViolations) return;
    this.logger.logEvent('window_focus', 'info', 'browser');
  };

  private handleBlur = (): void => {
    const { isEnded, isPaused, suppressViolations } = this.isActiveGetter();
    if (isEnded || isPaused || suppressViolations) return;
    this.logger.logEvent('window_blur', 'warning', 'browser');
    this.onViolation('window_blur');
  };

  private handleOnline = (): void => {
    const { isEnded } = this.isActiveGetter();
    if (isEnded) return;
    this.logger.logEvent('network_reconnected', 'info', 'system');
  };

  private handleOffline = (): void => {
    const { isEnded, suppressViolations } = this.isActiveGetter();
    if (isEnded || suppressViolations) return;
    this.logger.logEvent('network_disconnected', 'high', 'system');
    this.onViolation('network_disconnected');
  };

  private handleCopy = (): void => {
    this.logger.logEvent('copy_activity', 'info', 'browser', {
      timestamp: new Date().toISOString(),
    });
  };

  private handlePaste = (): void => {
    this.logger.logEvent('paste_activity', 'warning', 'browser', {
      timestamp: new Date().toISOString(),
    });
    this.onViolation('paste_activity');
  };

  private handleBeforeUnload = (): void => {
    this.logger.logEvent('session_unload_attempt', 'warning', 'browser', {
      timestamp: new Date().toISOString(),
    });
  };
}
