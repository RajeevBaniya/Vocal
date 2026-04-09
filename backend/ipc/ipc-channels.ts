import type { IpcRequestMap } from "../../shared/contracts/ipc-contracts";

const IPC_CHANNELS = {
  appGetStatus: "app:get-status",
  configGet: "config:get",
  configUpdate: "config:update",
  appOpenSettings: "app:open-settings"
} as const;

type IpcChannel = keyof IpcRequestMap;

export { IPC_CHANNELS };
export type { IpcChannel };
