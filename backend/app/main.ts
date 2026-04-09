import type { AppRuntimeServices } from "./app-lifecycle";
import {
  bindSettingsWindowCloseBehavior,
  createSettingsWindow,
  showSettingsWindow
} from "./window-manager";
import { createTray, refreshTrayMenu } from "./tray-manager";

const initializeMainProcess = (services: AppRuntimeServices): void => {
  const settingsWindow = createSettingsWindow(services.config, services.appState);
  bindSettingsWindowCloseBehavior(settingsWindow, services.shouldQuit);
  services.sessionState.setSettingsWindow(settingsWindow);

  const tray = createTray({
    onOpenSettings: () => {
      const windowRef = services.sessionState.getSettingsWindow();
      if (windowRef !== null) {
        showSettingsWindow(windowRef);
      }
    },
    onExit: () => {
      services.requestExit();
    },
    getAvailabilityLabel: () => services.appState.getStatus().availability
  });
  refreshTrayMenu(tray, {
    onOpenSettings: () => {
      const windowRef = services.sessionState.getSettingsWindow();
      if (windowRef !== null) {
        showSettingsWindow(windowRef);
      }
    },
    onExit: () => {
      services.requestExit();
    },
    getAvailabilityLabel: () => services.appState.getStatus().availability
  });
  services.appState.setTrayInitialized(true);
  services.sessionState.setTray(tray);
};

const openSettingsWindow = (services: AppRuntimeServices): void => {
  const windowRef = services.sessionState.getSettingsWindow();
  if (windowRef !== null) {
    showSettingsWindow(windowRef);
    return;
  }
  const newWindow = createSettingsWindow(services.config, services.appState);
  bindSettingsWindowCloseBehavior(newWindow, services.shouldQuit);
  services.sessionState.setSettingsWindow(newWindow);
  showSettingsWindow(newWindow);
};

export { initializeMainProcess, openSettingsWindow };
