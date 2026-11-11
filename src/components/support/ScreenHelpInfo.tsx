import React from "react";
import { Info, Lightbulb, ExternalLink } from "lucide-react";

interface ScreenHelpInfoProps {
  title: string;
  description: string;
  tips?: string[];
  docLink?: string;
}

export function ScreenHelpInfo({
  title,
  description,
  tips = [],
  docLink = "/docs",
}: ScreenHelpInfoProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4 transition-all duration-200 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-bold">
            <Info className="size-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              {title}
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-ink bg-accent/20 px-2 py-0.5 rounded-full">
                Screen Guide
              </span>
            </h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-xs font-semibold text-accent-ink hover:underline p-1"
        >
          {expanded ? "Hide tips" : "Quick tips"}
        </button>
      </div>

      {expanded && tips.length > 0 && (
        <div className="mt-3.5 border-t border-border/60 pt-3 space-y-2 animate-rise">
          <p className="text-[11px] font-bold text-foreground flex items-center gap-1">
            <Lightbulb className="size-3 text-accent-ink" /> Pro-tips for this screen:
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-xs text-muted-foreground">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
          <div className="pt-1">
            <a
              href={docLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-ink hover:underline"
            >
              Open documentation <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
