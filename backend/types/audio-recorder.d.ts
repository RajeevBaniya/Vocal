declare module "node-record-lpcm16" {
  import type { Readable } from "node:stream";

  type RecordingOptions = {
    sampleRateHertz?: number;
    channels?: number;
    threshold?: number;
    endOnSilence?: boolean;
    verbose?: boolean;
    recorder?: string;
    audioType?: string;
  };

  type Recorder = {
    start: (options?: RecordingOptions) => Readable;
    stop: () => void;
  };

  const recorder: Recorder;

  export = recorder;
}
