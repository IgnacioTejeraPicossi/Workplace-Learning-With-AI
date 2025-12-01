import { useEffect, useRef, useState } from "react";

/**
 * Simple audio recorder using MediaRecorder
 */
export function useAudioRecorder() {
  const [supported, setSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const mediaStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "MediaRecorder" in window);
    return () => {
      try {
        stop();
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    setError(null);
    if (!supported) {
      setError("MediaRecorder not supported");
      return;
    }
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(mediaStreamRef.current, { mimeType: "audio/webm" });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch (e) {
      setError(e?.message || "mic-error");
    }
  };

  const stop = async () => {
    const rec = recorderRef.current;
    if (!rec) return null;
    return new Promise((resolve) => {
      rec.onstop = () => {
        setIsRecording(false);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          resolve(blob);
        } catch (_) {
          resolve(null);
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        }
      };
      try {
        rec.stop();
      } catch (_) {
        resolve(null);
      }
    });
  };

  return { supported, isRecording, error, start, stop };
}


