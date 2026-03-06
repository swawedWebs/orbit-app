import { useState } from "react";
import type { Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareScoreProps {
  goals: Goal[];
}

function buildShareText(goals: Goal[]): string {
  if (goals.length === 0) return "I'm starting my Orbit journey! Track your life goals like a solar system.";

  const score = Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length);
  const topGoal = [...goals].sort((a, b) => b.progress - a.progress)[0];

  const lines = [
    `My Orbit Score: ${score}/100`,
    `${goals.length} goals in orbit`,
    `Strongest: ${topGoal.name} (${topGoal.progress}%)`,
    "",
    goals.map(g => {
      const bar = "■".repeat(Math.round(g.progress / 10)) + "□".repeat(10 - Math.round(g.progress / 10));
      return `${g.name} ${bar} ${g.progress}%`;
    }).join("\n"),
    "",
    "Track your life like a solar system — Orbit",
  ];

  return lines.join("\n");
}

export function ShareScore({ goals }: ShareScoreProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    const text = buildShareText(goals);

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Orbit Score", text });
        return;
      } catch {
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Orbit score copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy to clipboard", variant: "destructive" });
    }
  };

  return (
    <Button
      onClick={handleShare}
      className="orbit-btn gap-2"
      data-testid="button-share-score"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share My Orbit Score
        </>
      )}
    </Button>
  );
}
