import { clipboard } from "electron";
import { Key, keyboard } from "@nut-tree-fork/nut-js";
import { logger } from "../utils/logger";

type InjectionStatus = "idle" | "injecting" | "succeeded" | "failed";

type TextInjectionResult = {
  success: boolean;
  injectedText: string;
  error: string | null;
};

type TextInjectorService = {
  injectText: (text: string) => Promise<TextInjectionResult>;
};

const PRE_PASTE_DELAY_MS = 120;
const KEY_CHORD_GAP_MS = 30;
const POST_PASTE_DELAY_MS = 60;

const sleep = async (ms: number): Promise<void> => {
  await new Promise<void>((resolvePromise) => {
    setTimeout(() => resolvePromise(), ms);
  });
};

const createTextInjectorService = (): TextInjectorService => {
  keyboard.config.autoDelayMs = 12;

  const injectText = async (text: string): Promise<TextInjectionResult> => {
    const normalizedText = text.trim();
    if (normalizedText.length === 0) {
      return {
        success: false,
        injectedText: "",
        error: "No text available for injection"
      };
    }

    try {
      clipboard.writeText(normalizedText, "clipboard");
      await sleep(PRE_PASTE_DELAY_MS);
      await keyboard.pressKey(Key.LeftControl, Key.V);
      await sleep(KEY_CHORD_GAP_MS);
      await keyboard.releaseKey(Key.V, Key.LeftControl);
      await sleep(POST_PASTE_DELAY_MS);
      logger.info("text_injection_success", {
        textLength: normalizedText.length
      });
      const clipboardText = clipboard.readText("clipboard");
      return {
        success: true,
        injectedText: clipboardText,
        error: null
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Text injection failed";
      logger.error("text_injection_failed", {
        error: message
      });
      return {
        success: false,
        injectedText: "",
        error: message
      };
    }
  };

  return {
    injectText
  };
};

export type { InjectionStatus, TextInjectionResult, TextInjectorService };
export { createTextInjectorService };
