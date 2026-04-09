import { app, BrowserWindow } from "electron";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { initializeMainProcess, openSettingsWindow } from "./main";
import { loadAppConfig } from "../config/config-loader";
import { createAppState } from "../state/app-state";
import { createSessionState } from "../state/session-state";
import { registerIpcHandlers } from "../ipc/ipc-handlers";
import { logger } from "../utils/logger";
import { handleProcessError } from "../utils/error-handler";
import { nowIso } from "../utils/time";
import { createHotkeyService } from "../hotkeys/hotkey-service";
import { createAudioStreamManager } from "../audio/audio-stream-manager";
import { createAudioCaptureService } from "../audio/audio-capture-service";
import { createDgStreamService } from "../stt/dg-stream";
import { createTranscriptionOrchestrator } from "../core/transcription-orchestrator";
import type { AppConfig } from "../config/app-config";
import type { AppState } from "../state/app-state";
import type { SessionState } from "../state/session-state";

type AppRuntimeServices = {
  config: AppConfig;
  appState: AppState;
  sessionState: SessionState;
  requestExit: () => void;
  shouldQuit: () => boolean;
};

const createServiceRegistry = (): Record<string, never> => {
  return {};
};

const configureElectronRuntimePaths = (): void => {
  const appDataPath = app.getPath("appData");
  const runtimeRoot = join(appDataPath, "Vocalflow");
  const userDataPath = join(runtimeRoot, "user-data");
  const sessionDataPath = join(runtimeRoot, "session-data");
  const cachePath = join(runtimeRoot, "cache");

  const paths = [runtimeRoot, userDataPath, sessionDataPath, cachePath];
  for (const pathValue of paths) {
    if (!existsSync(pathValue)) {
      mkdirSync(pathValue, { recursive: true });
    }
  }

  app.setPath("userData", userDataPath);
  app.setPath("sessionData", sessionDataPath);
  app.setPath("cache", cachePath);
  app.commandLine.appendSwitch("disk-cache-dir", cachePath);
};

const bootstrapAppLifecycle = async (): Promise<void> => {
  try {
    configureElectronRuntimePaths();
    logger.info("startup_begin");
    const config = await loadAppConfig();
    const appState = createAppState(config);
    const sessionState = createSessionState();
    appState.setAvailability("idle");
    appState.setSessionPhase(sessionState.getPhase());
    const serviceRegistry = createServiceRegistry();
    let isQuitting = false;
    const hotkeyService = createHotkeyService();
    const audioStreamManager = createAudioStreamManager();
    const audioCaptureService = createAudioCaptureService(audioStreamManager);
    const dgStreamService = createDgStreamService(config, audioStreamManager, {
      onStatus: (sttStatus) => {
        appState.setSttRuntimeStatus(
          sttStatus.isReady,
          sttStatus.isConnected,
          sttStatus.lastError
        );
      },
      onTranscript: (chunk) => {
        appState.updateSttTranscript(chunk);
        orchestrator.onTranscriptChunk(chunk);
      }
    });
    const orchestrator = createTranscriptionOrchestrator({
      appState,
      sessionState,
      audioCaptureService,
      dgStreamService
    });
    const handleHotkeyActivation = (): void => {
      appState.markHotkeyActivation(nowIso());
      void orchestrator.onHotkeyActivation();
    };
    const registerConfiguredHotkey = (): void => {
      const currentHotkey = appState.getConfig().hotkey;
      appState.setConfiguredHotkey(currentHotkey);
      const registrationResult = hotkeyService.reRegister(
        currentHotkey,
        handleHotkeyActivation
      );
      appState.setHotkeyRegistration(
        registrationResult.success,
        registrationResult.error
      );
    };
    const shouldQuit = (): boolean => isQuitting;
    const requestExit = (): void => {
      isQuitting = true;
      app.quit();
    };

    app.whenReady().then(() => {
      logger.info("app_when_ready");
      initializeMainProcess({
        config,
        appState,
        sessionState,
        requestExit,
        shouldQuit
      });
      registerIpcHandlers({
        appState,
        onConfigUpdated: () => {
          registerConfiguredHotkey();
        },
        openSettingsWindow: () =>
          openSettingsWindow({
            config,
            appState,
            sessionState,
            requestExit,
            shouldQuit
          })
      });
      void audioCaptureService.initialize().then((audioStatus) => {
        appState.setAudioRuntimeStatus(
          audioStatus.isReady,
          audioStatus.microphoneCapability.microphoneStatus !== "unknown",
          audioStatus.microphoneCapability.isMicrophoneAccessible,
          audioStatus.recorderBackendAvailable,
          audioStatus.isCapturing,
          audioStatus.lastError
        );
      });
      void dgStreamService.initialize();
      registerConfiguredHotkey();
      appState.setReady(true);
      logger.info("app_ready", {
        registrySize: Object.keys(serviceRegistry).length
      });

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0 || !appState.getStatus().isSettingsWindowVisible) {
          openSettingsWindow({
            config,
            appState,
            sessionState,
            requestExit,
            shouldQuit
          });
        }
      });
    });

    app.on("window-all-closed", () => {
      logger.info("all_windows_closed");
    });
    app.on("before-quit", () => {
      logger.info("before_quit");
      isQuitting = true;
    });
    app.on("will-quit", () => {
      logger.info("will_quit");
      hotkeyService.unregister();
      void audioCaptureService.cleanup();
      void orchestrator.forceStop();
      appState.setReady(false);
      appState.setTrayInitialized(false);
      appState.setHotkeyRegistration(false, null);
      appState.setAudioRuntimeStatus(false, false, false, false, false, null);
      appState.setSttRuntimeStatus(false, false, null);
    });
  } catch (error) {
    handleProcessError(error);
  }
};

export type { AppRuntimeServices };
export { bootstrapAppLifecycle };
