import type { PostProcessingModeContract } from "../../shared/contracts/config-contracts";

type WindowConfig = {
  width: number;
  height: number;
};

type DeepgramConfig = {
  apiKey: string;
  model: string;
  language: string;
};

type GroqConfig = {
  apiKey: string;
  model: string;
};

type PostProcessingMode = PostProcessingModeContract;

type AppConfig = {
  appName: string;
  environment: "development" | "production";
  window: WindowConfig;
  deepgram: DeepgramConfig;
  groq: GroqConfig;
  hotkey: string;
  enableGroqPostProcessing: boolean;
  postProcessingMode: PostProcessingMode;
  translationTargetLanguage: string;
  autoPasteEnabled: boolean;
};

type AppConfigFile = Omit<AppConfig, "deepgram" | "groq"> & {
  deepgram: Omit<DeepgramConfig, "apiKey">;
  groq: Omit<GroqConfig, "apiKey">;
};

type AppConfigUpdate = Partial<Omit<AppConfigFile, "appName" | "environment" | "deepgram" | "groq" | "window">> & {
  deepgram?: Partial<AppConfigFile["deepgram"]>;
  groq?: Partial<AppConfigFile["groq"]>;
  window?: Partial<AppConfigFile["window"]>;
};

export type {
  AppConfig,
  AppConfigFile,
  AppConfigUpdate,
  DeepgramConfig,
  GroqConfig,
  PostProcessingMode,
  WindowConfig
};
