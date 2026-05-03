import { app } from "electron";
import { join } from "node:path";
import type { AppConfig } from "../config/app-config";
import type {
  AppStatusSnapshot,
  AvailabilityStatus,
  Nullable,
  SessionPhase
} from "../../shared/types/shared-types";
import type { TranscriptChunkContract } from "../../shared/contracts/transcript-contracts";
import {
  createUserSettingsRepository,
  type UserSettings
} from "./user-settings-repository";

type AppState = {
  getConfig: () => AppConfig;
  setConfig: (nextConfig: AppConfig) => void;
  getSettings: () => UserSettings;
  setSettings: (nextSettings: UserSettings) => void;
  getStatus: () => AppStatusSnapshot;
  setReady: (value: boolean) => void;
  setSettingsWindowVisible: (value: boolean) => void;
  setTrayInitialized: (value: boolean) => void;
  setAvailability: (value: AvailabilityStatus) => void;
  setSessionPhase: (value: SessionPhase) => void;
  setConfiguredHotkey: (value: string) => void;
  setHotkeyRegistration: (isRegistered: boolean, error: Nullable<string>) => void;
  markHotkeyActivation: (timestampIso: string) => void;
  setAudioRuntimeStatus: (
    isReady: boolean,
    capabilityKnown: boolean,
    isMicrophoneAccessible: boolean,
    isRecorderBackendAvailable: boolean,
    isCaptureActive: boolean,
    error: Nullable<string>
  ) => void;
  setSttRuntimeStatus: (
    isReady: boolean,
    isConnected: boolean,
    error: Nullable<string>
  ) => void;
  updateSttTranscript: (chunk: TranscriptChunkContract) => void;
  setPostProcessingStatus: (usedGroq: boolean, error: Nullable<string>) => void;
  setTranscriptResults: (rawText: string, processedText: string) => void;
  clearTranscriptResults: () => void;
  setInjectionStatus: (
    status: "idle" | "injecting" | "succeeded" | "failed",
    error: Nullable<string>,
    text: string
  ) => void;
};

const createAppState = (config: AppConfig): AppState => {
  const stateDirectory = app.getPath("userData");
  const stateFilePath = join(stateDirectory, "settings.json");
  const userSettingsRepository = createUserSettingsRepository(stateFilePath);

  let currentSettings = userSettingsRepository.load();

  let currentConfig = config;
  const getConfig = (): AppConfig => currentConfig;
  const setConfig = (nextConfig: AppConfig): void => {
    currentConfig = nextConfig;
  };
  const getSettings = (): UserSettings => currentSettings;
  const setSettings = (nextSettings: UserSettings): void => {
    currentSettings = nextSettings;
    userSettingsRepository.save(currentSettings);
  };
  let status: AppStatusSnapshot = {
    isReady: false,
    isSettingsWindowVisible: false,
    isTrayInitialized: false,
    availability: "idle",
    sessionPhase: "idle",
    configuredHotkey: config.hotkey,
    isHotkeyRegistered: false,
    hotkeyRegistrationError: null,
    hotkeyActivationCount: 0,
    lastHotkeyActivationAt: null,
    isAudioReady: false,
    microphoneCapabilityKnown: false,
    isMicrophoneAccessible: false,
    isRecorderBackendAvailable: false,
    isAudioCaptureActive: false,
    lastAudioError: null,
    isSttReady: false,
    isSttConnected: false,
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
  };
  const getStatus = (): AppStatusSnapshot => status;
  const setReady = (value: boolean): void => {
    status = {
      ...status,
      isReady: value
    };
  };
  const setSettingsWindowVisible = (value: boolean): void => {
    status = {
      ...status,
      isSettingsWindowVisible: value
    };
  };
  const setTrayInitialized = (value: boolean): void => {
    status = {
      ...status,
      isTrayInitialized: value
    };
  };
  const setAvailability = (value: AvailabilityStatus): void => {
    status = {
      ...status,
      availability: value
    };
  };
  const setSessionPhase = (value: SessionPhase): void => {
    status = {
      ...status,
      sessionPhase: value
    };
  };
  const setConfiguredHotkey = (value: string): void => {
    status = {
      ...status,
      configuredHotkey: value
    };
  };
  const setHotkeyRegistration = (
    isRegistered: boolean,
    error: Nullable<string>
  ): void => {
    status = {
      ...status,
      isHotkeyRegistered: isRegistered,
      hotkeyRegistrationError: error
    };
  };
  const markHotkeyActivation = (timestampIso: string): void => {
    status = {
      ...status,
      hotkeyActivationCount: status.hotkeyActivationCount + 1,
      lastHotkeyActivationAt: timestampIso
    };
  };
  const setAudioRuntimeStatus = (
    isReady: boolean,
    capabilityKnown: boolean,
    isMicrophoneAccessible: boolean,
    isRecorderBackendAvailable: boolean,
    isCaptureActive: boolean,
    error: Nullable<string>
  ): void => {
    status = {
      ...status,
      isAudioReady: isReady,
      microphoneCapabilityKnown: capabilityKnown,
      isMicrophoneAccessible,
      isRecorderBackendAvailable,
      isAudioCaptureActive: isCaptureActive,
      lastAudioError: error
    };
  };
  const setSttRuntimeStatus = (
    isReady: boolean,
    isConnected: boolean,
    error: Nullable<string>
  ): void => {
    status = {
      ...status,
      isSttReady: isReady,
      isSttConnected: isConnected,
      lastSttError: error
    };
  };
  const updateSttTranscript = (chunk: TranscriptChunkContract): void => {
    status = {
      ...status,
      lastSttPreview: chunk.isFinal ? status.lastSttPreview : chunk.text,
      lastSttFinal: chunk.isFinal ? chunk.text : status.lastSttFinal
    };
  };
  const setPostProcessingStatus = (
    usedGroq: boolean,
    error: Nullable<string>
  ): void => {
    status = {
      ...status,
      usedGroqPostProcessing: usedGroq,
      lastPostProcessingError: error
    };
  };
  const setTranscriptResults = (rawText: string, processedText: string): void => {
    status = {
      ...status,
      lastRawTranscript: rawText,
      lastProcessedTranscript: processedText
    };
  };
  const clearTranscriptResults = (): void => {
    status = {
      ...status,
      lastRawTranscript: "",
      lastProcessedTranscript: "",
      usedGroqPostProcessing: false,
      lastPostProcessingError: null,
      injectionStatus: "idle",
      lastInjectionError: null,
      lastInjectedText: ""
    };
  };
  const setInjectionStatus = (
    injectionStatus: "idle" | "injecting" | "succeeded" | "failed",
    error: Nullable<string>,
    text: string
  ): void => {
    status = {
      ...status,
      injectionStatus,
      lastInjectionError: error,
      lastInjectedText: text
    };
  };

  return {
    getConfig,
    setConfig,
    getSettings,
    setSettings,
    getStatus,
    setReady,
    setSettingsWindowVisible,
    setTrayInitialized,
    setAvailability,
    setSessionPhase,
    setConfiguredHotkey,
    setHotkeyRegistration,
    markHotkeyActivation,
    setAudioRuntimeStatus,
    setSttRuntimeStatus,
    updateSttTranscript,
    setPostProcessingStatus,
    setTranscriptResults,
    clearTranscriptResults,
    setInjectionStatus
  };
};

export type { AppState, UserSettings };
export { createAppState };
