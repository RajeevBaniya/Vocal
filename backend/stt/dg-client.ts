import { DeepgramClient } from "@deepgram/sdk";
import type { AppConfig } from "../config/app-config";

type DgSocket = {
  on: (event: "open" | "close" | "error" | "message", callback: (value?: unknown) => void) => void;
  connect: () => DgSocket;
  close: () => void;
  sendMedia: (chunk: Buffer) => void;
  sendFinalize: (message: { type: "Finalize" }) => void;
  sendCloseStream: (message: { type: "CloseStream" }) => void;
  sendKeepAlive: (message: { type: "KeepAlive" }) => void;
};

type DgClientConnectResult = {
  socket: DgSocket | null;
  error: string | null;
};

const connectDgSocket = async (
  config: AppConfig
): Promise<DgClientConnectResult> => {
  const apiKey = config.deepgram.apiKey.trim();
  if (apiKey.length === 0) {
    return {
      socket: null,
      error: "DEEPGRAM_API_KEY is missing"
    };
  }

  const client = new DeepgramClient({ apiKey });
  const socket = await client.listen.v1.connect({
    Authorization: `Token ${apiKey}`,
    model: config.deepgram.model,
    language: config.deepgram.language
  });
  return {
    socket: socket as unknown as DgSocket,
    error: null
  };
};

export type { DgClientConnectResult, DgSocket };
export { connectDgSocket };
