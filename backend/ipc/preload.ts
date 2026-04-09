import { contextBridge, ipcRenderer } from "electron";
import type { IpcChannel } from "./ipc-channels";
import type {
  IpcRequestMap,
  IpcResponseMap
} from "../../shared/contracts/ipc-contracts";

type RendererBridge = {
  invoke: <TChannel extends IpcChannel>(
    channel: TChannel,
    payload?: IpcRequestMap[TChannel]
  ) => Promise<IpcResponseMap[TChannel]>;
};

const rendererBridge: RendererBridge = {
  invoke: <TChannel extends IpcChannel>(
    channel: TChannel,
    payload?: IpcRequestMap[TChannel]
  ): Promise<IpcResponseMap[TChannel]> => {
    return ipcRenderer.invoke(
      channel,
      payload as unknown
    ) as Promise<IpcResponseMap[TChannel]>;
  }
};

contextBridge.exposeInMainWorld("vocalflow", rendererBridge);

export type { RendererBridge };
export {};
