import React from "react";

const ICONS = {
  lobby: "🛋️",
  role_reveal: "🎴",
  night: "🌙",
  morning: "🌅",
  discussion: "💬",
  voting: "🗳️",
  day_result: "📜",
  game_over: "🏆",
};

export default function PhaseBanner({ phase, label, dayNumber }) {
  return (
    <div className="phase-banner" key={phase}>
      <span className="phase-icon">{ICONS[phase] || "•"}</span>
      <span className="phase-text">{label}</span>
      {dayNumber > 0 && <span className="phase-day-chip">Күн {dayNumber}</span>}
    </div>
  );
}
