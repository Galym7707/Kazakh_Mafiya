import React from "react";

export default function MorningNews({ state }) {
  return (
    <div className="panel morning-panel">
      <div className="sunrise" />
      <h2 className="morning-title">🌅 Таң атты</h2>
      <p className="news">{state.morning_news}</p>
      {state.me?.clue && <div className="clue-box">📜 Өсек: {state.me.clue}</div>}
      <p className="hint">Талқылау жақында басталады…</p>
    </div>
  );
}
