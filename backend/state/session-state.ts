import type { BrowserWindow, Tray } from "electron";

type SessionPhase =
  | "idle"
  | "recording"
  | "transcribing"
  | "processing"
  | "injecting"
  | "completed"
  | "failed";

type SessionState = {
  getSettingsWindow: () => BrowserWindow | null;
  setSettingsWindow: (windowRef: BrowserWindow) => void;
  getTray: () => Tray | null;
  setTray: (trayRef: Tray) => void;
  getPhase: () => SessionPhase;
  canTransitionTo: (nextPhase: SessionPhase) => boolean;
  transitionTo: (nextPhase: SessionPhase) => boolean;
  reset: () => void;
};

const createSessionState = (): SessionState => {
  let settingsWindow: BrowserWindow | null = null;
  let tray: Tray | null = null;

  const getSettingsWindow = (): BrowserWindow | null => settingsWindow;
  const setSettingsWindow = (windowRef: BrowserWindow): void => {
    settingsWindow = windowRef;
  };
  const getTray = (): Tray | null => tray;
  const setTray = (trayRef: Tray): void => {
    tray = trayRef;
  };
  let phase: SessionPhase = "idle";
  const allowedTransitions: Record<SessionPhase, SessionPhase[]> = {
    idle: ["recording"],
    recording: ["transcribing", "failed"],
    transcribing: ["processing", "failed"],
    processing: ["injecting", "failed"],
    injecting: ["completed", "failed"],
    completed: ["idle"],
    failed: ["idle"]
  };
  const getPhase = (): SessionPhase => phase;
  const canTransitionTo = (nextPhase: SessionPhase): boolean => {
    return allowedTransitions[phase].includes(nextPhase);
  };
  const transitionTo = (nextPhase: SessionPhase): boolean => {
    if (!canTransitionTo(nextPhase)) {
      return false;
    }
    phase = nextPhase;
    return true;
  };
  const reset = (): void => {
    phase = "idle";
  };

  return {
    getSettingsWindow,
    setSettingsWindow,
    getTray,
    setTray,
    getPhase,
    canTransitionTo,
    transitionTo,
    reset
  };
};

export type { SessionPhase, SessionState };
export { createSessionState };
