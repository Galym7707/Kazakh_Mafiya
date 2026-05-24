import React, { useEffect, useRef, useState } from "react";

const QUICK = ["Күдікті", "Дәлел бар ма?", "Мен сенбеймін", "Таза сияқты", "Тым тыныш отыр"];

export default function ChatPanel({ state, session, onSend }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const me = state.me;
  const canChat = !!(me && me.alive) && state.chat_enabled;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chat]);

  function send(t) {
    const msg = (t ?? text).trim();
    if (!msg) return;
    onSend(msg);
    setText("");
  }

  return (
    <div className="chat-panel">
      {state.current_speaker_name && (
        <div className="speaking-bar">
          🎤 Қазір сөйлейтін ойыншы: <b>{state.current_speaker_name}</b>
          {state.speaking_turn_end != null && (
            <span className="speak-secs">{state.speaking_turn_end}s</span>
          )}
        </div>
      )}
      <div className="chat-box">
        {(state.chat || []).length === 0 && (
          <div className="chat-empty">Талқылау басталды. Кім күдікті?</div>
        )}
        {(state.chat || []).map((m, i) => (
          <div key={i} className="chat-msg">
            <span className="chat-name">{m.name}:</span> {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {canChat ? (
        <>
          <div className="quick-msgs">
            {QUICK.map((q) => (
              <button key={q} className="chip-btn" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={text}
              maxLength={180}
              placeholder="Хабар жазыңыз…"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn btn-primary chat-send" onClick={() => send()}>Жіберу</button>
          </div>
        </>
      ) : (
        <div className="chat-locked">
          {me && !me.alive
            ? "Сіз ойыннан шықтыңыз — тек оқи аласыз."
            : "Қазір жазуға болмайды."}
        </div>
      )}
    </div>
  );
}
