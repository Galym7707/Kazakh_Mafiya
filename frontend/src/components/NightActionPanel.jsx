import React, { useState } from "react";

const LABELS = {
  inspect: "Кімді тексересіз?",
  protect: "Кімді қорғайсыз?",
  swap: "Қай екі ойыншыны ауыстырасыз?",
  hutor_target: "Кімді таңдайсыз?",
  block: "Кімнің әрекетін бұғаттайсыз?",
};

export default function NightActionPanel({ state, onSubmit }) {
  const me = state.me;
  const [target, setTarget] = useState(null);
  const [target2, setTarget2] = useState(null);

  if (!me || !me.alive) {
    return (
      <div className="panel night-panel">
        <p className="night-sleep">😴 Сіз ойыннан шықтыңыз. Таңды күтіңіз…</p>
        <NightProgress state={state} />
      </div>
    );
  }

  const action = me.night_action;
  const isBanditTarget = me.role === "bandit" && me.can_target;
  const effective = isBanditTarget ? "hutor_target" : action;

  if (!effective) {
    return (
      <div className="panel night-panel">
        <p className="night-sleep">🌙 Сіз түнде күтесіз. Ауыл ұйқыда…</p>
        {me.clue && <div className="clue-box">📜 {me.clue}</div>}
        <NightProgress state={state} />
      </div>
    );
  }

  const alive = state.players.filter((p) => p.alive);

  function submit() {
    if (!target) return;
    if (effective === "swap" && !target2) return;
    onSubmit(effective, target, target2);
  }

  if (me.action_submitted) {
    return (
      <div className="panel night-panel">
        <div className="submitted-box">
          ✅ Әрекет қабылданды. Басқаларды күтіңіз…
          {me.inspection && (
            <div className="inspect-result">
              🔍 {me.inspection.target_name
                ? `${me.inspection.target_name} — ${me.inspection.result}`
                : me.inspection.result}
            </div>
          )}
        </div>
        <NightProgress state={state} />
      </div>
    );
  }

  return (
    <div className="panel night-panel">
      <h3 className="panel-title">{me.role_name} — түнгі әрекет</h3>
      <p className="ability-line">{me.ability}</p>
      {me.teammates && me.teammates.length > 0 && (
        <div className="teammates small">🤝 Серіктестер: {me.teammates.join(", ")}</div>
      )}

      <p className="prompt">{LABELS[effective]}</p>
      <div className="target-grid">
        {alive.map((p) => {
          const selfBlock = p.is_me && effective !== "protect" && effective !== "swap";
          return (
            <button
              key={p.id}
              className={"target-btn " + (target === p.id ? "sel" : "") + (target2 === p.id ? " sel2" : "")}
              disabled={selfBlock}
              onClick={() => setTarget(p.id)}
            >
              {p.name}{p.is_me ? " (сіз)" : ""}
            </button>
          );
        })}
      </div>

      {effective === "swap" && (
        <>
          <p className="prompt">Екінші ойыншы:</p>
          <div className="target-grid">
            {alive.map((p) => (
              <button
                key={p.id}
                className={"target-btn " + (target2 === p.id ? "sel2" : "")}
                disabled={p.id === target}
                onClick={() => setTarget2(p.id)}
              >
                {p.name}{p.is_me ? " (сіз)" : ""}
              </button>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-primary big" onClick={submit}>Әрекетті растау</button>
      <NightProgress state={state} />
    </div>
  );
}

function NightProgress({ state }) {
  const np = state.night_progress;
  if (!np) return null;
  return <div className="night-progress">Түнгі әрекеттер: {np.done} / {np.need}</div>;
}
