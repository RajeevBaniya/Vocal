import { spawnSync } from "node:child_process";

type MicrophoneCapabilityStatus = "unknown" | "assumed_available" | "assumed_unavailable";
type RecorderBackend = "sox" | "none";

type MicrophoneCapability = {
  microphoneStatus: MicrophoneCapabilityStatus;
  isMicrophoneAccessible: boolean;
  recorderBackend: RecorderBackend;
  isRecorderBackendAvailable: boolean;
  reason: string | null;
};

const commandExists = (command: string): boolean => {
  const checker = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(checker, [command], {
    stdio: "ignore"
  });
  return result.status === 0;
};

const checkMicrophoneCapability = (): MicrophoneCapability => {
  const hasSox = commandExists("sox") || commandExists("rec");
  if (hasSox) {
    return {
      microphoneStatus: "unknown",
      isMicrophoneAccessible: true,
      recorderBackend: "sox",
      isRecorderBackendAvailable: true,
      reason: null
    };
  }
  return {
    microphoneStatus: "unknown",
    isMicrophoneAccessible: true,
    recorderBackend: "none",
    isRecorderBackendAvailable: false,
    reason: "Recorder backend unavailable: expected sox/rec on PATH"
  };
};

export type { MicrophoneCapability, MicrophoneCapabilityStatus, RecorderBackend };
export { checkMicrophoneCapability };
