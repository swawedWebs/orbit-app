import { useState, useEffect } from "react";
import type { Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface PredictFutureProps {
  goals: Goal[];
}

interface Prediction {
  futureIncome: number;
  netWorth: number;
  score: number;
  message: string;
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString();
}

function generatePrediction(goals: Goal[]): Prediction | null {
  if (goals.length === 0) return null;

  const score = Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length);
  const strongest = [...goals].sort((a, b) => b.progress - a.progress)[0];
  const weakest = [...goals].sort((a, b) => a.progress - b.progress)[0];

  const futureIncome = Math.round(40000 + score * 600);
  const netWorth = futureIncome * 10;

  let message: string;

  if (score >= 80) {
    message = `Your orbit is blazing. ${strongest.name} at ${strongest.progress}% is pulling everything into alignment. Keep this momentum — you're on a trajectory most people only dream of.`;
  } else if (score >= 60) {
    message = `Solid trajectory. ${strongest.name} (${strongest.progress}%) is your anchor. Focus on bringing ${weakest.name} (${weakest.progress}%) closer to center and your whole system levels up.`;
  } else if (score >= 40) {
    message = `You're at a turning point. ${strongest.name} at ${strongest.progress}% proves you can do this. Start closing the gap on ${weakest.name} (${weakest.progress}%) — small moves will transform everything.`;
  } else {
    message = `Your orbit is wide, but every journey starts somewhere. ${strongest.name} (${strongest.progress}%) is your brightest planet — focus there first and watch the momentum ripple outward.`;
  }

  return { futureIncome, netWorth, score, message };
}

export function PredictFuture({ goals }: PredictFutureProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (hasRevealed && goals.length > 0) {
      setPrediction(generatePrediction(goals));
    }
  }, [goals, hasRevealed]);

  const handlePredict = () => {
    setIsRevealing(true);
    setPrediction(null);

    setTimeout(() => {
      setPrediction(generatePrediction(goals));
      setIsRevealing(false);
      setHasRevealed(true);
    }, 1200);
  };

  if (!hasRevealed && !isRevealing) {
    return (
      <div className="text-center" data-testid="text-prediction-result">
        <h3 className="text-white font-semibold mb-2">Your trajectory</h3>
        <p className="text-white/40 text-sm mb-4">Adjust goals to see predictions.</p>
        <Button
          onClick={handlePredict}
          disabled={goals.length === 0}
          className="orbit-btn gap-2"
          data-testid="button-predict-future"
        >
          <Sparkles className="w-4 h-4" />
          Predict My Future
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="text-prediction-result">
      <h3 className="text-white font-semibold mb-3 text-center">Your trajectory</h3>
      {isRevealing ? (
        <div className="flex items-center justify-center gap-2 text-white/40 py-4">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="animate-pulse">Consulting the cosmos...</span>
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
      ) : prediction ? (
        <div className="space-y-3">
          <p className="text-sm text-white/60">
            Age 30 income: <strong className="text-white" data-testid="text-future-income">{formatCurrency(prediction.futureIncome)}</strong>
          </p>
          <p className="text-sm text-white/60">
            Age 40 net worth: <strong className="text-white" data-testid="text-future-networth">{formatCurrency(prediction.netWorth)}</strong>
          </p>
          <p className="text-white/50 leading-relaxed text-sm mt-2">
            {prediction.message}
          </p>
        </div>
      ) : null}
    </div>
  );
}
