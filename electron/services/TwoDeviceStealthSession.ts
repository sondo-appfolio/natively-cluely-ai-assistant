/**
 * Two-device stealth session — desktop half of InterviewMan-like phone control.
 * Phone Mirror keeps serving answers; this module hides/restores the overlay and
 * engages undetectable without tearing down mic/LLM/Phone Mirror/stealth globals.
 *
 * stealth-sticky-after-session (ADR 0017): exit/end may restore overlay visibility
 * but must never restore detectability.
 */

import { undetectableAfterTwoDeviceExit } from './sessionStealthPolicy';

export type TwoDeviceStealthOp = 'enter' | 'exit' | 'end';

export interface TwoDeviceStealthHost {
  getUndetectable(): boolean;
  setUndetectable(on: boolean): void;
  isOverlayVisible(): boolean;
  hideOverlay(): void;
  showOverlay(): void;
  endMeeting(): Promise<void>;
}

export interface TwoDeviceStealthResult {
  ok: boolean;
  action: TwoDeviceStealthOp | 'noop';
  message: string;
  active: boolean;
}

export class TwoDeviceStealthSession {
  private static _instance: TwoDeviceStealthSession | null = null;

  static getInstance(): TwoDeviceStealthSession {
    if (!this._instance) this._instance = new TwoDeviceStealthSession();
    return this._instance;
  }

  /** Test helper — drop singleton between cases. */
  static resetInstanceForTests(): void {
    this._instance = null;
  }

  private active = false;
  private priorOverlayVisible: boolean | null = null;

  isActive(): boolean {
    return this.active;
  }

  enter(host: TwoDeviceStealthHost): TwoDeviceStealthResult {
    if (this.active) {
      return {
        ok: true,
        action: 'noop',
        message: 'Already in two-device stealth',
        active: true,
      };
    }
    this.priorOverlayVisible = host.isOverlayVisible();
    host.setUndetectable(true);
    host.hideOverlay();
    this.active = true;
    return {
      ok: true,
      action: 'enter',
      message: 'Two-device stealth on — overlay hidden',
      active: true,
    };
  }

  exit(host: TwoDeviceStealthHost): TwoDeviceStealthResult {
    if (!this.active) {
      return {
        ok: true,
        action: 'noop',
        message: 'Two-device stealth already off',
        active: false,
      };
    }
    const restoreOverlay = this.priorOverlayVisible !== false;
    host.setUndetectable(undetectableAfterTwoDeviceExit());
    if (restoreOverlay) host.showOverlay();
    this.active = false;
    this.priorOverlayVisible = null;
    return {
      ok: true,
      action: 'exit',
      message: 'Two-device stealth off — overlay restored',
      active: false,
    };
  }

  async end(host: TwoDeviceStealthHost): Promise<TwoDeviceStealthResult> {
    if (this.active) {
      this.exit(host);
    }
    await host.endMeeting();
    return {
      ok: true,
      action: 'end',
      message: 'Session ended',
      active: false,
    };
  }
}
