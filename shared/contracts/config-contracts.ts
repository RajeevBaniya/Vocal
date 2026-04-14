type UserSettingsContract = {
  launchOnStartup: boolean;
};

type PostProcessingModeContract =
  | "none"
  | "spelling"
  | "grammar"
  | "normalize"
  | "translate";

type AppConfigContract = {
  appName: string;
  environment: "development" | "production";
  window: {
    width: number;
    height: number;
  };
  deepgram: {
    model: string;
    language: string;
    apiKeySet: boolean;
  };
  groq: {
    model: string;
    apiKeySet: boolean;
  };
  hotkey: string;
  enableGroqPostProcessing: boolean;
  postProcessingMode: PostProcessingModeContract;
  translationTargetLanguage: string;
  autoPasteEnabled: boolean;
};

type ConfigUpdateContract = {
  deepgramModel?: string;
  deepgramLanguage?: string;
  groqModel?: string;
  hotkey?: string;
  enableGroqPostProcessing?: boolean;
  postProcessingMode?: PostProcessingModeContract;
  translationTargetLanguage?: string;
  autoPasteEnabled?: boolean;
  window?: {
    width?: number;
    height?: number;
  };
};

export type {
  AppConfigContract,
  ConfigUpdateContract,
  PostProcessingModeContract,
  UserSettingsContract
};
