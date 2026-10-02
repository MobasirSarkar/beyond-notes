"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  getRecognizerCtor,
  type Recognizer,
  type SpeechRecognitionFailureEvent,
  type SpeechRecognitionResultEvent,
} from "@/types/speech";

export type SpeechStatus = "idle" | "listening" | "error" | "unsupported";

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone permission denied. Allow it in your browser settings.",
  "service-not-allowed": "Speech service not allowed in this browser.",
  "audio-capture": "No microphone found.",
  network: "Speech recognition needs a network connection.",
  "no-speech": "Didn't catch that. Try again.",
  "language-not-supported": "Language not supported.",
};

const noop = () => () => {};

/**
 * Typed wrapper around the browser Web Speech API.
 * `onFinal` receives each finalised phrase; `interim` holds the live partial.
 */
export function useSpeechRecognition(opts: {
  lang?: string;
  continuous?: boolean;
  onFinal?: (text: string) => void;
}) {
  const supported = useSyncExternalStore(
    noop,
    () => getRecognizerCtor() !== null,
    () => true,
  );
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);
  const onFinalRef = useRef(opts.onFinal);
  useEffect(() => {
    onFinalRef.current = opts.onFinal;
  }, [opts.onFinal]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognizerCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = opts.lang ?? (navigator.language || "en-US");
    rec.continuous = opts.continuous ?? false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.addEventListener("start", () => {
      setError(null);
      setStatus("listening");
    });
    rec.addEventListener("result", (event) => {
      const e = event as SpeechRecognitionResultEvent;
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
    rec.addEventListener("error", (event) => {
      const e = event as SpeechRecognitionFailureEvent;
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
  }, [opts.lang, opts.continuous]);

  useEffect(() => () => recRef.current?.abort(), []);

  return {
    supported,
    status: supported ? status : ("unsupported" as const),
    listening: status === "listening",
    interim,
    error,
    start,
    stop,
    toggle: () => (status === "listening" ? stop() : start()),
  };
}
