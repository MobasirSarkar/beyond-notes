import { Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
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
      <span aria-hidden className="relative flex">
        <Icon icon={listening ? MicOff : Mic} />
        {listening ? (
          <span className="absolute -top-0.5 -right-0.5 size-1.5 animate-pulse rounded-full bg-current" />
        ) : null}
      </span>
      {listening ? "rec" : "mic"}
    </Button>
  );
}
