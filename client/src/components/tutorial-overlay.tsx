import { useState } from "react";

const tutorialSteps = [
  {
    title: "Welcome to Orbit",
    text: "Orbit turns your goals into a quiet solar system. Each planet represents a part of your life.",
  },
  {
    title: "Tap a planet",
    text: "When you tap a planet, Orbit brings you closer and opens its goals. You can check tasks and reflect there.",
  },
  {
    title: "Progress changes the universe",
    text: "As tasks are completed, planets move closer to your core and your Orbit Score becomes more balanced.",
  },
  {
    title: "Orbit is your guide",
    text: "Use Orbit for calm reflections, trajectory questions, and small next steps. You can skip this anytime.",
  },
];

interface TutorialOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function TutorialOverlay({ open, onClose }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      setStep(0);
      onClose();
    }
  };

  const handleSkip = () => {
    setStep(0);
    onClose();
  };

  const current = tutorialSteps[step];

  return (
    <div
      className={`tutorial ${open ? "show" : ""}`}
      data-testid="tutorial-overlay"
    >
      <div className="glass" style={{ width: "min(540px, 100%)", padding: "22px" }}>
        <div className="eyebrow">How Orbit Works</div>
        <h2
          style={{ margin: 0, fontSize: "28px", letterSpacing: "-.03em" }}
          data-testid="text-tutorial-title"
        >
          {current.title}
        </h2>
        <p
          style={{
            margin: "14px 0 0",
            color: "rgba(255,255,255,.62)",
            lineHeight: 1.65,
            fontSize: "16px",
          }}
          data-testid="text-tutorial-text"
        >
          {current.text}
        </p>

        <div className="dots" style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
          {tutorialSteps.map((_, i) => (
            <div
              key={i}
              className={`dot ${i === step ? "active" : ""}`}
              data-testid={`dot-tutorial-${i}`}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
          <button
            className="btn-primary"
            onClick={handleNext}
            data-testid="button-tutorial-next"
          >
            {step === tutorialSteps.length - 1 ? "Enter Orbit" : "Next"}
          </button>
          <button
            className="btn-ghost"
            onClick={handleSkip}
            data-testid="button-tutorial-skip"
          >
            Skip Tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
