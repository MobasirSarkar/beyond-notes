"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

/**
 * Debounced autosave for a value. Flushes pending changes on page hide and
 * unmount so nothing typed is lost.
 */
export function useAutosave<T>(value: T, save: (value: T) => void, delay = 700) {
  const [dirty, setDirty] = useState(false);
  const latest = useRef(value);
  const dirtyRef = useRef(false);
  const persist = useEffectEvent(save);

  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    dirtyRef.current = dirty;
    if (!dirty) return;
    const t = window.setTimeout(() => {
      persist(latest.current);
      setDirty(false);
    }, delay);
    return () => window.clearTimeout(t);
  }, [dirty, value, delay]);

  useEffect(() => {
    const flush = () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      persist(latest.current);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  return { dirty, markDirty: () => setDirty(true) };
}
