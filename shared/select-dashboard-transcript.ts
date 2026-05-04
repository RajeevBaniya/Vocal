import type { AppStatusSnapshot } from "./types/shared-types";

const selectDashboardTranscript = (
  status: AppStatusSnapshot | null
): string => {
  if (status === null) {
    return "";
  }
  const contractValue = status.lastTranscript ?? "";
  if (contractValue.length > 0) {
    return contractValue;
  }
  if (status.lastProcessedTranscript.length > 0) {
    return status.lastProcessedTranscript;
  }
  if (status.lastSttFinal.length > 0) {
    return status.lastSttFinal;
  }
  return status.lastSttPreview;
};

export { selectDashboardTranscript };
