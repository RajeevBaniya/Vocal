import type { AppConfig } from "../config/app-config";
import { createGroqClient, type GroqClient } from "./groq-client";
import { logger } from "../utils/logger";

type PostProcessingResult = {
  text: string;
  usedGroq: boolean;
  mode: "none" | "spelling" | "grammar" | "normalize" | "translate";
  error: string | null;
};

type PostProcessingService = {
  processTranscript: (config: AppConfig, rawText: string) => Promise<PostProcessingResult>;
};

const createPostProcessingService = (
  groqClient: GroqClient = createGroqClient()
): PostProcessingService => {
  const processTranscript = async (
    config: AppConfig,
    rawText: string
  ): Promise<PostProcessingResult> => {
    const text = rawText.trim();
    if (text.length === 0) {
      return {
        text: "",
        usedGroq: false,
        mode: "none",
        error: null
      };
    }

    if (!config.enableGroqPostProcessing || config.postProcessingMode === "none") {
      return {
        text,
        usedGroq: false,
        mode: "none",
        error: null
      };
    }

    const mode = config.postProcessingMode;
    const groqResult = await groqClient.process(config, {
      text,
      mode,
      targetLanguage: config.translationTargetLanguage
    });
    if (groqResult.output === null) {
      logger.warn("post_processing_fallback_raw", {
        mode,
        error: groqResult.error
      });
      return {
        text,
        usedGroq: false,
        mode,
        error: groqResult.error
      };
    }
    return {
      text: groqResult.output,
      usedGroq: true,
      mode,
      error: null
    };
  };

  return {
    processTranscript
  };
};

export type { PostProcessingResult, PostProcessingService };
export { createPostProcessingService };
