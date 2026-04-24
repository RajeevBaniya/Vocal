import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import type { AppStatusSnapshot } from "../../shared/types/shared-types";

const App = (): JSX.Element => {
  const [status, setStatus] = useState<AppStatusSnapshot | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchStatus = async (): Promise<void> => {
      try {
        const snapshot = await window.vocalflow.invoke("app:get-status");
        setStatus(snapshot);
        setError("");
      } catch {
        setError("IPC status poll failed");
      }
    };

    void fetchStatus();
    const interval = setInterval(() => {
      void fetchStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const phase = useMemo(() => {
    if (status === null) {
      return "unknown";
    }
    return status.sessionState?.phase ?? status.sessionPhase;
  }, [status]);

  const hotkeyActive = useMemo(() => {
    if (status === null) {
      return false;
    }
    return status.hotkeyStatus?.registered ?? status.isHotkeyRegistered;
  }, [status]);

  const audioReady = useMemo(() => {
    if (status === null) {
      return false;
    }
    return status.readiness?.audio ?? status.isAudioReady;
  }, [status]);

  const sttReady = useMemo(() => {
    if (status === null) {
      return false;
    }
    return status.readiness?.stt ?? status.isSttReady;
  }, [status]);

  const lastTranscript = useMemo(() => {
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
  }, [status]);

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>Vocalflow Status</h1>
      {status ? (
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            Phase: <span style={{ fontFamily: "monospace", background: "#dbeafe", padding: "4px 8px", borderRadius: "6px" }}>{phase}</span>
          </div>
          <div>
            Hotkey: <span style={{ fontFamily: "monospace" }}>{hotkeyActive ? "✅ Active" : "❌ Inactive"}</span>
          </div>
          <div>
            Ready: Audio{" "}
            <span style={{ padding: "4px 8px", borderRadius: "6px", background: audioReady ? "#dcfce7" : "#fee2e2" }}>
              {audioReady ? "✅" : "❌"}
            </span>{" "}
            STT{" "}
            <span style={{ padding: "4px 8px", borderRadius: "6px", background: sttReady ? "#dcfce7" : "#fee2e2" }}>
              {sttReady ? "✅" : "❌"}
            </span>
          </div>
          <div>
            Last Transcript:{" "}
            <span style={{ fontFamily: "monospace", background: "#fef9c3", padding: "4px 8px", borderRadius: "6px" }}>
              {lastTranscript || "None"}
            </span>
          </div>
          {error.length > 0 ? <div style={{ color: "#dc2626" }}>{error}</div> : null}
        </div>
      ) : (
        <div style={{ color: "#6b7280" }}>Connecting to backend...</div>
      )}
    </div>
  );
};

export { App };
