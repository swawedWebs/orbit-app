import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GoalWithTasks } from "@shared/schema";

interface PlanetSheetProps {
  goal: GoalWithTasks | null;
  onClose: () => void;
  onAskOrbit: () => void;
  onTrajectory: () => void;
  onAddTask: () => void;
}

function planetStateLabel(progress: number): string {
  if (progress >= 90) return "Aligned";
  if (progress >= 60) return "Stable";
  if (progress >= 30) return "Shifting";
  return "Drifting";
}

function orbitPlanetReflection(name: string, progress: number, doneCount: number, totalCount: number): string {
  const remaining = totalCount - doneCount;
  if (progress >= 90) {
    return `Orbit:\n\nYour ${name.toLowerCase()} planet feels bright and close.\nThe system around it looks stable.\nA small act of maintenance will keep it aligned.`;
  }
  if (progress >= 60) {
    return `Orbit:\n\nYour ${name.toLowerCase()} planet is settling inward.\n${remaining} small ${remaining === 1 ? "step remains" : "steps remain"} before it feels fully steady.`;
  }
  if (progress >= 30) {
    return `Orbit:\n\nYour ${name.toLowerCase()} planet has started to respond.\nA little consistency here would noticeably rebalance your orbit.`;
  }
  return `Orbit:\n\nThis planet is still drifting outward.\nBegin with one small action.\nQuiet movement is enough to change the system.`;
}

export function PlanetSheet({ goal, onClose, onAskOrbit, onTrajectory, onAddTask }: PlanetSheetProps) {
  const toggleMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  useEffect(() => {
    if (!goal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goal, onClose]);

  const doneCount = goal ? goal.tasks.filter((t) => t.done).length : 0;
  const totalCount = goal ? goal.tasks.length : 0;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div
      className={`sheet ${goal ? "open" : ""}`}
      data-testid="planet-sheet"
    >
      <div className="sheet-card glass" style={{ maxHeight: "min(68vh, 740px)", overflowY: "auto" }}>
        <div className="sheet-grabber" />

        {goal && (
          <>
            <div className="sheet-head">
              <div className="sheet-title">
                <div style={{ fontSize: 30, lineHeight: 1 }}>{goal.icon || "🎯"}</div>
                <div style={{ minWidth: 0 }}>
                  <h2
                    className="text-white"
                    data-testid="sheet-goal-name"
                    style={{ margin: 0, fontSize: 24, lineHeight: 1.1, letterSpacing: "-0.03em" }}
                  >
                    {goal.name}
                  </h2>
                  <div
                    className="sub"
                    data-testid="sheet-goal-progress"
                    style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45 }}
                  >
                    {progress}% complete
                  </div>
                </div>
              </div>
              <button
                className="close-btn"
                onClick={onClose}
                data-testid="button-close-sheet"
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <div className="stat-row">
                <div className="stat">
                  <div className="k">Progress</div>
                  <div className="v" data-testid="stat-progress">{progress}%</div>
                </div>
                <div className="stat">
                  <div className="k">Orbit State</div>
                  <div className="v" data-testid="stat-state">{planetStateLabel(progress)}</div>
                </div>
                <div className="stat">
                  <div className="k">Tasks</div>
                  <div className="v" data-testid="stat-tasks">{doneCount} / {totalCount}</div>
                </div>
              </div>

              <div className="section">
                <h3 className="text-white">Tasks</h3>
                <div className="tasks">
                  {totalCount === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, padding: "16px 0", textAlign: "center" }}>
                      No tasks yet. Add tasks from the goals panel.
                    </p>
                  ) : (
                    goal.tasks.map((task) => (
                      <label
                        key={task.id}
                        className={`task ${task.done ? "done" : ""}`}
                        data-testid={`sheet-task-${task.id}`}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleMutation.mutate(task.id)}
                        />
                        <div className="txt">{task.name}</div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="section">
                <h3 className="text-white">Orbit</h3>
                <div className="orbit-voice" data-testid="planet-orbit-voice">
                  {orbitPlanetReflection(goal.name, progress, doneCount, totalCount)}
                </div>
                <div className="inline-actions">
                  <button
                    className="action-btn"
                    onClick={onAskOrbit}
                    data-testid="button-ask-orbit"
                  >
                    Ask Orbit
                  </button>
                  <button
                    className="action-btn"
                    onClick={onTrajectory}
                    data-testid="button-trajectory"
                  >
                    Trajectory
                  </button>
                  <button
                    className="action-btn"
                    onClick={onAddTask}
                    data-testid="button-add-task"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
