import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { GoalWithTasks } from "@shared/schema";

interface AskOrbitOverlayProps {
  open: boolean;
  onClose: () => void;
  goal: GoalWithTasks | null;
}

function buildLocalOrbitAnswer(goal: GoalWithTasks, prompt: string): string {
  const lower = prompt.toLowerCase();
  const remaining = goal.tasks.filter((t) => !t.done).map((t) => t.name);

  if (lower.includes("consistent") || lower.includes("consistency")) {
    return [
      "Orbit:",
      "",
      `Consistency on ${goal.name.toLowerCase()} comes from reducing friction, not increasing pressure.`,
      "Choose one task you can complete even on a low-energy day.",
      remaining[0]
        ? `Start with: ${remaining[0]}.`
        : "Your current tasks are already complete; maintain the rhythm gently.",
      "",
      "When this becomes easy, let the orbit move inward on its own.",
    ].join("\n");
  }

  if (lower.includes("start") || lower.includes("begin")) {
    return [
      "Orbit:",
      "",
      `To begin with ${goal.name.toLowerCase()}, make the first action extremely small.`,
      remaining[0]
        ? `A good starting point is: ${remaining[0]}.`
        : "You already have momentum here.",
      "Avoid trying to fix the whole planet at once.",
      "Let one action create the next.",
    ].join("\n");
  }

  return [
    "Orbit:",
    "",
    `This planet responds well to calm repetition.`,
    `The question you asked was: "${prompt}"`,
    "",
    "A grounded way forward would be:",
    "\u2022 make the next step visible",
    "\u2022 keep it small enough to repeat",
    "\u2022 revisit the planet before it starts drifting outward",
    "",
    `Orbit would focus on ${remaining[0] || "maintaining your current rhythm"} next.`,
  ].join("\n");
}

export function AskOrbitOverlay({ open, onClose, goal }: AskOrbitOverlayProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("Orbit will respond here.");

  const mutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/coach", { prompt });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data.reply);
    },
    onError: () => {
      if (goal && input.trim()) {
        setResult(buildLocalOrbitAnswer(goal, input.trim()));
      } else {
        setResult("Orbit:\n\nAsk something specific so the reflection has direction.");
      }
    },
  });

  const handleReflect = () => {
    const prompt = input.trim();
    if (!goal || !prompt) {
      setResult("Orbit:\n\nAsk something specific so the reflection has direction.");
      return;
    }

    const contextPrompt = `About my "${goal.name}" goal (${goal.progress}% complete): ${prompt}`;
    mutation.mutate(contextPrompt);
  };

  const handleClose = () => {
    setInput("");
    setResult("Orbit will respond here.");
    onClose();
  };

  return (
    <div className={`overlay ${open ? "show" : ""}`}>
      <div className="card glass" style={{ maxWidth: "760px" }}>
        <div className="eyebrow">Ask Orbit</div>
        <div className="title" data-testid="text-ask-orbit-title">
          A calm reflection for this planet
        </div>

        <div className="field" style={{ marginTop: "18px" }}>
          <label>What do you want help with?</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: I want help staying consistent with this planet."
            data-testid="input-ask-orbit"
          />
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
          <button
            className="btn-primary"
            onClick={handleReflect}
            disabled={mutation.isPending}
            data-testid="button-ask-orbit-reflect"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Reflect
          </button>
          <button
            className="btn-ghost"
            onClick={handleClose}
            data-testid="button-ask-orbit-close"
          >
            Close
          </button>
        </div>

        <div className="section" style={{ marginTop: "18px" }}>
          <h3>Orbit</h3>
          <div className="orbit-voice" data-testid="text-ask-orbit-result">
            {result}
          </div>
        </div>
      </div>
    </div>
  );
}
