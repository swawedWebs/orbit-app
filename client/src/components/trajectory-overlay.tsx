import { useState, useEffect } from "react";
import type { GoalWithTasks } from "@shared/schema";

interface TrajectoryOverlayProps {
  open: boolean;
  onClose: () => void;
  goal: GoalWithTasks | null;
}

interface TrajectoryQuestion {
  key: string;
  label: string;
  placeholder: string;
}

function getTrajectoryQuestions(category: string): TrajectoryQuestion[] {
  if (category === "finance") {
    return [
      { key: "income", label: "Current income", placeholder: "Example: 3200 / month" },
      { key: "goal", label: "Money goal", placeholder: "Example: save 10,000" },
      { key: "timeline", label: "Timeline", placeholder: "Example: 18 months" },
      { key: "habit", label: "Current habit", placeholder: "Example: I save 100 a month" },
    ];
  }
  if (category === "health") {
    return [
      { key: "goal", label: "Health goal", placeholder: "Example: build consistency, sleep better" },
      { key: "routine", label: "Current routine", placeholder: "Example: I walk twice a week" },
      { key: "time", label: "Time available", placeholder: "Example: 15 minutes a day" },
      { key: "barrier", label: "Main barrier", placeholder: "Example: energy, schedule, motivation" },
    ];
  }
  if (category === "relationships") {
    return [
      { key: "goal", label: "Relationship goal", placeholder: "Example: reconnect with family" },
      { key: "cadence", label: "Current cadence", placeholder: "Example: I only reach out once a month" },
      { key: "person", label: "Who matters most", placeholder: "Example: sister, parents, partner" },
      { key: "barrier", label: "Main barrier", placeholder: "Example: time, distance, awkwardness" },
    ];
  }
  return [
    { key: "goal", label: "Primary goal", placeholder: "Example: become consistent, finish a course" },
    { key: "starting", label: "Where are you now?", placeholder: "Example: beginner, halfway, planning" },
    { key: "time", label: "Time available", placeholder: "Example: 30 minutes a day" },
    { key: "barrier", label: "Main barrier", placeholder: "Example: distraction, uncertainty" },
  ];
}

function buildTrajectoryReflection(
  goal: GoalWithTasks,
  answers: Record<string, string>
): string {
  const category = goal.category;

  if (category === "finance") {
    return [
      "Orbit:",
      "",
      `Your ${goal.name.toLowerCase()} planet becomes clearer when the goal is visible.`,
      answers.income
        ? `You're starting from ${answers.income}.`
        : "Your starting income is still undefined.",
      answers.goal
        ? `The direction you named is: ${answers.goal}.`
        : "You haven't named the money goal clearly yet.",
      "",
      "A calmer path would be:",
      "\u2022 define one exact monthly saving target",
      "\u2022 reduce one repeating leak in your spending",
      "\u2022 revisit the goal weekly instead of emotionally",
      "",
      "If you keep the goal small and consistent, this planet will move inward more naturally.",
    ].join("\n");
  }

  if (category === "health") {
    return [
      "Orbit:",
      "",
      answers.goal
        ? `You want to move toward: ${answers.goal}.`
        : "Your health direction is still open.",
      answers.routine
        ? `Your current rhythm is: ${answers.routine}.`
        : "Your current routine still needs definition.",
      "",
      "A steadier health trajectory would be:",
      "\u2022 choose a routine small enough to repeat",
      "\u2022 attach it to a time you already protect",
      "\u2022 measure consistency before intensity",
      "",
      "Health responds best when the orbit changes quietly, not dramatically.",
    ].join("\n");
  }

  return [
    "Orbit:",
    "",
    answers.goal
      ? `The planet is pointing toward: ${answers.goal}.`
      : "The direction is still forming.",
    answers.starting
      ? `You described your current point as: ${answers.starting}.`
      : "",
    "",
    "A more grounded trajectory would be:",
    "\u2022 reduce the goal to a repeatable next step",
    "\u2022 protect a small time window for it",
    "\u2022 let consistency become visible before expecting speed",
    "",
    `This would help your ${goal.name.toLowerCase()} planet stabilize over time.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function TrajectoryOverlay({ open, onClose, goal }: TrajectoryOverlayProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState(
    "Complete the questions above to see a more grounded reflection."
  );

  useEffect(() => {
    if (open) {
      setAnswers({});
      setResult("Complete the questions above to see a more grounded reflection.");
    }
  }, [open, goal?.id]);

  if (!goal) return null;

  const questions = getTrajectoryQuestions(goal.category);

  const handleReflect = () => {
    setResult(buildTrajectoryReflection(goal, answers));
  };

  return (
    <div className={`overlay ${open ? "show" : ""}`}>
      <div className="card glass" style={{ maxWidth: "760px" }}>
        <div className="eyebrow">Trajectory</div>
        <div className="title" data-testid="text-trajectory-title">
          {goal.name} Trajectory
        </div>
        <div className="sub" data-testid="text-trajectory-sub">
          Orbit will ask about your {goal.name.toLowerCase()} planet and reflect on a more
          grounded direction.
        </div>

        <div className="question-grid" data-testid="trajectory-questions">
          {questions.map((q) => (
            <div className="section" key={q.key}>
              <h3>{q.label}</h3>
              <div className="field">
                <input
                  value={answers[q.key] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))
                  }
                  placeholder={q.placeholder}
                  data-testid={`input-trajectory-${q.key}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
          <button
            className="btn-primary"
            onClick={handleReflect}
            data-testid="button-trajectory-reflect"
          >
            Reflect My Trajectory
          </button>
          <button
            className="btn-ghost"
            onClick={onClose}
            data-testid="button-trajectory-close"
          >
            Close
          </button>
        </div>

        <div className="section" style={{ marginTop: "18px" }}>
          <h3>Orbit Reflection</h3>
          <div className="orbit-voice" data-testid="text-trajectory-result">
            {result}
          </div>
        </div>
      </div>
    </div>
  );
}
