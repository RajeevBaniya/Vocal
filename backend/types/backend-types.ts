import type { SessionPhase } from "../state/session-state";

type ServiceRegistry = Record<string, never>;
type RuntimeSnapshot = {
  sessionPhase: SessionPhase;
};

export type { RuntimeSnapshot, ServiceRegistry };
