import { logger } from "./logger";

const serializeError = (value: unknown): Record<string, unknown> => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? ""
    };
  }
  return {
    message: "Unknown error",
    value
  };
};

const handleProcessError = (value: unknown): void => {
  logger.error("process_error", serializeError(value));
};

export { handleProcessError };
