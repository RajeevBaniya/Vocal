type Nullable<T> = T | null;

type AvailabilityStatus = "idle" | "busy" | "offline";
type SessionPhase =
  | "idle"
  | "recording"
  | "transcribing"
  | "processing"
  | "injecting"
  | "completed"
  | "failed";

interface AppStatusSnapshot {
  isReady: boolean;
  isSettingsWindowVisible: boolean;
  isTrayInitialized: boolean;
  availability: AvailabilityStatus;
  sessionPhase: SessionPhase;
  configuredHotkey: string;
  isHotkeyRegistered: boolean;
  hotkeyRegistrationError: Nullable<string>;
  hotkeyActivationCount: number;
  lastHotkeyActivationAt: Nullable<string>;
  isAudioReady: boolean;
  microphoneCapabilityKnown: boolean;
  isMicrophoneAccessible: boolean;
  isRecorderBackendAvailable: boolean;
  isAudioCaptureActive: boolean;
  lastAudioError: Nullable<string>;
  isSttReady: boolean;
  isSttConnected: boolean;
  lastSttPreview: string;
  lastSttFinal: string;
  lastSttError: Nullable<string>;
  usedGroqPostProcessing: boolean;
  lastPostProcessingError: Nullable<string>;
  lastRawTranscript: string;
  lastProcessedTranscript: string;
  injectionStatus: "idle" | "injecting" | "succeeded" | "failed";
  lastInjectionError: Nullable<string>;
  lastInjectedText: string;
  sessionState?: { phase: string };
  hotkeyStatus?: { registered: boolean };
  readiness?: { audio: boolean; stt: boolean };
  lastTranscript?: string;
}

export type { AppStatusSnapshot, AvailabilityStatus, Nullable, SessionPhase };
