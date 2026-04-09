import { performance } from "node:perf_hooks";

const nowIso = (): string => new Date().toISOString();
const nowMs = (): number => performance.now();

export { nowIso, nowMs };
