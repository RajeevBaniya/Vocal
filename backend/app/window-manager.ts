import { BrowserWindow } from "electron";
import { join, resolve } from "node:path";
import type { AppConfig } from "../config/app-config";
import type { AppState } from "../state/app-state";

let settingsWindow: BrowserWindow | null = null;

const createSettingsWindow = (config: AppConfig, appState: AppState): BrowserWindow => {
  if (settingsWindow !== null && !settingsWindow.isDestroyed()) {
    return settingsWindow;
  }
  const preloadPath = resolve(__dirname, "..", "ipc", "preload.js");
  const windowRef = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath
    }
  });
  windowRef.on("show", () => {
    appState.setSettingsWindowVisible(true);
  });
  windowRef.on("hide", () => {
    appState.setSettingsWindowVisible(false);
  });
  windowRef.on("closed", () => {
    settingsWindow = null;
    appState.setSettingsWindowVisible(false);
  });
  const indexPath = join(__dirname, "..", "..", "..", "..", "frontend", "dist", "index.html");
  void windowRef.loadFile(indexPath);
  settingsWindow = windowRef;
  appState.setSettingsWindowVisible(false);
  return windowRef;
};

const showSettingsWindow = (windowRef: BrowserWindow): void => {
  if (!windowRef.isVisible()) {
    windowRef.show();
  }
  windowRef.focus();
};

const bindSettingsWindowCloseBehavior = (
  windowRef: BrowserWindow,
  shouldQuit: () => boolean
): void => {
  windowRef.on("close", (event) => {
    if (!shouldQuit()) {
      event.preventDefault();
      windowRef.hide();
    }
  });
};

export {
  bindSettingsWindowCloseBehavior,
  createSettingsWindow,
  showSettingsWindow
};
