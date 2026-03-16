import type { OkanMode } from "./types.js";

export interface OkanPersonality {
  name: string;
  workingText: string;
  permissionPrefix: string;
  doneText: string;
  aftercareGreeting: string;
  soundFile: string;
  pulseIntensity: "low" | "medium" | "high";
  escalateAfterMs: number | null;
}

export const PERSONALITIES: Record<OkanMode, OkanPersonality> = {
  gentle: {
    name: "Gentle Mom",
    workingText: "working...",
    permissionPrefix: "Sweetie, Claude would like to ask:",
    doneText: "All done, honey!",
    aftercareGreeting: "Welcome back, dear!",
    soundFile: "gentle.mp3",
    pulseIntensity: "low",
    escalateAfterMs: null,
  },
  classic: {
    name: "Classic Mom",
    workingText: "working...",
    permissionPrefix: "Hey, Claude wants to know:",
    doneText: "Dinner is ready!",
    aftercareGreeting: "Welcome back!",
    soundFile: "classic.mp3",
    pulseIntensity: "medium",
    escalateAfterMs: null,
  },
  mom: {
    name: "Asian Mom",
    workingText: "working...",
    permissionPrefix: "OI! Claude is asking! Answer NOW:",
    doneText: "STOP WATCHING! WORK IS DONE!",
    aftercareGreeting: "Finally! You're back!",
    soundFile: "mom.mp3",
    pulseIntensity: "high",
    escalateAfterMs: 5_000,
  },
};
