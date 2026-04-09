import type { RendererBridge } from "../ipc/preload";

declare global {
  interface Window {
    vocalflow: RendererBridge;
  }
}

export {};
