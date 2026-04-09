import type { AudioCaptureService } from "../audio/audio-capture-service";
import type { AppState } from "../state/app-state";
import type { SessionState } from "../state/session-state";
import type { DgStreamService } from "../stt/dg-stream";
import type { TranscriptChunkContract } from "../../shared/contracts/transcript-contracts";
import { createPostProcessingService, type PostProcessingService } from "../postproc/post-processing-service";
import { createTextInjectorService, type TextInjectorService } from "../inject/text-injector";
import { logger } from "../utils/logger";

type TranscriptionOrchestrator = {
  onHotkeyActivation: () => Promise<void>;
  onTranscriptChunk: (chunk: TranscriptChunkContract) => void;
  forceStop: () => Promise<void>;
};

type OrchestratorDependencies = {
  appState: AppState;
  sessionState: SessionState;
  audioCaptureService: AudioCaptureService;
  dgStreamService: DgStreamService;
  postProcessingService?: PostProcessingService;
  textInjectorService?: TextInjectorService;
};

const createTranscriptionOrchestrator = (
  dependencies: OrchestratorDependencies
): TranscriptionOrchestrator => {
  const postProcessingService =
    dependencies.postProcessingService ?? createPostProcessingService();
  const textInjectorService =
    dependencies.textInjectorService ?? createTextInjectorService();
  let processingLock = false;
  let finalSegments: string[] = [];

  const syncSessionPhase = (): void => {
    dependencies.appState.setSessionPhase(dependencies.sessionState.getPhase());
  };

  const updateAudioSnapshot = (): void => {
    const audioStatus = dependencies.audioCaptureService.getStatus();
    dependencies.appState.setAudioRuntimeStatus(
      audioStatus.isReady,
      audioStatus.microphoneCapability.microphoneStatus !== "unknown",
      audioStatus.microphoneCapability.isMicrophoneAccessible,
      audioStatus.recorderBackendAvailable,
      audioStatus.isCapturing,
      audioStatus.lastError
    );
  };

  const resetSessionBuffers = (): void => {
    finalSegments = [];
    dependencies.appState.clearTranscriptResults();
  };

  const transitionTo = (
    phase:
      | "recording"
      | "transcribing"
      | "processing"
      | "injecting"
      | "completed"
      | "failed"
      | "idle"
  ): void => {
    if (!dependencies.sessionState.transitionTo(phase)) {
      logger.warn("orchestrator_transition_rejected", {
        from: dependencies.sessionState.getPhase(),
        to: phase
      });
      return;
    }
    syncSessionPhase();
  };

  const startFlow = async (): Promise<void> => {
    if (dependencies.sessionState.getPhase() !== "idle") {
      return;
    }
    resetSessionBuffers();
    dependencies.appState.setAvailability("busy");
    transitionTo("recording");
    const sttStatus = dependencies.dgStreamService.getStatus();
    if (!sttStatus.isReady) {
      logger.warn("orchestrator_start_blocked_stt_not_ready", {
        reason: sttStatus.lastError
      });
      transitionTo("failed");
      transitionTo("idle");
      dependencies.appState.setAvailability("idle");
      return;
    }

    await dependencies.dgStreamService.start();
    const connectedStatus = dependencies.dgStreamService.getStatus();
    if (!connectedStatus.isConnected) {
      logger.warn("orchestrator_start_blocked_stt_not_connected", {
        reason: connectedStatus.lastError
      });
      transitionTo("failed");
      transitionTo("idle");
      dependencies.appState.setAvailability("idle");
      return;
    }
    transitionTo("transcribing");

    const captureStarted = await dependencies.audioCaptureService.startCapture();
    updateAudioSnapshot();
    if (!captureStarted) {
      await dependencies.dgStreamService.finish();
      transitionTo("failed");
      transitionTo("idle");
      dependencies.appState.setAvailability("idle");
      return;
    }
    logger.info("orchestrator_recording_started");
  };

  const stopFlow = async (): Promise<void> => {
    const phase = dependencies.sessionState.getPhase();
    if (phase !== "recording" && phase !== "transcribing") {
      return;
    }
    await dependencies.audioCaptureService.stopCapture();
    updateAudioSnapshot();
    await dependencies.dgStreamService.finish();
    if (dependencies.sessionState.getPhase() === "recording") {
      transitionTo("transcribing");
    }
    transitionTo("processing");

    const rawTranscript = finalSegments.join(" ").trim();
    dependencies.appState.setTranscriptResults(rawTranscript, rawTranscript);
    const processResult = await postProcessingService.processTranscript(
      dependencies.appState.getConfig(),
      rawTranscript
    );
    dependencies.appState.setTranscriptResults(rawTranscript, processResult.text);
    dependencies.appState.setPostProcessingStatus(
      processResult.usedGroq,
      processResult.error
    );
    transitionTo("injecting");
    dependencies.appState.setInjectionStatus("injecting", null, "");
    const injectionResult = await textInjectorService.injectText(processResult.text);
    dependencies.appState.setInjectionStatus(
      injectionResult.success ? "succeeded" : "failed",
      injectionResult.error,
      injectionResult.injectedText
    );
    if (!injectionResult.success) {
      transitionTo("failed");
      transitionTo("idle");
      dependencies.appState.setAvailability("idle");
      return;
    }
    transitionTo("completed");
    transitionTo("idle");
    dependencies.appState.setAvailability("idle");
    logger.info("orchestrator_recording_stopped", {
      usedGroq: processResult.usedGroq,
      mode: processResult.mode,
      injectionStatus: injectionResult.success ? "succeeded" : "failed"
    });
  };

  const onHotkeyActivation = async (): Promise<void> => {
    if (processingLock) {
      return;
    }
    processingLock = true;
    try {
      const phase = dependencies.sessionState.getPhase();
      if (phase === "idle") {
        await startFlow();
      } else if (phase === "recording" || phase === "transcribing") {
        await stopFlow();
      } else {
        logger.warn("orchestrator_hotkey_ignored", {
          sessionPhase: phase
        });
      }
    } finally {
      processingLock = false;
    }
  };

  const onTranscriptChunk = (chunk: TranscriptChunkContract): void => {
    if (chunk.isFinal) {
      const normalized = chunk.text.trim();
      if (normalized.length > 0) {
        finalSegments = [...finalSegments, normalized];
      }
    }
  };

  const forceStop = async (): Promise<void> => {
    await dependencies.audioCaptureService.stopCapture();
    await dependencies.dgStreamService.cleanup();
    updateAudioSnapshot();
    dependencies.appState.setAvailability("idle");
    dependencies.sessionState.reset();
    syncSessionPhase();
  };

  return {
    onHotkeyActivation,
    onTranscriptChunk,
    forceStop
  };
};

export type { OrchestratorDependencies, TranscriptionOrchestrator };
export { createTranscriptionOrchestrator };
