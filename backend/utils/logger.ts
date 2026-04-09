import { nowIso } from "./time";

type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

type Logger = {
  info: (event: string, meta?: LogMeta) => void;
  warn: (event: string, meta?: LogMeta) => void;
  error: (event: string, meta?: LogMeta) => void;
};

const writeLog = (level: LogLevel, event: string, meta: LogMeta = {}): void => {
  process.stdout.write(
    `${JSON.stringify({
      level,
      event,
      timestamp: nowIso(),
      meta
    })}\n`
  );
};

const logger: Logger = {
  info: (event: string, meta?: LogMeta): void => {
    writeLog("info", event, meta ?? {});
  },
  warn: (event: string, meta?: LogMeta): void => {
    writeLog("warn", event, meta ?? {});
  },
  error: (event: string, meta?: LogMeta): void => {
    writeLog("error", event, meta ?? {});
  }
};

export type { LogLevel, LogMeta, Logger };
export { logger };
