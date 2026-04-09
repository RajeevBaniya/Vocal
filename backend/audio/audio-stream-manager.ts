import { Buffer } from "node:buffer";

type AudioChunkHandler = (chunk: Buffer) => void;

type AudioStreamManager = {
  pushChunk: (chunk: Buffer) => void;
  subscribe: (handler: AudioChunkHandler) => () => void;
  reset: () => void;
  getBufferedChunkCount: () => number;
};

const createAudioStreamManager = (): AudioStreamManager => {
  const subscribers = new Set<AudioChunkHandler>();
  const chunkBuffer: Buffer[] = [];

  const pushChunk = (chunk: Buffer): void => {
    chunkBuffer.push(chunk);
    for (const subscriber of subscribers) {
      subscriber(chunk);
    }
  };

  const subscribe = (handler: AudioChunkHandler): (() => void) => {
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  };

  const reset = (): void => {
    chunkBuffer.length = 0;
  };

  const getBufferedChunkCount = (): number => chunkBuffer.length;

  return {
    pushChunk,
    subscribe,
    reset,
    getBufferedChunkCount
  };
};

export type { AudioChunkHandler, AudioStreamManager };
export { createAudioStreamManager };
