type TranscriptChunkContract = {
  text: string;
  timestampMs: number;
  isFinal: boolean;
  confidence: number | null;
};

export type { TranscriptChunkContract };
