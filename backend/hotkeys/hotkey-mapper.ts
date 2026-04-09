import { logger } from "../utils/logger";

type HotkeyMapResult = {
  accelerator: string | null;
  warning: string | null;
};

const modifierKeys = new Set(["Alt", "Control", "Shift", "Super"]);

const normalizeSegment = (segment: string): string => {
  const value = segment.trim().toLowerCase();
  if (value === "left option" || value === "right option" || value === "option") {
    return "Alt";
  }
  if (value === "left command" || value === "right command" || value === "command" || value === "cmd") {
    return "Super";
  }
  if (value === "fn" || value === "function") {
    return "Fn";
  }
  if (value === "ctrl" || value === "control") {
    return "Control";
  }
  if (value === "shift") {
    return "Shift";
  }
  if (value === "alt") {
    return "Alt";
  }
  if (value.length === 1) {
    return value.toUpperCase();
  }
  return segment.trim();
};

const mapConfiguredHotkeyToAccelerator = (configuredHotkey: string): HotkeyMapResult => {
  const trimmedValue = configuredHotkey.trim();
  if (trimmedValue.length === 0) {
    return {
      accelerator: null,
      warning: "Hotkey is empty"
    };
  }

  const parts = trimmedValue.split("+").map((value) => normalizeSegment(value));
  if (parts.some((value) => value === "Fn")) {
    return {
      accelerator: null,
      warning: "Fn-based global hotkeys are unsupported for reliable registration"
    };
  }
  const hasNonModifier = parts.some((value) => !modifierKeys.has(value));
  if (!hasNonModifier) {
    return {
      accelerator: null,
      warning:
        "Modifier-only global shortcuts are unsupported for reliable registration"
    };
  }

  const accelerator = parts.join("+");
  if (accelerator.length === 0) {
    return {
      accelerator: null,
      warning: "Hotkey mapping failed"
    };
  }

  if (accelerator !== trimmedValue) {
    logger.info("hotkey_mapped", {
      configuredHotkey: trimmedValue,
      accelerator
    });
  }

  return {
    accelerator,
    warning: null
  };
};

export type { HotkeyMapResult };
export { mapConfiguredHotkeyToAccelerator };
