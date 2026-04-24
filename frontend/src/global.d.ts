import type { IpcRequestMap, IpcResponseMap } from "../../shared/contracts/ipc-contracts";

type FrontendIpcBridge = {
  invoke: <TChannel extends keyof IpcRequestMap>(
    channel: TChannel,
    payload?: IpcRequestMap[TChannel]
  ) => Promise<IpcResponseMap[TChannel]>;
};

declare global {
  interface Window {
    vocalflow: FrontendIpcBridge;
  }
}

export {};
