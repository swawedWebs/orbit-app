import { useQuery } from "@tanstack/react-query";
import type { GoalWithTasks } from "@shared/schema";
import { OrbitCanvas } from "@/components/orbit-canvas";
import { OrbitScore } from "@/components/orbit-score";
import { AddGoalDialog } from "@/components/add-goal-dialog";
import { useAuth } from "@/hooks/use-auth";
import { SpaceMusic } from "@/components/space-music";
import { PlanetSheet } from "@/components/planet-sheet";
import { GoalsSheet } from "@/components/goals-sheet";
import { MenuPanel } from "@/components/menu-panel";
import { TutorialOverlay } from "@/components/tutorial-overlay";
import { DailyPulse } from "@/components/daily-pulse";
import { AskOrbitOverlay } from "@/components/ask-orbit-overlay";
import { TrajectoryOverlay } from "@/components/trajectory-overlay";
import { AddTaskOverlay } from "@/components/add-task-overlay";
import { useState, useEffect, useCallback } from "react";
import type { Goal } from "@shared/schema";

export default function Home() {
  const { logout } = useAuth();
  const { data: goals = [], isLoading } = useQuery<GoalWithTasks[]>({
    queryKey: ["/api/goals"],
  });

  const [canvasW, setCanvasW] = useState(window.innerWidth);
  const [canvasH, setCanvasH] = useState(window.innerHeight);

  useEffect(() => {
    function onResize() {
      setCanvasW(window.innerWidth);
      setCanvasH(window.innerHeight);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [selectedGoal, setSelectedGoal] = useState<GoalWithTasks | null>(null);
  const [showGoalsSheet, setShowGoalsSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showAskOrbit, setShowAskOrbit] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  const handlePlanetClick = useCallback((goal: Goal) => {
    const full = goals.find((g) => g.id === goal.id);
    if (full) setSelectedGoal(full);
  }, [goals]);

  useEffect(() => {
    if (selectedGoal) {
      const updated = goals.find((g) => g.id === selectedGoal.id);
      if (updated) setSelectedGoal(updated);
    }
  }, [goals]);

  const handleGoalClickFromSheet = useCallback((goal: GoalWithTasks) => {
    setShowGoalsSheet(false);
    setSelectedGoal(goal);
  }, []);

  const score = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="w-screen h-screen relative overflow-hidden" style={{ background: "#02050d", color: "#f4f7ff" }}>
      <OrbitCanvas
        goals={goals}
        onGoalClick={handlePlanetClick}
        width={canvasW}
        height={canvasH}
      />

      <div className="hud" data-testid="hud-container">
        <div className="topbar">
          <div className="score-wrap pointer-events-auto">
            <OrbitScore goals={goals} />
          </div>

          <div className="top-actions">
            <SpaceMusic score={score} />
            <button
              className="icon-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Menu"
              data-testid="button-menu"
            >
              ☰
            </button>
          </div>
        </div>

        <div className="center-core-label" data-testid="center-core-label">
          <div className="main">Your Orbit</div>
          <div className="sub">Core System</div>
        </div>

        {!isLoading && goals.length > 0 && !selectedGoal && !showGoalsSheet && (
          <div className="hint-pill" data-testid="text-hint">
            Tap a planet to begin
          </div>
        )}

        {!isLoading && goals.length === 0 && !selectedGoal && (
          <div className="hint-pill pointer-events-auto" data-testid="text-empty-hint" style={{ opacity: 1 }}>
            <span style={{ display: "block", marginBottom: "8px" }}>No goals yet</span>
            <AddGoalDialog />
          </div>
        )}

        <div className="bottom-actions">
          <div className="fab-group">
            <button
              className="fab glass"
              onClick={() => { setSelectedGoal(null); setShowGoalsSheet(true); }}
              data-testid="button-goals-fab"
              aria-label="Goals"
            >
              📋 <span className="hide-sm">Goals</span>
            </button>
          </div>
          <div className="fab-group">
            <button
              className="fab primary"
              onClick={() => setShowAddGoal(true)}
              data-testid="button-add-goal-fab"
              aria-label="Add Goal"
            >
              ＋ <span className="hide-sm">Add Goal</span>
            </button>
          </div>
        </div>
      </div>

      <MenuPanel
        open={showMenu}
        onClose={() => setShowMenu(false)}
        onTutorial={() => { setShowMenu(false); setShowTutorial(true); }}
        onRebuild={() => { setShowMenu(false); setShowAddGoal(true); }}
        onPulse={() => { setShowMenu(false); setShowPulse(true); }}
        onLogout={() => { setShowMenu(false); logout(); }}
      />

      <PlanetSheet
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onAskOrbit={() => setShowAskOrbit(true)}
        onTrajectory={() => setShowTrajectory(true)}
        onAddTask={() => setShowAddTask(true)}
      />

      <GoalsSheet
        open={showGoalsSheet}
        onClose={() => setShowGoalsSheet(false)}
        goals={goals}
        onGoalClick={handleGoalClickFromSheet}
      />

      <TutorialOverlay
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <DailyPulse
        open={showPulse}
        onClose={() => setShowPulse(false)}
        goals={goals}
      />

      <AskOrbitOverlay
        open={showAskOrbit}
        onClose={() => setShowAskOrbit(false)}
        goal={selectedGoal}
      />

      <TrajectoryOverlay
        open={showTrajectory}
        onClose={() => setShowTrajectory(false)}
        goal={selectedGoal}
      />

      <AddTaskOverlay
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        goals={goals}
        selectedGoalId={selectedGoal?.id}
      />

      <AddGoalDialog
        externalOpen={showAddGoal}
        onExternalOpenChange={setShowAddGoal}
        hideTrigger
      />
    </div>
  );
}
