import { ipcMain } from "electron";
import { IPC_CHANNELS } from "./ipc-channels";
import type { AppState } from "../state/app-state";
import type { IpcRequestMap, IpcResponseMap } from "../../shared/contracts/ipc-contracts";
import { logger } from "../utils/logger";
import { toPublicConfigContract, updateAppConfig } from "../config/config-loader";
import type { ConfigUpdateContract } from "../../shared/contracts/config-contracts";
import type { AppConfigUpdate } from "../config/app-config";

type IpcRuntimeDependencies = {
  appState: AppState;
  openSettingsWindow: () => void;
  onConfigUpdated: () => void;
};

const isConfigUpdateContract = (payload: unknown): payload is ConfigUpdateContract => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }
  return true;
};

const toAppConfigUpdate = (payload: ConfigUpdateContract): AppConfigUpdate => {
  const update: AppConfigUpdate = {};
  if (payload.window !== undefined) {
    update.window = {
      ...payload.window
    };
  }
  if (payload.deepgramModel !== undefined || payload.deepgramLanguage !== undefined) {
    update.deepgram = {};
    if (payload.deepgramModel !== undefined) {
      update.deepgram.model = payload.deepgramModel;
    }
    if (payload.deepgramLanguage !== undefined) {
      update.deepgram.language = payload.deepgramLanguage;
    }
  }
  if (payload.groqModel !== undefined) {
    update.groq = {
      model: payload.groqModel
    };
  }
  if (payload.hotkey !== undefined) {
    update.hotkey = payload.hotkey;
  }
  if (payload.enableGroqPostProcessing !== undefined) {
    update.enableGroqPostProcessing = payload.enableGroqPostProcessing;
  }
  if (payload.postProcessingMode !== undefined) {
    update.postProcessingMode = payload.postProcessingMode;
  }
  if (payload.translationTargetLanguage !== undefined) {
    update.translationTargetLanguage = payload.translationTargetLanguage;
  }
  if (payload.autoPasteEnabled !== undefined) {
    update.autoPasteEnabled = payload.autoPasteEnabled;
  }
  return update;
};

const registerIpcHandlers = (dependencies: IpcRuntimeDependencies): void => {
  ipcMain.removeHandler(IPC_CHANNELS.appGetStatus);
  ipcMain.removeHandler(IPC_CHANNELS.configGet);
  ipcMain.removeHandler(IPC_CHANNELS.configUpdate);
  ipcMain.removeHandler(IPC_CHANNELS.appOpenSettings);

  ipcMain.handle(IPC_CHANNELS.appGetStatus, (): IpcResponseMap["app:get-status"] => {
    return dependencies.appState.getStatus();
  });
  ipcMain.handle(IPC_CHANNELS.configGet, (): IpcResponseMap["config:get"] => {
    return toPublicConfigContract(dependencies.appState.getConfig());
  });
  ipcMain.handle(
    IPC_CHANNELS.configUpdate,
    async (_event, payload: unknown): Promise<IpcResponseMap["config:update"]> => {
      const currentConfig = dependencies.appState.getConfig();
      if (!isConfigUpdateContract(payload)) {
        logger.warn("ipc_invalid_payload", {
          channel: IPC_CHANNELS.configUpdate
        });
        return toPublicConfigContract(currentConfig);
      }
      const result = await updateAppConfig(currentConfig, toAppConfigUpdate(payload));
      if (result === null) {
        logger.warn("ipc_invalid_payload", {
          channel: IPC_CHANNELS.configUpdate
        });
        return toPublicConfigContract(currentConfig);
      }
      dependencies.appState.setConfig(result.runtimeConfig);
      dependencies.onConfigUpdated();
      return result.publicConfig;
    }
  );
  ipcMain.handle(
    IPC_CHANNELS.appOpenSettings,
    (): IpcResponseMap["app:open-settings"] => {
      dependencies.openSettingsWindow();
      return { success: true };
    }
  );
};

export type { IpcRuntimeDependencies };
export { registerIpcHandlers };
