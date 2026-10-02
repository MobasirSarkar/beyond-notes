/**
 * The TS DOM lib ships the Speech *event* types but not the recognizer or the
 * install prompt event. Declared here so app code needs no casts.
 */
interface SpeechRecognitionEventMap {
  start: Event;
  end: Event;
  result: SpeechRecognitionEvent;
  error: SpeechRecognitionErrorEvent;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (event: SpeechRecognitionEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean,
  ): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

/** Chromium's install prompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}
