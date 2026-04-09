import type { AppConfig, AppConfigFile, AppConfigUpdate, PostProcessingMode } from "./app-config";
import { defaultAppConfig } from "./default-config";

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const normalizeHotkey = (value: unknown, fallback: string): string => {
  if (!isNonEmptyString(value)) {
    return fallback;
  }
  return value.trim();
};

const normalizePostProcessingMode = (
  value: unknown,
  fallback: PostProcessingMode
): PostProcessingMode => {
  if (
    value === "none" ||
    value === "spelling" ||
    value === "grammar" ||
    value === "normalize" ||
    value === "translate"
  ) {
    return value;
  }
  return fallback;
};

const validateAppConfig = (input: Partial<AppConfig>): AppConfig => {
  const appName = input.appName ?? defaultAppConfig.appName;
  const environment =
    input.environment === "production" ? "production" : "development";
  const width = input.window?.width ?? defaultAppConfig.window.width;
  const height = input.window?.height ?? defaultAppConfig.window.height;
  const deepgramApiKey =
    input.deepgram?.apiKey ?? defaultAppConfig.deepgram.apiKey;
  const groqApiKey = input.groq?.apiKey ?? defaultAppConfig.groq.apiKey;

  return {
    appName,
    environment,
    window: {
      width: typeof width === "number" && width > 0 ? width : defaultAppConfig.window.width,
      height: typeof height === "number" && height > 0 ? height : defaultAppConfig.window.height
    },
    deepgram: {
      apiKey: deepgramApiKey,
      model: input.deepgram?.model ?? defaultAppConfig.deepgram.model,
      language: input.deepgram?.language ?? defaultAppConfig.deepgram.language
    },
    groq: {
      apiKey: groqApiKey,
      model: input.groq?.model ?? defaultAppConfig.groq.model
    },
    hotkey: normalizeHotkey(input.hotkey, defaultAppConfig.hotkey),
    enableGroqPostProcessing:
      input.enableGroqPostProcessing ?? defaultAppConfig.enableGroqPostProcessing,
    postProcessingMode: normalizePostProcessingMode(
      input.postProcessingMode,
      defaultAppConfig.postProcessingMode
    ),
    translationTargetLanguage:
      input.translationTargetLanguage ?? defaultAppConfig.translationTargetLanguage,
    autoPasteEnabled: input.autoPasteEnabled ?? defaultAppConfig.autoPasteEnabled
  };
};

const validateAppConfigFile = (input: Partial<AppConfigFile>): AppConfigFile => {
  const appName = input.appName ?? defaultAppConfig.appName;
  const environment =
    input.environment === "production" ? "production" : "development";
  const width = input.window?.width ?? defaultAppConfig.window.width;
  const height = input.window?.height ?? defaultAppConfig.window.height;

  return {
    appName,
    environment,
    window: {
      width: typeof width === "number" && width > 0 ? width : defaultAppConfig.window.width,
      height: typeof height === "number" && height > 0 ? height : defaultAppConfig.window.height
    },
    deepgram: {
      model: input.deepgram?.model ?? defaultAppConfig.deepgram.model,
      language: input.deepgram?.language ?? defaultAppConfig.deepgram.language
    },
    groq: {
      model: input.groq?.model ?? defaultAppConfig.groq.model
    },
    hotkey: normalizeHotkey(input.hotkey, defaultAppConfig.hotkey),
    enableGroqPostProcessing:
      input.enableGroqPostProcessing ?? defaultAppConfig.enableGroqPostProcessing,
    postProcessingMode: normalizePostProcessingMode(
      input.postProcessingMode,
      defaultAppConfig.postProcessingMode
    ),
    translationTargetLanguage:
      input.translationTargetLanguage ?? defaultAppConfig.translationTargetLanguage,
    autoPasteEnabled: input.autoPasteEnabled ?? defaultAppConfig.autoPasteEnabled
  };
};

const validateAppConfigUpdate = (input: unknown): AppConfigUpdate | null => {
  if (typeof input !== "object" || input === null) {
    return null;
  }
  return input as AppConfigUpdate;
};

export {
  validateAppConfig,
  validateAppConfigFile,
  validateAppConfigUpdate
};
