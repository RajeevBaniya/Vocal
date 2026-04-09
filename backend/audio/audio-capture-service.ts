import { Readable } from "node:stream";
import record = require("node-record-lpcm16");
import type { AudioStreamManager } from "./audio-stream-manager";
import {
  checkMicrophoneCapability,
  type MicrophoneCapability
} from "./microphone-permission";
import { logger } from "../utils/logger";

type AudioCaptureStatus = {
  isReady: boolean;
  isCapturing: boolean;
  microphoneCapability: MicrophoneCapability;
  recorderBackendAvailable: boolean;
  lastError: string | null;
};

type AudioCaptureService = {
  initialize: () => Promise<AudioCaptureStatus>;
  startCapture: () => Promise<boolean>;
  stopCapture: () => Promise<void>;
  cleanup: () => Promise<void>;
  getStatus: () => AudioCaptureStatus;
};

const createAudioCaptureService = (
  streamManager: AudioStreamManager
): AudioCaptureService => {
  let activeStream: Readable | null = null;
  let status: AudioCaptureStatus = {
    isReady: false,
    isCapturing: false,
    microphoneCapability: {
      microphoneStatus: "unknown",
      isMicrophoneAccessible: false,
      recorderBackend: "none",
      isRecorderBackendAvailable: false,
      reason: "Audio service not initialized yet"
    },
    recorderBackendAvailable: false,
    lastError: null
  };

  const initialize = async (): Promise<AudioCaptureStatus> => {
    const capability = checkMicrophoneCapability();
    status = {
      ...status,
      isReady: capability.isRecorderBackendAvailable,
      microphoneCapability: capability,
      recorderBackendAvailable: capability.isRecorderBackendAvailable,
      lastError: capability.isRecorderBackendAvailable ? null : capability.reason
    };
    logger.info("audio_service_initialized", {
      microphoneStatus: capability.microphoneStatus,
      recorderBackend: capability.recorderBackend,
      recorderBackendAvailable: capability.isRecorderBackendAvailable,
      reason: capability.reason
    });
    return status;
  };

  const startCapture = async (): Promise<boolean> => {
    if (!status.recorderBackendAvailable) {
      logger.warn("audio_capture_start_blocked", {
        reason: status.microphoneCapability.reason,
        recorderBackend: status.microphoneCapability.recorderBackend
      });
      status = {
        ...status,
        isCapturing: false,
        lastError: status.microphoneCapability.reason
      };
      return false;
    }
    if (status.isCapturing) {
      return true;
    }
    try {
      activeStream = record.start({
        sampleRateHertz: 16000,
        channels: 1,
        threshold: 0,
        endOnSilence: false,
        verbose: false,
        recorder: "sox",
        audioType: "raw"
      });
      activeStream.on("data", (chunk: Buffer) => {
        streamManager.pushChunk(chunk);
      });
      activeStream.on("error", (error) => {
        const message = error instanceof Error ? error.message : "Unknown audio stream error";
        logger.error("audio_capture_stream_error", {
          error: message
        });
        status = {
          ...status,
          isCapturing: false,
          lastError: message
        };
      });
      status = {
        ...status,
        isCapturing: true,
        lastError: null
      };
      logger.info("audio_capture_started");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audio capture start failed";
      logger.error("audio_capture_start_failed", {
        error: message
      });
      status = {
        ...status,
        isCapturing: false,
        lastError: message
      };
      return false;
    }
  };

  const stopCapture = async (): Promise<void> => {
    if (!status.isCapturing) {
      return;
    }
    try {
      record.stop();
      if (activeStream !== null) {
        activeStream.removeAllListeners();
      }
      activeStream = null;
      status = {
        ...status,
        isCapturing: false
      };
      streamManager.reset();
      logger.info("audio_capture_stopped");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audio capture stop failed";
      logger.error("audio_capture_stop_failed", {
        error: message
      });
      status = {
        ...status,
        isCapturing: false,
        lastError: message
      };
    }
  };

  const cleanup = async (): Promise<void> => {
    await stopCapture();
    streamManager.reset();
    logger.info("audio_service_cleaned_up");
  };

  const getStatus = (): AudioCaptureStatus => status;

  return {
    initialize,
    startCapture,
    stopCapture,
    cleanup,
    getStatus
  };
};

export type { AudioCaptureService, AudioCaptureStatus };
export { createAudioCaptureService };
