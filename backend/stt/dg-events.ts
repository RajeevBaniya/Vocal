import type { TranscriptChunkContract } from "../../shared/contracts/transcript-contracts";

type DgTranscriptEvent = {
  kind: "interim" | "final";
  text: string;
  confidence: number | null;
};

const extractTranscriptText = (payload: unknown): string => {
  if (typeof payload !== "object" || payload === null) {
    return "";
  }
  const root = payload as {
    channel?: {
      alternatives?: Array<{ transcript?: string }>;
    };
  };
  const candidate = root.channel?.alternatives?.[0]?.transcript;
  return typeof candidate === "string" ? candidate : "";
};

const extractConfidence = (payload: unknown): number | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const root = payload as {
    channel?: {
      alternatives?: Array<{ confidence?: number }>;
    };
  };
  const candidate = root.channel?.alternatives?.[0]?.confidence;
  return typeof candidate === "number" ? candidate : null;
};

const isFinalMessage = (payload: unknown): boolean => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }
  const root = payload as { is_final?: boolean };
  return root.is_final === true;
};

const toTranscriptChunk = (
  event: DgTranscriptEvent,
  timestampMs: number
): TranscriptChunkContract => {
  return {
    text: event.text,
    timestampMs,
    isFinal: event.kind === "final",
    confidence: event.confidence
  };
};

const toTranscriptEvent = (payload: unknown): DgTranscriptEvent | null => {
  const text = extractTranscriptText(payload).trim();
  if (text.length === 0) {
    return null;
  }
  return {
    kind: isFinalMessage(payload) ? "final" : "interim",
    text,
    confidence: extractConfidence(payload)
  };
};

export type { DgTranscriptEvent };
export { toTranscriptChunk, toTranscriptEvent };
