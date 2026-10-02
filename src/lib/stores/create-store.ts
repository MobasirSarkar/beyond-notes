import { useSyncExternalStore } from "react";

type Listener = () => void;
type Updater<S> = Partial<S> | ((state: S) => Partial<S>);

/**
 * Minimal typed external store with selector subscriptions. Components only
 * re-render when the slice they select changes (selectors must return
 * primitives or stable references).
 */
export function createStore<S extends object>(initial: S, onChange?: (state: S) => void) {
  let state = initial;
  const listeners = new Set<Listener>();

  const get = (): S => state;

  const set = (updater: Updater<S>): void => {
    const patch = typeof updater === "function" ? updater(state) : updater;
    state = { ...state, ...patch };
    onChange?.(state);
    for (const listener of listeners) listener();
  };

  const replace = (next: S): void => {
    state = next;
    for (const listener of listeners) listener();
  };

  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  function useStore<T>(selector: (state: S) => T): T {
    return useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(initial),
    );
  }

  return { get, set, replace, subscribe, useStore };
}
