import type { AppConfig } from "../config/app-config";
import type { AudioStreamManager } from "../audio/audio-stream-manager";
import { connectDgSocket, type DgSocket } from "./dg-client";
import { toTranscriptChunk, toTranscriptEvent } from "./dg-events";
import { logger } from "../utils/logger";
import { nowMs } from "../utils/time";
import type { TranscriptChunkContract } from "../../shared/contracts/transcript-contracts";

type DgStreamStatus = {
  isReady: boolean;
  isConnected: boolean;
  lastError: string | null;
};

type DgStreamCallbacks = {
  onStatus: (status: DgStreamStatus) => void;
  onTranscript: (chunk: TranscriptChunkContract) => void;
};

type DgStreamService = {
  initialize: () => Promise<void>;
  start: () => Promise<void>;
  finish: () => Promise<void>;
  cleanup: () => Promise<void>;
  getStatus: () => DgStreamStatus;
};

const FINALIZE_FLUSH_DELAY_MS = 300;
const KEEPALIVE_ENABLED = false;

const createDgStreamService = (
  config: AppConfig,
  audioStreamManager: AudioStreamManager,
  callbacks: DgStreamCallbacks
): DgStreamService => {
  let socket: DgSocket | null = null;
  let unsubscribeAudio: (() => void) | null = null;
  let keepaliveTimer: NodeJS.Timeout | null = null;
  let hasFinalized = false;
  let status: DgStreamStatus = {
    isReady: false,
    isConnected: false,
    lastError: null
  };

  const updateStatus = (nextStatus: DgStreamStatus): void => {
    status = nextStatus;
    callbacks.onStatus(nextStatus);
  };

  const initialize = async (): Promise<void> => {
    const hasApiKey = config.deepgram.apiKey.trim().length > 0;
    if (!hasApiKey) {
      updateStatus({
        isReady: false,
        isConnected: false,
        lastError: "DEEPGRAM_API_KEY is missing"
      });
      logger.warn("stt_init_missing_key");
      return;
    }
    updateStatus({
      isReady: true,
      isConnected: false,
      lastError: null
    });
    logger.info("stt_init_ready", {
      deepgramModel: config.deepgram.model,
      deepgramLanguage: config.deepgram.language
    });
    logger.info("stt_audio_format_assumption", {
      encoding: "linear16",
      sampleRateHz: 16000,
      channels: 1
    });
    if (!KEEPALIVE_ENABLED) {
      logger.info("stt_keepalive_disabled", {
        reason: "No idle-gap keepalive policy enabled in Phase 5"
      });
    }
  };

  const stopKeepalive = (): void => {
    if (keepaliveTimer !== null) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
  };

  const startKeepalive = (): void => {
    if (!KEEPALIVE_ENABLED || socket === null) {
      return;
    }
    stopKeepalive();
    keepaliveTimer = setInterval(() => {
      if (socket === null || !status.isConnected) {
        return;
      }
      socket.sendKeepAlive({ type: "KeepAlive" });
    }, 8000);
  };

  const finalizeAndClose = async (): Promise<void> => {
    if (socket === null || !status.isConnected || hasFinalized) {
      return;
    }
    hasFinalized = true;
    try {
      socket.sendFinalize({ type: "Finalize" });
      logger.info("stt_finalize_sent");
      await new Promise<void>((resolvePromise) => {
        setTimeout(() => resolvePromise(), FINALIZE_FLUSH_DELAY_MS);
      });
      socket.sendCloseStream({ type: "CloseStream" });
      logger.info("stt_close_stream_sent");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to finalize STT stream";
      logger.error("stt_finalize_failed", {
        error: message
      });
    }
  };

  const detachAudioSubscription = (): void => {
    if (unsubscribeAudio !== null) {
      unsubscribeAudio();
      unsubscribeAudio = null;
    }
  };

  const closeSocket = (): void => {
    if (socket !== null) {
      socket.close();
      socket = null;
    }
    stopKeepalive();
    hasFinalized = false;
  };

  const setDisconnectedStatus = (error: string | null): void => {
    updateStatus({
      isReady: status.isReady,
      isConnected: false,
      lastError: error
    });
  };

  const start = async (): Promise<void> => {
    if (!status.isReady) {
      return;
    }
    if (status.isConnected) {
      return;
    }
    logger.info("stt_connect_start");
    const connectionResult = await connectDgSocket(config);
    if (connectionResult.socket === null) {
      updateStatus({
        isReady: false,
        isConnected: false,
        lastError: connectionResult.error
      });
      logger.error("stt_connect_failed", {
        error: connectionResult.error
      });
      return;
    }

    socket = connectionResult.socket;
    hasFinalized = false;
    socket.on("open", () => {
      updateStatus({
        isReady: true,
        isConnected: true,
        lastError: null
      });
      logger.info("stt_connect_success");
      startKeepalive();
    });
    socket.on("close", () => {
      detachAudioSubscription();
      setDisconnectedStatus(null);
      logger.info("stt_closed");
    });
    socket.on("error", (error) => {
      const message =
        error instanceof Error ? error.message : "Unknown STT socket error";
      detachAudioSubscription();
      setDisconnectedStatus(message);
      logger.error("stt_socket_error", {
        error: message
      });
    });
    socket.on("message", (payload) => {
      const event = toTranscriptEvent(payload);
      if (event === null) {
        return;
      }
      const chunk = toTranscriptChunk(event, nowMs());
      callbacks.onTranscript(chunk);
      logger.info("stt_transcript_received", {
        kind: event.kind
      });
    });
    unsubscribeAudio = audioStreamManager.subscribe((chunk) => {
      if (socket === null || !status.isConnected) {
        return;
      }
      socket.sendMedia(chunk);
    });
    socket.connect();
  };

  const finish = async (): Promise<void> => {
    await finalizeAndClose();
  };

  const cleanup = async (): Promise<void> => {
    await finalizeAndClose();
    detachAudioSubscription();
    closeSocket();
    setDisconnectedStatus(status.lastError);
    logger.info("stt_cleanup_done");
  };

  const getStatus = (): DgStreamStatus => status;

  return {
    initialize,
    start,
    finish,
    cleanup,
    getStatus
  };
};

export type { DgStreamCallbacks, DgStreamService, DgStreamStatus };
export { createDgStreamService };
