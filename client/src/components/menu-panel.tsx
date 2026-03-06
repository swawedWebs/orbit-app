import { useEffect, useRef } from "react";

interface MenuPanelProps {
  open: boolean;
  onClose: () => void;
  onTutorial: () => void;
  onRebuild: () => void;
  onPulse: () => void;
  onLogout: () => void;
}

export function MenuPanel({ open, onClose, onTutorial, onRebuild, onPulse, onLogout }: MenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);

  return (
    <div
      ref={panelRef}
      className={`menu-panel ${open ? "show" : ""}`}
      data-testid="menu-panel"
    >
      <div className="glass" style={{ padding: "14px", borderRadius: "24px" }}>
        <h3 style={{ margin: "2px 0 12px", fontSize: "16px", letterSpacing: "-0.02em" }}>
          Menu
        </h3>
        <div className="menu-list">
          <button
            onClick={() => { onTutorial(); onClose(); }}
            data-testid="menu-item-tutorial"
          >
            How Orbit Works
          </button>
          <button
            onClick={() => { onRebuild(); onClose(); }}
            data-testid="menu-item-rebuild"
          >
            Build / Rebuild My Orbit
          </button>
          <button
            onClick={() => { onPulse(); onClose(); }}
            data-testid="menu-item-pulse"
          >
            Daily Pulse
          </button>
          <button
            onClick={() => { onLogout(); onClose(); }}
            data-testid="menu-item-signout"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
