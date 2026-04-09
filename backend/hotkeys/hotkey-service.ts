import { globalShortcut } from "electron";
import { mapConfiguredHotkeyToAccelerator } from "./hotkey-mapper";
import { logger } from "../utils/logger";

type HotkeyRegistrationResult = {
  success: boolean;
  configuredHotkey: string;
  accelerator: string | null;
  error: string | null;
};

type HotkeyService = {
  register: (configuredHotkey: string, onActivate: () => void) => HotkeyRegistrationResult;
  reRegister: (configuredHotkey: string, onActivate: () => void) => HotkeyRegistrationResult;
  unregister: () => void;
  getRegisteredHotkey: () => string | null;
};

const createHotkeyService = (): HotkeyService => {
  let registeredAccelerator: string | null = null;

  const unregister = (): void => {
    if (registeredAccelerator === null) {
      return;
    }
    globalShortcut.unregister(registeredAccelerator);
    logger.info("hotkey_unregistered", {
      accelerator: registeredAccelerator
    });
    registeredAccelerator = null;
  };

  const register = (
    configuredHotkey: string,
    onActivate: () => void
  ): HotkeyRegistrationResult => {
    const mapping = mapConfiguredHotkeyToAccelerator(configuredHotkey);
    if (mapping.accelerator === null) {
      logger.warn("hotkey_register_unsupported", {
        configuredHotkey,
        warning: mapping.warning
      });
      return {
        success: false,
        configuredHotkey,
        accelerator: null,
        error: mapping.warning
      };
    }

    if (registeredAccelerator === mapping.accelerator) {
      return {
        success: true,
        configuredHotkey,
        accelerator: registeredAccelerator,
        error: null
      };
    }

    unregister();
    logger.info("hotkey_register_attempt", {
      configuredHotkey,
      accelerator: mapping.accelerator
    });
    const didRegister = globalShortcut.register(mapping.accelerator, onActivate);
    if (!didRegister) {
      logger.error("hotkey_register_failed", {
        configuredHotkey,
        accelerator: mapping.accelerator
      });
      return {
        success: false,
        configuredHotkey,
        accelerator: mapping.accelerator,
        error: "Global shortcut registration failed"
      };
    }

    registeredAccelerator = mapping.accelerator;
    logger.info("hotkey_register_success", {
      configuredHotkey,
      accelerator: mapping.accelerator
    });
    return {
      success: true,
      configuredHotkey,
      accelerator: mapping.accelerator,
      error: null
    };
  };

  const reRegister = (
    configuredHotkey: string,
    onActivate: () => void
  ): HotkeyRegistrationResult => {
    return register(configuredHotkey, onActivate);
  };

  const getRegisteredHotkey = (): string | null => registeredAccelerator;

  return {
    register,
    reRegister,
    unregister,
    getRegisteredHotkey
  };
};

export type { HotkeyRegistrationResult, HotkeyService };
export { createHotkeyService };
