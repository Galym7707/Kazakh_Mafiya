import React, { useState } from "react";
import RoleGuide from "./RoleGuide.jsx";

function Section({ title, icon, children, open, onToggle }) {
  return (
    <div className={"sb-section " + (open ? "open" : "")}>
      <button className="sb-head" onClick={onToggle}>
        <span>{icon} {title}</span>
        <span className="sb-chev">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="sb-body">{children}</div>}
    </div>
  );
}

export default function Sidebar({ state, session, open, onClose, actions }) {
  const [section, setSection] = useState("room");
  const toggle = (s) => setSection(section === s ? "" : s);
  const isHost = state.is_host;
  const isLobby = state.phase === "lobby";
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/?room=${state.code}`;
  function copy() {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <div className={"sb-backdrop " + (open ? "show" : "")} onClick={onClose} />
      <aside className={"sidebar " + (open ? "open" : "")}>
        <div className="sb-brand">
          <span className="sb-title">Ауыл Mafia</span>
          <span className="sb-sub">Түнгі Құпия</span>
          <button className="sb-x" onClick={onClose}>✕</button>
        </div>

        <Section title="Бөлме" icon="🏠" open={section === "room"} onToggle={() => toggle("room")}>
          <div className="sb-room-code">{state.code}</div>
          <button className="btn small" onClick={copy}>
            {copied ? "Көшірілді!" : "Сілтемені көшіру"}
          </button>
          <div className="sb-meta">
            <span>Ойыншылар: {state.player_count}/{state.max_players}</span>
            <span>Фаза: {state.phase_label}</span>
            {isHost && <span className="mini-badge host">Сіз — хостсыз</span>}
          </div>
        </Section>

        <Section title="Ойыншылар" icon="👥" open={section === "players"} onToggle={() => toggle("players")}>
          <ul className="sb-players">
            {state.players.map((p) => (
              <li key={p.id} className={p.alive ? "" : "dead"}>
                <span className="sb-pn">
                  {state.phase !== "game_over" && <span className="unknown-ic">{p.alive ? "🎭" : "💤"}</span>}
                  {p.name}{p.is_me ? " (сіз)" : ""}
                </span>
                <span className="sb-pt">
                  {p.is_host && <span className="mini-badge host">H</span>}
                  {p.is_bot && <span className="mini-badge bot">BOT</span>}
                  {(state.phase === "game_over" || !p.alive) && p.role_name && (
                    <span className="mini-badge role">{p.role_name}</span>
                  )}
                  {!p.alive && <span className="mini-badge dead">✖</span>}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Ережелер" icon="📖" open={section === "rules"} onToggle={() => toggle("rules")}>
          <ul className="sb-rules">
            <li>Түнде рөлдер әрекет етеді.</li>
            <li>Күндіз ауыл талқылайды.</li>
            <li>Дауыс беру арқылы күдікті ойыннан шығады.</li>
            <li>Ауыл барлық Хуторлықтарды тапса жеңеді.</li>
            <li>Хуторлықтар ауылмен теңессе жеңеді.</li>
          </ul>
        </Section>

        <Section title="Рөлдер" icon="🎴" open={section === "roles"} onToggle={() => toggle("roles")}>
          <RoleGuide />
        </Section>

        <Section title="Басқару" icon="⚙️" open={section === "ctrl"} onToggle={() => toggle("ctrl")}>
          {isHost && isLobby && (
            <>
              <button className="btn small" onClick={actions.addBot}
                disabled={state.player_count >= state.max_players}>🤖 Бот қосу</button>
              <button className="btn btn-primary small" onClick={actions.start}
                disabled={state.player_count < state.min_players}>Ойынды бастау</button>
            </>
          )}
          {isHost && !isLobby && (
            <button className="btn small" onClick={actions.reset}>Ойынды қайта бастау</button>
          )}
          <button className="btn small" onClick={actions.leave}>Шығу</button>
        </Section>
      </aside>
    </>
  );
}
