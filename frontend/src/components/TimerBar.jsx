import React from "react";

export default function TimerBar({ timeLeft, duration, label }) {
  if (timeLeft === null || timeLeft === undefined) return null;
  const total = duration || Math.max(timeLeft, 1);
  const pct = Math.max(0, Math.min(100, (timeLeft / total) * 100));
  const warn = timeLeft <= 10;
  return (
    <div className={"timerbar " + (warn ? "warn" : "")}>
      <div className="timerbar-track">
        <div className="timerbar-fill" style={{ width: pct + "%" }} />
      </div>
      <div className="timerbar-num">{label ? label + " · " : ""}{timeLeft}s</div>
    </div>
  );
}
