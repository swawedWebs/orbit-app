import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { GoalWithTasks } from "@shared/schema";

interface AddTaskOverlayProps {
  open: boolean;
  onClose: () => void;
  goals: GoalWithTasks[];
  selectedGoalId?: number;
}

export function AddTaskOverlay({
  open,
  onClose,
  goals,
  selectedGoalId,
}: AddTaskOverlayProps) {
  const [planetId, setPlanetId] = useState<string>("");
  const [taskName, setTaskName] = useState("");

  useEffect(() => {
    if (open) {
      setTaskName("");
      if (selectedGoalId) {
        setPlanetId(String(selectedGoalId));
      } else if (goals.length > 0) {
        setPlanetId(String(goals[0].id));
      }
    }
  }, [open, selectedGoalId, goals]);

  const mutation = useMutation({
    mutationFn: async ({ goalId, name }: { goalId: number; name: string }) => {
      const res = await apiRequest("POST", `/api/goals/${goalId}/tasks`, { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setTaskName("");
      onClose();
    },
  });

  const handleSave = () => {
    const id = parseInt(planetId);
    const name = taskName.trim();
    if (!id || !name) return;
    mutation.mutate({ goalId: id, name });
  };

  return (
    <div className={`overlay ${open ? "show" : ""}`}>
      <div className="card glass" style={{ maxWidth: "640px" }}>
        <div className="eyebrow">Add Task</div>
        <div className="title" data-testid="text-add-task-title">
          Place a new task into orbit
        </div>

        <div className="field" style={{ marginTop: "18px" }}>
          <label>Planet</label>
          <select
            value={planetId}
            onChange={(e) => setPlanetId(e.target.value)}
            data-testid="select-add-task-planet"
          >
            {goals.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.icon} {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Task</label>
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Example: 10 minute walk, review budget, call a friend"
            data-testid="input-add-task-name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={mutation.isPending || !taskName.trim() || !planetId}
            data-testid="button-add-task-save"
            style={{
              opacity: mutation.isPending || !taskName.trim() || !planetId ? 0.5 : 1,
            }}
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Task
          </button>
          <button
            className="btn-ghost"
            onClick={onClose}
            data-testid="button-add-task-close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
