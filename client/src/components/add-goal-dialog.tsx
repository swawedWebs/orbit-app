import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

const ICONS = ["🌿", "📈", "💰", "❤️", "🧠", "💪", "🎨", "🎯", "⭐", "🔥", "🚀", "📚"];

const COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Emerald", value: "#34D399" },
  { label: "Pink", value: "#EC4899" },
  { label: "Violet", value: "#8B5CF6" },
  { label: "Cyan", value: "#22D3EE" },
  { label: "Lavender", value: "#A78BFA" },
];

const CATEGORIES = [
  { label: "Professional", value: "professional" },
  { label: "Financial", value: "financial" },
  { label: "Wellness", value: "wellness" },
  { label: "Social", value: "social" },
  { label: "Growth", value: "growth" },
  { label: "Creative", value: "creative" },
  { label: "General", value: "general" },
];

interface AddGoalDialogProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onSuccess?: () => void;
}

export function AddGoalDialog({ externalOpen, onExternalOpenChange, hideTrigger, onSuccess }: AddGoalDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled && onExternalOpenChange) {
      onExternalOpenChange(v);
    } else {
      setInternalOpen(v);
    }
  };

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [category, setCategory] = useState("general");
  const [color, setColor] = useState("#6366f1");
  const [taskInputs, setTaskInputs] = useState(["", "", ""]);

  const resetForm = () => {
    setName("");
    setIcon("🎯");
    setCategory("general");
    setColor("#6366f1");
    setTaskInputs(["", "", ""]);
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const validTasks = taskInputs.filter((t) => t.trim());
      await apiRequest("POST", "/api/goals", {
        name,
        icon,
        category,
        color,
        tasks: validTasks,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal added to your orbit" });
      resetForm();
      setOpen(false);
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to add goal", variant: "destructive" });
    },
  });

  const updateTask = (index: number, value: string) => {
    const updated = [...taskInputs];
    updated[index] = value;
    setTaskInputs(updated);
  };

  const addTaskInput = () => {
    setTaskInputs([...taskInputs, ""]);
  };

  const removeTaskInput = (index: number) => {
    if (taskInputs.length > 1) {
      setTaskInputs(taskInputs.filter((_, i) => i !== index));
    }
  };

  const validTasks = taskInputs.filter((t) => t.trim());
  const canSubmit = name.trim() && validTasks.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="orbit-btn" data-testid="button-add-goal">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new goal to your orbit</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Goal Name</label>
            <Input
              placeholder="e.g. Health, Career, Learning..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-goal-name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2" data-testid="icon-picker">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all ${icon === ic ? "bg-white/20 ring-2 ring-white/40 scale-110" : "bg-white/5 hover:bg-white/10"}`}
                  data-testid={`button-icon-${ic}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tasks</label>
            <div className="space-y-2">
              {taskInputs.map((task, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Task ${i + 1}...`}
                    value={task}
                    onChange={(e) => updateTask(i, e.target.value)}
                    data-testid={`input-task-${i}`}
                  />
                  {taskInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTaskInput(i)}
                      className="text-white/30 hover:text-white/50 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTaskInput}
              className="flex items-center gap-1 mt-2 text-xs text-white/40 hover:text-white/60 transition-colors bg-transparent"
              style={{ boxShadow: "none", background: "transparent", padding: "4px 0" }}
              data-testid="button-add-task-input"
            >
              <Plus className="w-3.5 h-3.5" />
              Add another task
            </button>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-goal-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className="w-8 h-8 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c.value,
                    borderColor: color === c.value ? "white" : "transparent",
                    transform: color === c.value ? "scale(1.15)" : "scale(1)",
                    boxShadow: "none",
                    background: c.value,
                  }}
                  data-testid={`color-${c.label.toLowerCase()}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={() => mutation.mutate()}
            className="orbit-btn w-full"
            disabled={!canSubmit || mutation.isPending}
            data-testid="button-submit-goal"
          >
            {mutation.isPending ? "Adding..." : "Add to Orbit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
