"use client";

import React, { useState, useEffect } from "react";
import { getMode, setMode, toggleMode, canSwitchMode, getModeInfo, type PlatformMode } from "@/services/mode";

interface ModeToggleProps {
  userRole: string;
}

export default function ModeToggle({ userRole }: ModeToggleProps) {
  const [currentMode, setCurrentMode] = useState<PlatformMode>("business");
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setCurrentMode(getMode());

    // Listen for mode changes
    const handleModeChange = (event: CustomEvent) => {
      setCurrentMode(event.detail.mode);
    };

    window.addEventListener("mode-changed", handleModeChange as EventListener);
    return () => {
      window.removeEventListener("mode-changed", handleModeChange as EventListener);
    };
  }, []);

  // Only show to admins
  if (!canSwitchMode(userRole)) {
    return null;
  }

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const newMode = toggleMode();
      setCurrentMode(newMode);

      // Reload page to apply mode changes
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Failed to toggle mode:", error);
      setIsToggling(false);
    }
  };

  const modeInfo = getModeInfo(currentMode);

  return (
    <div className="mode-toggle">
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={`mode-toggle-button ${currentMode}`}
        title={modeInfo.description}
      >
        <span className="mode-icon">{modeInfo.icon}</span>
        <span className="mode-label">{modeInfo.label}</span>
        <span className="toggle-arrow">⇄</span>
      </button>

      <style jsx>{`
        .mode-toggle {
          display: flex;
          align-items: center;
        }

        .mode-toggle-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 2px solid;
          border-radius: 20px;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .mode-toggle-button.builder {
          border-color: #ff6b35;
          color: #ff6b35;
        }

        .mode-toggle-button.builder:hover {
          background: #ff6b35;
          color: white;
        }

        .mode-toggle-button.business {
          border-color: #00d4ff;
          color: #00d4ff;
        }

        .mode-toggle-button.business:hover {
          background: #00d4ff;
          color: white;
        }

        .mode-toggle-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mode-icon {
          font-size: 16px;
        }

        .mode-label {
          font-size: 13px;
        }

        .toggle-arrow {
          font-size: 16px;
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .mode-label {
            display: none;
          }

          .mode-toggle-button {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
}
