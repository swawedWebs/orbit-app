import { useEffect } from "react";
import type { GoalWithTasks } from "@shared/schema";

interface GoalsSheetProps {
  open: boolean;
  onClose: () => void;
  goals: GoalWithTasks[];
  onGoalClick: (goal: GoalWithTasks) => void;
}

export function GoalsSheet({ open, onClose, goals, onGoalClick }: GoalsSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[39]"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={onClose}
          data-testid="goals-sheet-backdrop"
        />
      )}
      <div className={`sheet ${open ? "open" : ""}`} data-testid="goals-sheet">
        <div className="sheet-card glass" style={{ overflowY: "auto", maxHeight: "min(68vh, 740px)" }}>
          <div className="sheet-grabber" />

          <div className="sheet-head">
            <div className="sheet-title">
              <div>
                <h2>Your Planets</h2>
                <div className="sub">{goals.length} goal{goals.length !== 1 ? "s" : ""} in orbit</div>
              </div>
            </div>
            <button
              className="close-btn"
              onClick={onClose}
              data-testid="button-close-goals-sheet"
            >
              ✕
            </button>
          </div>

          <div className="mini-list">
            {goals.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px 0", fontSize: "14px" }}>
                No goals yet. Add a goal to get started.
              </p>
            ) : (
              goals.map((goal) => {
                const doneCount = goal.tasks.filter((t) => t.done).length;
                const totalCount = goal.tasks.length;
                const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

                return (
                  <div
                    key={goal.id}
                    className="mini-item"
                    onClick={() => onGoalClick(goal)}
                    data-testid={`goals-sheet-item-${goal.id}`}
                  >
                    <div className="left">
                      <span className="emoji">{goal.icon || "🎯"}</span>
                      <div>
                        <div className="name">{goal.name}</div>
                        <div className="muted">{doneCount}/{totalCount} tasks</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "rgba(255,255,255,0.84)" }}>
                      {pct}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
