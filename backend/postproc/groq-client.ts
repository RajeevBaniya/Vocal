import Groq from "groq-sdk";
import type { AppConfig } from "../config/app-config";

type GroqProcessInput = {
  text: string;
  mode: "spelling" | "grammar" | "normalize" | "translate";
  targetLanguage: string;
};

type GroqProcessResult = {
  output: string | null;
  error: string | null;
};

type GroqClient = {
  process: (config: AppConfig, input: GroqProcessInput) => Promise<GroqProcessResult>;
};

const buildSystemPrompt = (
  mode: "spelling" | "grammar" | "normalize" | "translate",
  targetLanguage: string
): string => {
  if (mode === "spelling") {
    return "Correct spelling errors only. Keep grammar and meaning unchanged. Return only corrected text.";
  }
  if (mode === "grammar") {
    return "Correct grammar and punctuation while preserving meaning and language. Return only corrected text.";
  }
  if (mode === "normalize") {
    return "Normalize transliteration and code-mixed text into clean, readable target language script while preserving meaning. Return only normalized text.";
  }
  return `You translate text accurately into ${targetLanguage}. Return only the translated text.`;
};

const createGroqClient = (): GroqClient => {
  const process = async (
    config: AppConfig,
    input: GroqProcessInput
  ): Promise<GroqProcessResult> => {
    const apiKey = config.groq.apiKey.trim();
    const model = config.groq.model.trim();
    if (apiKey.length === 0) {
      return {
        output: null,
        error: "GROQ_API_KEY is missing"
      };
    }
    if (model.length === 0) {
      return {
        output: null,
        error: "Groq model is not configured"
      };
    }

    try {
      const client = new Groq({ apiKey });
      const completion = await client.chat.completions.create({
        model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(input.mode, input.targetLanguage)
          },
          {
            role: "user",
            content: input.text
          }
        ]
      });
      const output = completion.choices[0]?.message?.content?.trim() ?? "";
      if (output.length === 0) {
        return {
          output: null,
          error: "Groq returned empty output"
        };
      }
      return {
        output,
        error: null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Groq request failed";
      return {
        output: null,
        error: message
      };
    }
  };

  return {
    process
  };
};

export type { GroqClient, GroqProcessInput, GroqProcessResult };
export { createGroqClient };
