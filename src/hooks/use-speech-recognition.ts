"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { getRecognizerCtor } from "@/lib/browser/platform";

export type SpeechStatus = "idle" | "listening" | "error" | "unsupported";

const ERROR_MESSAGES: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  "not-allowed": "Microphone permission denied. Allow it in your browser settings.",
  "service-not-allowed": "Speech service not allowed in this browser.",
  "audio-capture": "No microphone found.",
  network: "Speech recognition needs a network connection.",
  "no-speech": "Didn't catch that. Try again.",
  "language-not-supported": "Language not supported.",
};

const noopSubscribe = () => () => {};
const isSupported = () => getRecognizerCtor() !== null;

type Options = { lang?: string; continuous?: boolean; onFinal?: (text: string) => void };

/** Typed wrapper around the Web Speech API. `onFinal` receives each finalised phrase. */
export function useSpeechRecognition({ lang, continuous = false, onFinal }: Options) {
  const supported = useSyncExternalStore(noopSubscribe, isSupported, () => true);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = getRecognizerCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang ?? (navigator.language || "en-US");
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.addEventListener("start", () => {
      setError(null);
      setStatus("listening");
    });
    rec.addEventListener("result", (e) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result?.[0]?.transcript ?? "";
        if (result?.isFinal) {
          const clean = text.trim();
          if (clean) onFinalRef.current?.(clean);
        } else {
          partial += text;
        }
      }
      setInterim(partial);
    });
    rec.addEventListener("error", (e) => {
      if (e.error === "aborted") return;
      setError(ERROR_MESSAGES[e.error] ?? `Speech error: ${e.error}`);
      setStatus("error");
    });
    rec.addEventListener("end", () => {
      setInterim("");
      setStatus((s) => (s === "error" ? s : "idle"));
      if (recRef.current === rec) recRef.current = null;
    });

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setError("Could not start the microphone.");
      setStatus("error");
    }
  }, [lang, continuous]);

  useEffect(() => () => recRef.current?.abort(), []);

  return {
    supported,
    status: supported ? status : "unsupported",
    listening: status === "listening",
    interim,
    error,
    start,
    stop,
    toggle: () => (status === "listening" ? stop() : start()),
  };
}
