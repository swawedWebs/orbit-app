import { useState, useEffect, useRef } from "react";
import type { Goal } from "@shared/schema";

interface OrbitScoreProps {
  goals: Goal[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#34D399";
  if (score >= 60) return "#6366F1";
  if (score >= 40) return "#F59E0B";
  return "#ef4444";
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getOrbitSummary(score: number): string {
  if (score >= 80) return "Aligned system";
  if (score >= 55) return "Steady drift inward";
  if (score >= 30) return "Shifting quietly";
  return "Calm system";
}

function useAnimatedValue(target: number, duration = 600): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = current;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(startRef.current + (target - startRef.current) * eased);
      setCurrent(value);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}

export function OrbitScore({ goals }: OrbitScoreProps) {
  const targetScore = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const score = useAnimatedValue(targetScore);
  const scoreColor = getScoreColor(score);
  const degrees = (score / 100) * 360;
  const summary = getOrbitSummary(score);

  return (
    <div className="score-wrap" data-testid="orbit-score-wrap">
      <div
        className="relative w-[56px] h-[56px] sm:w-[76px] sm:h-[76px] md:w-[86px] md:h-[86px] rounded-full grid place-items-center shrink-0 glass"
        data-testid="orbit-score-container"
        style={{
          background: `
            radial-gradient(circle at center, rgba(11,16,28,0.98) 57%, transparent 58%),
            conic-gradient(from 270deg, ${scoreColor} 0deg, ${hexToRgba(scoreColor, 0.6)} ${degrees}deg, rgba(255,255,255,0.08) ${degrees}deg 360deg)
          `,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: `0 0 30px ${hexToRgba(scoreColor, 0.18)}, inset 0 0 20px rgba(255,255,255,0.03)`,
          borderRadius: "50%",
        }}
      >
        <div className="text-center" style={{ transform: "translateY(-1px)" }}>
          <div
            className="text-lg sm:text-2xl md:text-[28px] font-extrabold leading-none text-white tabular-nums"
            data-testid="text-orbit-score"
          >
            {score}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-white/50 uppercase tracking-[0.16em]">
            Score
          </div>
        </div>
      </div>

      <div className="score-meta glass" data-testid="orbit-score-meta">
        <div className="meta-title" data-testid="text-orbit-label">Orbit</div>
        <div className="meta-sub" data-testid="text-orbit-summary">{summary}</div>
      </div>
    </div>
  );
}
