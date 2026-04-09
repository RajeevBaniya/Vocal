import type { AppConfig, AppConfigFile } from "./app-config";

const defaultAppConfig: AppConfig = {
  appName: "Vocalflow",
  environment: "development",
  window: {
    width: 1024,
    height: 720
  },
  deepgram: {
    apiKey: "",
    model: "nova-2",
    language: "en"
  },
  groq: {
    apiKey: "",
    model: ""
  },
  hotkey: "Ctrl+Alt+R",
  enableGroqPostProcessing: false,
  postProcessingMode: "none",
  translationTargetLanguage: "en",
  autoPasteEnabled: false
};

const defaultAppConfigFile: AppConfigFile = {
  appName: defaultAppConfig.appName,
  environment: defaultAppConfig.environment,
  window: defaultAppConfig.window,
  deepgram: {
    model: defaultAppConfig.deepgram.model,
    language: defaultAppConfig.deepgram.language
  },
  groq: {
    model: defaultAppConfig.groq.model
  },
  hotkey: defaultAppConfig.hotkey,
  enableGroqPostProcessing: defaultAppConfig.enableGroqPostProcessing,
  postProcessingMode: defaultAppConfig.postProcessingMode,
  translationTargetLanguage: defaultAppConfig.translationTargetLanguage,
  autoPasteEnabled: defaultAppConfig.autoPasteEnabled
};

export { defaultAppConfig, defaultAppConfigFile };
