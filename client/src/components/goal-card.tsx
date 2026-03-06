import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GoalWithTasks } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, X, ChevronUp, ChevronDown } from "lucide-react";

interface GoalCardProps {
  goal: GoalWithTasks;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function GoalCard({ goal, onMoveUp, onMoveDown, isFirst, isLast }: GoalCardProps) {
  const { toast } = useToast();
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const doneCount = goal.tasks.filter((t) => t.done).length;
  const progress = goal.tasks.length > 0 ? Math.round((doneCount / goal.tasks.length) * 100) : 0;

  const toggleMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/goals/${goal.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: `${goal.name} removed from orbit` });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", `/api/goals/${goal.id}/tasks`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setNewTask("");
      setShowAddTask(false);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTaskMutation.mutate(newTask.trim());
    }
  };

  return (
    <div
      className="rounded-[16px] sm:rounded-[18px] p-4 sm:p-6 mb-5 sm:mb-10 last:mb-0 transition-transform duration-[250ms] ease-in-out hover:-translate-y-1"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "inset 0 0 40px rgba(255,255,255,0.02), 0 10px 40px rgba(0,0,0,0.6)",
      }}
      data-testid={`card-goal-${goal.id}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-white/20 hover:text-white/50 disabled:opacity-10 disabled:cursor-default transition-colors bg-transparent p-0"
            style={{ boxShadow: "none", background: "transparent", padding: "0" }}
            data-testid={`button-move-up-${goal.id}`}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="text-white/20 hover:text-white/50 disabled:opacity-10 disabled:cursor-default transition-colors bg-transparent p-0"
            style={{ boxShadow: "none", background: "transparent", padding: "0" }}
            data-testid={`button-move-down-${goal.id}`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <span className="text-lg shrink-0" data-testid={`icon-goal-${goal.id}`}>
          {goal.icon || "🎯"}
        </span>
        <span
          className="font-medium text-white truncate flex-1"
          data-testid={`text-goal-name-${goal.id}`}
        >
          {goal.name}
        </span>
        <span
          className="text-sm text-white/50 font-mono tabular-nums shrink-0"
          data-testid={`text-goal-progress-${goal.id}`}
        >
          {progress}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          data-testid={`button-delete-goal-${goal.id}`}
          className="text-white/30 hover:text-white/60"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {goal.tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 py-1.5 px-2 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.03] group"
            data-testid={`task-${task.id}`}
            onClick={() => toggleMutation.mutate(task.id)}
          >
            <div
              className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
              style={{
                borderColor: task.done ? goal.color : "rgba(255,255,255,0.15)",
                background: task.done ? goal.color : "transparent",
              }}
              data-testid={`checkbox-task-${task.id}`}
            >
              {task.done && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              className={`text-sm flex-1 transition-all ${task.done ? "text-white/30 line-through" : "text-white/70"}`}
              data-testid={`text-task-${task.id}`}
            >
              {task.name}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteTaskMutation.mutate(task.id); }}
              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 transition-opacity"
              data-testid={`button-delete-task-${task.id}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showAddTask ? (
        <div className="flex items-center gap-2 mt-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="New task..."
            autoFocus
            className="flex-1 text-sm rounded-lg px-3 py-2 text-white placeholder-white/30 outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            data-testid={`input-new-task-${goal.id}`}
          />
          <button
            onClick={handleAddTask}
            disabled={!newTask.trim() || addTaskMutation.isPending}
            className="text-sm px-3 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: goal.color,
              color: "white",
              opacity: !newTask.trim() ? 0.5 : 1,
            }}
            data-testid={`button-submit-task-${goal.id}`}
          >
            Add
          </button>
          <button
            onClick={() => { setShowAddTask(false); setNewTask(""); }}
            className="text-white/30 hover:text-white/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center gap-1.5 mt-3 text-xs text-white/25 hover:text-white/50 transition-colors bg-transparent"
          style={{ boxShadow: "none", background: "transparent", padding: "4px 0" }}
          data-testid={`button-add-task-${goal.id}`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      )}

      <div className="flex items-center justify-between mt-3 px-1 gap-1">
        <span className="text-xs text-white/25 capitalize">
          {goal.category}
        </span>
        <span className="text-xs text-white/25">
          {doneCount}/{goal.tasks.length} complete
        </span>
      </div>
    </div>
  );
}
