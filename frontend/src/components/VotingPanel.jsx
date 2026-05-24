import React from "react";

export default function VotingPanel({ state, selectedId, onConfirm, onSkip }) {
  const me = state.me;
  if (!me || !me.alive) {
    return (
      <div className="panel vote-panel">
        <p className="night-sleep">Сіз ойыннан шықтыңыз — дауыс бере алмайсыз.</p>
        <p className="hint">Дауыс бергендер: {(state.voted_names || []).join(", ") || "әзірге жоқ"}</p>
      </div>
    );
  }
  const target = state.players.find((p) => p.id === selectedId);
  return (
    <div className="panel vote-panel">
      <h3 className="panel-title">🗳️ Кім күдікті?</h3>
      <p className="prompt">Үстелден ойыншыны таңдап, дауысты растаңыз.</p>
      <div className="vote-selected">
        {target ? <>Таңдалды: <b>{target.name}</b></> : "Әзірге ешкім таңдалмады"}
      </div>
      <div className="vote-actions">
        <button className="btn btn-danger big" disabled={!selectedId} onClick={onConfirm}>
          Дауыс беру
        </button>
        <button className="btn" onClick={onSkip}>Дауыс бермеу</button>
      </div>
      <p className="hint">
        Дауыс бергендер: {(state.voted_names || []).join(", ") || "әзірге жоқ"}
      </p>
    </div>
  );
}
