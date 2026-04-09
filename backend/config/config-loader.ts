import { existsSync } from "node:fs";
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import dotenv from "dotenv";
import type { AppConfig, AppConfigFile, AppConfigUpdate } from "./app-config";
import { defaultAppConfig, defaultAppConfigFile } from "./default-config";
import { validateAppConfig, validateAppConfigFile, validateAppConfigUpdate } from "./config-validator";
import type { AppConfigContract } from "../../shared/contracts/config-contracts";

const resolveConfigDirectory = (): string => {
  const rootCandidates = [
    process.cwd(),
    join(process.cwd(), ".."),
    join(__dirname, "..", ".."),
    join(__dirname, "..", "..", ".."),
    join(__dirname, "..", "..", "..", "..")
  ];

  const configPath = rootCandidates
    .map((rootPath) => join(rootPath, "config"))
    .find((pathValue) =>
      existsSync(join(pathValue, "app.config.json"))
    );

  return configPath ?? join(process.cwd(), "..", "config");
};

const resolveEnvPath = (): string | null => {
  const backendEnvPath = join(process.cwd(), ".env");
  if (existsSync(backendEnvPath)) {
    return backendEnvPath;
  }
  return null;
};

const loadEnv = (): void => {
  process.env.DOTENV_CONFIG_QUIET = "true";
  const envPath = resolveEnvPath();
  if (envPath) {
    dotenv.config({ path: envPath });
  }
};

const readJsonFile = async <T>(filePath: string): Promise<Partial<T>> => {
  if (!existsSync(filePath)) {
    return {};
  }
  const rawValue = await readFile(filePath, "utf-8");
  if (rawValue.trim().length === 0) {
    return {};
  }
  return JSON.parse(rawValue) as Partial<T>;
};

const getConfigPaths = (): { configDirectory: string; appConfigPath: string } => {
  const configDirectory = resolveConfigDirectory();
  const appConfigPath = join(configDirectory, "app.config.json");
  return { configDirectory, appConfigPath };
};

const buildRuntimeConfig = (fileConfig: AppConfigFile): AppConfig => {
  loadEnv();
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY ?? "";
  const groqApiKey = process.env.GROQ_API_KEY ?? "";

  return validateAppConfig({
    ...defaultAppConfig,
    ...fileConfig,
    deepgram: {
      apiKey: deepgramApiKey,
      model: fileConfig.deepgram.model,
      language: fileConfig.deepgram.language
    },
    groq: {
      apiKey: groqApiKey,
      model: fileConfig.groq.model
    }
  });
};

const toPublicConfigContract = (config: AppConfig): AppConfigContract => {
  return {
    appName: config.appName,
    environment: config.environment,
    window: config.window,
    deepgram: {
      model: config.deepgram.model,
      language: config.deepgram.language,
      apiKeySet: config.deepgram.apiKey.trim().length > 0
    },
    groq: {
      model: config.groq.model,
      apiKeySet: config.groq.apiKey.trim().length > 0
    },
    hotkey: config.hotkey,
    enableGroqPostProcessing: config.enableGroqPostProcessing,
    postProcessingMode: config.postProcessingMode,
    translationTargetLanguage: config.translationTargetLanguage,
    autoPasteEnabled: config.autoPasteEnabled
  };
};

const loadAppConfig = async (): Promise<AppConfig> => {
  const { appConfigPath } = getConfigPaths();
  const appConfigFile = await readJsonFile<AppConfigFile>(appConfigPath);
  const validatedFileConfig = validateAppConfigFile({
    ...defaultAppConfigFile,
    ...appConfigFile,
    deepgram: {
      ...defaultAppConfigFile.deepgram,
      ...(appConfigFile.deepgram ?? {})
    },
    groq: {
      ...defaultAppConfigFile.groq,
      ...(appConfigFile.groq ?? {})
    }
  });
  return buildRuntimeConfig(validatedFileConfig);
};

const persistAppConfigFile = async (fileConfig: AppConfigFile): Promise<void> => {
  const { appConfigPath } = getConfigPaths();
  const tmpPath = `${appConfigPath}.tmp`;
  const rawValue = `${JSON.stringify(fileConfig, null, 2)}\n`;
  await writeFile(tmpPath, rawValue, "utf-8");
  await rename(tmpPath, appConfigPath);
};

const applyConfigUpdate = (
  currentFileConfig: AppConfigFile,
  update: AppConfigUpdate
): AppConfigFile => {
  const nextValue: AppConfigFile = validateAppConfigFile({
    ...currentFileConfig,
    ...update,
    window: {
      ...currentFileConfig.window,
      ...(update.window ?? {})
    },
    deepgram: {
      ...currentFileConfig.deepgram,
      ...(update.deepgram ?? {})
    },
    groq: {
      ...currentFileConfig.groq,
      ...(update.groq ?? {})
    }
  });
  return nextValue;
};

const updateAppConfig = async (
  currentConfig: AppConfig,
  payload: unknown
): Promise<{ runtimeConfig: AppConfig; publicConfig: AppConfigContract } | null> => {
  const update = validateAppConfigUpdate(payload);
  if (update === null) {
    return null;
  }
  const { appConfigPath } = getConfigPaths();
  const existingFile = await readJsonFile<AppConfigFile>(appConfigPath);
  const currentFileConfig = validateAppConfigFile({
    ...defaultAppConfigFile,
    ...existingFile,
    deepgram: {
      ...defaultAppConfigFile.deepgram,
      ...(existingFile.deepgram ?? {})
    },
    groq: {
      ...defaultAppConfigFile.groq,
      ...(existingFile.groq ?? {})
    }
  });

  const nextFileConfig = applyConfigUpdate(currentFileConfig, update);
  await persistAppConfigFile(nextFileConfig);

  const nextRuntimeConfig = buildRuntimeConfig(nextFileConfig);
  const publicConfig = toPublicConfigContract(nextRuntimeConfig);
  return { runtimeConfig: nextRuntimeConfig, publicConfig };
};

export { loadAppConfig, toPublicConfigContract, updateAppConfig };
