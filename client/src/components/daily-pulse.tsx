import type { GoalWithTasks } from "@shared/schema";

interface DailyPulseProps {
  open: boolean;
  onClose: () => void;
  goals: GoalWithTasks[];
}

function buildDailyPulseText(goals: GoalWithTasks[]): string {
  if (!goals.length) return "Orbit:\n\nNo planets in your system yet. Add a goal to begin.";

  const sorted = [...goals].sort((a, b) => a.progress - b.progress);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];

  return [
    "Orbit:",
    "",
    `Your ${highest.name.toLowerCase()} planet feels the most stable right now.`,
    `${lowest.name} is drifting a little farther outward.`,
    "",
    `A small action on ${lowest.name.toLowerCase()} would bring balance back into your orbit.`,
  ].join("\n");
}

export function DailyPulse({ open, onClose, goals }: DailyPulseProps) {
  const pulseText = buildDailyPulseText(goals);

  return (
    <div className={`overlay ${open ? "show" : ""}`}>
      <div className="card glass" style={{ maxWidth: "760px" }}>
        <div className="eyebrow">Daily Pulse</div>
        <div className="title" style={{ fontSize: "32px" }} data-testid="text-pulse-title">
          Orbit noticed something
        </div>
        <div className="section" style={{ marginTop: "18px" }}>
          <div className="orbit-voice" data-testid="text-pulse-content">
            {pulseText}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
          <button
            className="btn-primary"
            onClick={onClose}
            data-testid="button-pulse-close"
          >
            Return to Orbit
          </button>
        </div>
      </div>
    </div>
  );
}
