import React from "react";
import RoleImage from "./RoleImage.jsx";
import { TEAM_CLASS } from "../roles.js";

export default function GameOverReveal({ state, isHost, onAgain, onLeave }) {
  return (
    <div className="panel gameover-panel">
      <h2 className="dramatic">Ойын аяқталды</h2>
      <p className="dramatic-sub">Ауылдың шындығы ашылды.</p>
      <div className={"winner-banner " + (TEAM_CLASS[state.winner] || "")}>
        🏆 {state.winner}
      </div>
      <p className="news">{state.winner_text}</p>

      <h3 className="reveal-title">Барлық рөлдер</h3>
      <ul className="reveal-list">
        {state.players.map((p, i) => (
          <li key={p.id} className={(p.alive ? "" : "dead") + " flip-in"} style={{ animationDelay: i * 0.08 + "s" }}>
            <RoleImage roleKey={p.role} size={46} round />
            <div className="reveal-info">
              <span className="p-name">
                {p.name} {p.is_bot && <span className="mini-badge bot">BOT</span>}
              </span>
              <span className="reveal-role">
                {p.role_name} · <span className={TEAM_CLASS[p.team]}>{p.team}</span>
              </span>
            </div>
            <span className={"mini-badge " + (p.alive ? "alive-b" : "dead")}>
              {p.alive ? "Тірі" : "Шықты"}
            </span>
          </li>
        ))}
      </ul>

      {isHost ? (
        <button className="btn btn-primary big" onClick={onAgain}>Қайта ойнау</button>
      ) : (
        <p className="hint">Хост қайта бастауын күтіңіз…</p>
      )}
      <button className="btn" onClick={onLeave}>Басты бетке</button>
    </div>
  );
}
