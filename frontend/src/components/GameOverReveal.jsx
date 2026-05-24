import React, { useEffect, useMemo, useState } from "react";
import RoleImage from "./RoleImage.jsx";
import { TEAM_CLASS } from "../roles.js";
import { computeAwards, recordGameForMe, readMyStats } from "../awards.js";

function Confetti({ show }) {
  if (!show) return null;
  const pieces = Array.from({ length: 80 });
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: Math.random() * 100 + "%",
            background: ["#f2c14e", "#ffd98a", "#5fc98b", "#c96a7a", "#b18ad6"][i % 5],
            animationDelay: Math.random() * 0.8 + "s",
            animationDuration: 2.5 + Math.random() * 2.5 + "s",
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function GameOverReveal({ state, isHost, onAgain, onLeave, session }) {
  const me = state.players.find((p) => p.is_me);
  const myAwards = me ? computeAwards(me, state) : [];
  const iWon = !!me && me.team === state.winner;

  // Тек бір рет жазу
  const [recorded, setRecorded] = useState(null);
  useEffect(() => {
    if (state.phase === "game_over") {
      const r = recordGameForMe(state, session);
      if (r) setRecorded(r);
    }
  }, [state.code, state.winner]);

  const stats = useMemo(() => (session?.name ? readMyStats(session.name) : null), [recorded, session]);

  const winners = state.players.filter((p) => p.team === state.winner);
  const losers = state.players.filter((p) => p.team !== state.winner);

  return (
    <div className="panel gameover-panel">
      <Confetti show={iWon} />
      <h2 className="dramatic">Ойын аяқталды</h2>
      <p className="dramatic-sub">Ауылдың шындығы ашылды.</p>
      <div className={"winner-banner " + (TEAM_CLASS[state.winner] || "")}>
        🏆 {state.winner} жеңді
      </div>
      <p className="news">{state.winner_text}</p>

      {/* Жеке марапат */}
      {me && (
        <div className={"my-awards-panel " + (iWon ? "won" : "lost")}>
          <div className="my-awards-head">
            {iWon ? (
              <>
                <span className="my-awards-title">🎉 Сіз жеңдіңіз!</span>
                <span className="my-awards-sub">Команда — {me.team}</span>
              </>
            ) : (
              <>
                <span className="my-awards-title">Сіз жеңілдіңіз</span>
                <span className="my-awards-sub">Команда — {me.team}</span>
              </>
            )}
          </div>
          <div className="my-awards-list">
            {myAwards.map((a) => (
              <span key={a.id} className={"award-badge " + a.color}>
                <span className="award-icon">{a.icon}</span>
                <span>{a.title}</span>
              </span>
            ))}
          </div>
          {stats && (
            <div className="my-stats">
              <div className="stat-cell">
                <span className="stat-num">{stats.games}</span>
                <span className="stat-label">Ойнаған</span>
              </div>
              <div className="stat-cell">
                <span className="stat-num">{stats.wins}</span>
                <span className="stat-label">Жеңіс</span>
              </div>
              <div className="stat-cell">
                <span className="stat-num">
                  {stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0}%
                </span>
                <span className="stat-label">Жеңіс %</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Жеңімпаздар тобы */}
      <h3 className="reveal-title">🏆 Жеңімпаздар</h3>
      <div className="final-reveal-grid reveal-list">
        {winners.map((p, i) => (
          <PlayerFinalCard key={p.id} p={p} state={state} delay={i} winner />
        ))}
      </div>

      {losers.length > 0 && (
        <>
          <h3 className="reveal-title quiet">Басқа ойыншылар</h3>
          <div className="final-reveal-grid reveal-list">
            {losers.map((p, i) => (
              <PlayerFinalCard key={p.id} p={p} state={state} delay={i} />
            ))}
          </div>
        </>
      )}

      {isHost ? (
        <button className="btn btn-primary big" onClick={onAgain}>Қайта ойнау</button>
      ) : (
        <p className="hint">Хост қайта бастауын күтіңіз…</p>
      )}
      <button className="btn" onClick={onLeave}>Басты бетке</button>
    </div>
  );
}

function PlayerFinalCard({ p, state, delay, winner }) {
  const awards = computeAwards(p, state);
  const topAward = awards[0];
  return (
    <article
      className={
        "mafia-card final-reveal-card " +
        (p.alive ? "" : "dead") +
        " flip-in" +
        (winner ? " is-winner" : "")
      }
      style={{ animationDelay: delay * 0.08 + "s" }}
    >
      {winner && topAward && (
        <div className="winner-medal" title={topAward.title}>
          <span>{topAward.icon}</span>
        </div>
      )}
      <div className="card-image-frame final-card-image">
        <RoleImage roleKey={p.role} size={null} fit="contain" />
      </div>
      <div className="reveal-info">
        <span className="p-name card-player-name">
          {p.name} {p.is_bot && <span className="mini-badge bot">BOT</span>}
        </span>
        <span className="reveal-role card-role-name">{p.role_name}</span>
        <span className={"card-team-badge " + (TEAM_CLASS[p.team] || "")}>{p.team}</span>
      </div>
      {awards.length > 0 && (
        <div className="final-awards-row">
          {awards.map((a) => (
            <span key={a.id} className={"award-mini " + a.color} title={a.title}>
              {a.icon}
            </span>
          ))}
        </div>
      )}
      <span className={"card-status-badge mini-badge " + (p.alive ? "alive-b" : "dead")}>
        {p.alive ? "Тірі" : "Шықты"}
      </span>
    </article>
  );
}
