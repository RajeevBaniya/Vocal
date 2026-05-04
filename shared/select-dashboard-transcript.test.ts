import { describe, expect, it } from "vitest";

import type { AppStatusSnapshot } from "./types/shared-types";
import { selectDashboardTranscript } from "./select-dashboard-transcript";

const baseSnapshot = (): AppStatusSnapshot => ({
  isReady: true,
  isSettingsWindowVisible: false,
  isTrayInitialized: false,
  availability: "idle",
  sessionPhase: "idle",
  configuredHotkey: "Ctrl+Space",
  isHotkeyRegistered: true,
  hotkeyRegistrationError: null,
  hotkeyActivationCount: 0,
  lastHotkeyActivationAt: null,
  isAudioReady: true,
  microphoneCapabilityKnown: true,
  isMicrophoneAccessible: true,
  isRecorderBackendAvailable: true,
  isAudioCaptureActive: false,
  lastAudioError: null,
  isSttReady: true,
  isSttConnected: true,
  lastSttPreview: "",
  lastSttFinal: "",
  lastSttError: null,
  usedGroqPostProcessing: false,
  lastPostProcessingError: null,
  lastRawTranscript: "",
  lastProcessedTranscript: "",
  injectionStatus: "idle",
  lastInjectionError: null,
  lastInjectedText: ""
});

describe("selectDashboardTranscript", () => {
  it("returns empty when snapshot is null", () => {
    expect(selectDashboardTranscript(null)).toBe("");
  });

  it("prefers explicit contract lastTranscript when set", () => {
    const status = baseSnapshot();
    status.lastProcessedTranscript = "processed";
    status.lastTranscript = "ipc";
    expect(selectDashboardTranscript(status)).toBe("ipc");
  });

  it("falls back through processed → final → preview", () => {
    let status = baseSnapshot();
    status.lastSttPreview = "preview";
    expect(selectDashboardTranscript(status)).toBe("preview");

    status = baseSnapshot();
    status.lastSttFinal = "final";
    status.lastSttPreview = "preview";
    expect(selectDashboardTranscript(status)).toBe("final");

    status = baseSnapshot();
    status.lastProcessedTranscript = "proc";
    status.lastSttFinal = "final";
    expect(selectDashboardTranscript(status)).toBe("proc");
  });

  it("treats empty lastTranscript as absent", () => {
    const status = baseSnapshot();
    status.lastTranscript = "";
    status.lastProcessedTranscript = "x";
    expect(selectDashboardTranscript(status)).toBe("x");
  });
});
