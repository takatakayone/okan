import type { OkanState } from "@okan-ai/shared";

export class SessionState {
  private _state: OkanState = "idle";
  private _startedAt: number | null = null;
  private _toolUseCount = 0;
  private _listeners: Array<(state: OkanState) => void> = [];

  get state(): OkanState {
    return this._state;
  }

  get startedAt(): number | null {
    return this._startedAt;
  }

  get toolUseCount(): number {
    return this._toolUseCount;
  }

  onChange(listener: (state: OkanState) => void): void {
    this._listeners.push(listener);
  }

  transition(to: OkanState): void {
    const from = this._state;
    if (from === to) return;

    // Validate transitions
    const valid: Record<OkanState, OkanState[]> = {
      idle: ["working", "waiting_permission", "done"],
      working: ["waiting_permission", "done", "idle"],
      waiting_permission: ["working", "idle"],
      done: ["idle", "working"],
    };

    if (!valid[from].includes(to)) {
      console.warn(`Invalid state transition: ${from} → ${to}`);
      return;
    }

    this._state = to;

    if (to === "working" && from === "idle") {
      this._startedAt = Date.now();
      this._toolUseCount = 0;
    }

    if (to === "idle") {
      this._startedAt = null;
    }

    for (const listener of this._listeners) {
      listener(to);
    }
  }

  incrementToolUse(): void {
    this._toolUseCount++;
  }

  getSessionDuration(): number {
    if (!this._startedAt) return 0;
    return Date.now() - this._startedAt;
  }

  reset(): void {
    this._state = "idle";
    this._startedAt = null;
    this._toolUseCount = 0;
  }
}
