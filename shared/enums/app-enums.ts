const APP_ENVIRONMENT = {
  development: "development",
  production: "production"
} as const;

const APP_AVAILABILITY = {
  idle: "idle",
  busy: "busy",
  offline: "offline"
} as const;

const SESSION_PHASE = {
  idle: "idle",
  recording: "recording",
  transcribing: "transcribing",
  processing: "processing",
  injecting: "injecting",
  completed: "completed",
  failed: "failed"
} as const;

export { APP_AVAILABILITY, APP_ENVIRONMENT, SESSION_PHASE };
