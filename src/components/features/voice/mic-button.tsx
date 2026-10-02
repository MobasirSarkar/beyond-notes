import { Button } from "@/components/ui/button";
import type { ButtonSize } from "@/types/ui";

type Props = {
  listening: boolean;
  supported: boolean;
  onClick: () => void;
  size?: ButtonSize;
  className?: string;
};

export function MicButton({ listening, supported, onClick, size = "md", className }: Props) {
  return (
    <Button
      variant={listening ? "solid" : "outline"}
      size={size}
      onClick={onClick}
      disabled={!supported}
      aria-pressed={listening}
      aria-label={listening ? "Stop dictation" : "Start dictation"}
      title={supported ? "Dictate (Web Speech API)" : "Voice input isn't supported in this browser"}
      className={className}
    >
      <span aria-hidden className={listening ? "animate-blink" : undefined}>
        ◉
      </span>
      {listening ? "rec" : "mic"}
    </Button>
  );
}
