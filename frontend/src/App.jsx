import React, { useEffect, useRef, useState, useCallback } from "react";
import { api } from "./api.js";
import RoleImage from "./components/RoleImage.jsx";

const LS_KEY = "auyl_mafia_session";

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || null;
  } catch {
    return null;
  }
}
function saveSession(s) {
  if (s) localStorage.setItem(LS_KEY, JSON.stringify(s));
  else localStorage.removeItem(LS_KEY);
}

const TEAM_CLASS = {
  Ауыл: "team-auyl",
  Хуторлықтар: "team-hutor",
  Бейтарап: "team-neutral",
};

export default function App() {
  const [session, setSession] = useState(loadSession());
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  const codeFromUrl = new URLSearchParams(window.location.search).get("room");

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const data = await api.getState(session.code, session.playerId);
      setState(data.state);
      setError("");
    } catch (e) {
      setError(e.message);
      if (e.message.includes("Бөлме табылмады")) {
        saveSession(null);
        setSession(null);
        setState(null);
      }
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    refresh();
    pollRef.current = setInterval(refresh, 1500);
    return () => clearInterval(pollRef.current);
  }, [session, refresh]);

  function enterRoom(code, playerId, name, st) {
    const s = { code, playerId, name };
    saveSession(s);
    setSession(s);
    if (st) setState(st);
  }

  function leave() {
    saveSession(null);
    setSession(null);
    setState(null);
    window.history.replaceState({}, "", "/");
  }

  if (!session || !state) {
    return (
      <Shell>
        <Home
          onEnter={enterRoom}
          presetCode={codeFromUrl}
          setError={setError}
          error={error}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <GameRoom
        state={state}
        session={session}
        refresh={refresh}
        leave={leave}
        error={error}
        setError={setError}
      />
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="app">
      <div className="ornament-top" />
      <header className="topbar">
        <div className="brand">
          <span className="brand-title">Ауыл Mafia</span>
          <span className="brand-sub">Түнгі Құпия</span>
        </div>
      </header>
      <main className="content">{children}</main>
      <div className="ornament-bottom" />
    </div>
  );
}

// ---------------- Home ----------------
function Home({ onEnter, presetCode, setError, error }) {
  const [name, setName] = useState(localStorage.getItem("auyl_name") || "");
  const [code, setCode] = useState(presetCode || "");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return setError("Атыңызды жазыңыз.");
    setBusy(true);
    try {
      localStorage.setItem("auyl_name", name.trim());
      const d = await api.createRoom(name.trim());
      window.history.replaceState({}, "", `/?room=${d.room_code}`);
      onEnter(d.room_code, d.player_id, name.trim(), d.state);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    if (!name.trim()) return setError("Атыңызды жазыңыз.");
    if (!code.trim()) return setError("Бөлме кодын жазыңыз.");
    setBusy(true);
    try {
      localStorage.setItem("auyl_name", name.trim());
      const d = await api.joinRoom(code.trim().toUpperCase(), name.trim());
      window.history.replaceState({}, "", `/?room=${d.room_code}`);
      onEnter(d.room_code, d.player_id, name.trim(), d.state);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card home">
      <div className="hero">
        <div className="moon">🌙</div>
        <h1>Ауыл Mafia</h1>
        <p className="tagline">Түнгі Құпия — күдік, блеф, дауыс.</p>
      </div>
      <p className="home-desc">
        Ауыл түнде тыныш ұйықтап жатыр, бірақ Хуторлықтар оянды. Күндіз талқыла,
        дауыс бер, шындықты тап. Достарыңды шақыр немесе бот қос.
      </p>

      <label className="field">
        <span>Атыңыз</span>
        <input
          value={name}
          maxLength={20}
          placeholder="Мысалы: Айдос"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <button className="btn btn-primary big" disabled={busy} onClick={create}>
        Бөлме құру
      </button>

      <div className="divider"><span>немесе</span></div>

      <label className="field">
        <span>Бөлме коды</span>
        <input
          value={code}
          maxLength={5}
          placeholder="ABCDE"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </label>
      <button className="btn big" disabled={busy} onClick={join}>
        Бөлмеге кіру
      </button>

      {error && <div className="error-banner">{error}</div>}
      <p className="footer-note">Кемінде 4 ойыншы · ұсынылады 5–8 · макс 10</p>
    </div>
  );
}

// ---------------- Game Room router ----------------
function GameRoom({ state, session, refresh, leave, error, setError }) {
  const phase = state.phase;
  return (
    <div className="room">
      <PhaseBar state={state} />
      {error && <div className="error-banner">{error}</div>}

      {phase === "lobby" && (
        <Lobby state={state} session={session} refresh={refresh} setError={setError} />
      )}
      {phase === "role_reveal" && (
        <RoleReveal state={state} session={session} setError={setError} />
      )}
      {phase === "night" && (
        <Night state={state} session={session} refresh={refresh} setError={setError} />
      )}
      {phase === "morning" && <Morning state={state} session={session} />}
      {phase === "discussion" && (
        <Discussion state={state} session={session} refresh={refresh} setError={setError} />
      )}
      {phase === "voting" && (
        <Voting state={state} session={session} refresh={refresh} setError={setError} />
      )}
      {phase === "day_result" && <DayResult state={state} session={session} setError={setError} />}
      {phase === "game_over" && (
        <GameOver state={state} session={session} setError={setError} leave={leave} />
      )}

      <button className="btn link-btn" onClick={leave}>Шығу</button>
    </div>
  );
}

function PhaseBar({ state }) {
  const t = state.time_left;
  const showTimer = t !== null && t !== undefined && state.phase !== "lobby" && state.phase !== "game_over";
  return (
    <div className="phasebar">
      <div className="phase-info">
        <span className="phase-label">{state.phase_label}</span>
        {state.day_number > 0 && <span className="day-chip">Күн {state.day_number}</span>}
      </div>
      {showTimer && (
        <div className={"timer " + (t <= 10 ? "timer-warn" : "")}>{t}</div>
      )}
    </div>
  );
}

// ---------------- Lobby ----------------
function Lobby({ state, session, refresh, setError }) {
  const inviteLink = `${window.location.origin}/?room=${state.code}`;
  const [copied, setCopied] = useState(false);

  async function addBot() {
    try {
      await api.addBot(state.code, session.playerId);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function start() {
    try {
      await api.start(state.code, session.playerId);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeP(id) {
    try {
      await api.removePlayer(state.code, session.playerId, id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  function copy() {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card">
      <h2>Лобби</h2>
      <div className="room-code-box">
        <span className="room-code-label">Бөлме коды</span>
        <span className="room-code">{state.code}</span>
      </div>
      <button className="btn" onClick={copy}>
        {copied ? "Сілтеме көшірілді!" : "Шақыру сілтемесін көшіру"}
      </button>

      <PlayerList
        players={state.players}
        isHost={state.is_host}
        myId={session.playerId}
        onRemove={removeP}
      />

      <div className="count-line">
        Ойыншылар: {state.player_count} / {state.max_players}
        {state.player_count < state.min_players &&
          ` · тағы ${state.min_players - state.player_count} керек`}
      </div>

      {state.is_host ? (
        <>
          <button className="btn" onClick={addBot} disabled={state.player_count >= state.max_players}>
            🤖 Бот қосу
          </button>
          <button
            className="btn btn-primary big"
            onClick={start}
            disabled={state.player_count < state.min_players}
          >
            Ойынды бастау
          </button>
        </>
      ) : (
        <p className="waiting">Хост ойынды бастауын күтіңіз…</p>
      )}
    </div>
  );
}

function PlayerList({ players, isHost, myId, onRemove }) {
  return (
    <ul className="player-list">
      {players.map((p) => (
        <li key={p.id} className={p.alive ? "" : "dead"}>
          <span className="p-name">
            {p.name}
            {p.is_me && <span className="me-tag"> (сіз)</span>}
          </span>
          <span className="p-tags">
            {p.is_host && <span className="badge badge-host">ХОСТ</span>}
            {p.is_bot && <span className="badge badge-bot">BOT</span>}
            {!p.alive && <span className="badge badge-dead">ШЫҚТЫ</span>}
            {isHost && onRemove && !p.is_me && (
              <button className="x-btn" onClick={() => onRemove(p.id)} title="Өшіру">×</button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------- Role Reveal ----------------
function RoleReveal({ state, session, setError }) {
  const me = state.me;
  if (!me || !me.role) return <div className="card">Рөл жүктелуде…</div>;
  return (
    <div className="card role-card">
      <h2>Сіздің құпия рөліңіз</h2>
      <RoleImage roleKey={me.role} image={me.image} size={160} />
      <h3 className="role-name">{me.role_name}</h3>
      <span className={"badge team-badge " + (TEAM_CLASS[me.team] || "")}>{me.team}</span>
      <p className="role-ability">{me.ability}</p>
      {me.teammates && me.teammates.length > 0 && (
        <div className="teammates">
          <strong>Сіздің серіктестеріңіз:</strong> {me.teammates.join(", ")}
        </div>
      )}
      {state.is_host && (
        <HostNext code={state.code} pid={session.playerId} setError={setError} label="Түнге өту" />
      )}
      <p className="hint">Рөліңізді басқаларға айтпаңыз 🤫</p>
    </div>
  );
}

function HostNext({ code, pid, setError, label }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      await api.next(code, pid);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button className="btn btn-primary big" disabled={busy} onClick={go}>
      {label}
    </button>
  );
}

// ---------------- Night ----------------
function Night({ state, session, refresh, setError }) {
  const me = state.me;
  const [target, setTarget] = useState(null);
  const [target2, setTarget2] = useState(null);

  const alive = state.players.filter((p) => p.alive);

  if (!me || !me.alive) {
    return (
      <div className="card night-card">
        <div className="moon big-moon">🌙</div>
        <h2>Түн</h2>
        <p>Сіз ойыннан шықтыңыз. Таңды күтіңіз…</p>
        <NightProgress state={state} />
      </div>
    );
  }

  const action = me.night_action;
  const canActWithTarget = action || me.can_target;

  if (!canActWithTarget) {
    return (
      <div className="card night-card">
        <div className="moon big-moon">🌙</div>
        <h2>Түн</h2>
        <p>Ауыл ұйқыда. Сіздің түнгі әрекетіңіз жоқ. Таңды күтіңіз…</p>
        {me.clue && <div className="clue-box">📜 {me.clue}</div>}
        <NightProgress state={state} />
      </div>
    );
  }

  const effectiveAction = action === "block" && me.can_target && me.role === "bandit"
    ? "hutor_target"
    : action || "hutor_target";

  async function submit() {
    if (!target) return setError("Мақсат таңдаңыз.");
    if (effectiveAction === "swap" && !target2) return setError("Екінші ойыншыны таңдаңыз.");
    try {
      await api.action(state.code, session.playerId, effectiveAction, target, target2);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const labels = {
    inspect: "Кімді тексересіз?",
    protect: "Кімді қорғайсыз?",
    swap: "Қай екеуін ауыстырасыз?",
    hutor_target: "Кімді таңдайсыз?",
    block: "Кімнің әрекетін бұғаттайсыз?",
  };

  return (
    <div className="card night-card">
      <div className="moon big-moon">🌙</div>
      <h2>{me.role_name} — түнгі әрекет</h2>
      {me.teammates && me.teammates.length > 0 && (
        <div className="teammates small">Серіктестер: {me.teammates.join(", ")}</div>
      )}

      {me.action_submitted ? (
        <div className="submitted-box">
          ✅ Әрекетіңіз қабылданды. Басқаларды күтіңіз…
          {me.inspection && (
            <div className="inspect-result">
              Тексеру: {me.inspection.target_name
                ? `${me.inspection.target_name} — ${me.inspection.result}`
                : me.inspection.result}
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="prompt">{labels[effectiveAction]}</p>
          <div className="target-grid">
            {alive.map((p) => (
              <button
                key={p.id}
                className={"target-btn " + (target === p.id ? "sel" : "") + (target2 === p.id ? " sel2" : "")}
                onClick={() => setTarget(p.id)}
                disabled={effectiveAction !== "protect" && p.is_me && effectiveAction !== "swap"}
              >
                {p.name}{p.is_me ? " (сіз)" : ""}
              </button>
            ))}
          </div>
          {effectiveAction === "swap" && (
            <>
              <p className="prompt">Екінші ойыншы:</p>
              <div className="target-grid">
                {alive.map((p) => (
                  <button
                    key={p.id}
                    className={"target-btn " + (target2 === p.id ? "sel2" : "")}
                    onClick={() => setTarget2(p.id)}
                    disabled={p.id === target}
                  >
                    {p.name}{p.is_me ? " (сіз)" : ""}
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="btn btn-primary big" onClick={submit}>Растау</button>
        </>
      )}
      <NightProgress state={state} />
    </div>
  );
}

function NightProgress({ state }) {
  const np = state.night_progress;
  if (!np) return null;
  return (
    <div className="night-progress">
      Түнгі әрекеттер: {np.done} / {np.need}
    </div>
  );
}

// ---------------- Morning ----------------
function Morning({ state }) {
  return (
    <div className="card morning-card">
      <div className="sun">🌅</div>
      <h2>Таңғы жаңалық</h2>
      <p className="news">{state.morning_news}</p>
      {state.me?.clue && <div className="clue-box">📜 Өсек: {state.me.clue}</div>}
      <p className="hint">Талқылау жақында басталады…</p>
    </div>
  );
}

// ---------------- Discussion ----------------
function Discussion({ state, session, refresh, setError }) {
  const me = state.me;
  const [text, setText] = useState("");
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chat]);

  async function send(t) {
    const msg = (t ?? text).trim();
    if (!msg) return;
    try {
      await api.chat(state.code, session.playerId, msg);
      setText("");
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const canChat = me && me.alive;

  return (
    <div className="card discuss-card">
      <h2>Талқылау</h2>
      {state.morning_news && <p className="news small">{state.morning_news}</p>}
      <div className="chat-box">
        {(state.chat || []).map((m, i) => (
          <div key={i} className="chat-msg">
            <span className="chat-name">{m.name}:</span> {m.text}
          </div>
        ))}
        <div ref={chatEnd} />
      </div>

      {canChat ? (
        <>
          <div className="quick-msgs">
            {(state.quick_messages || []).map((q) => (
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
            <button className="btn btn-primary" onClick={() => send()}>Жіберу</button>
          </div>
        </>
      ) : (
        <p className="hint">Сіз тек оқи аласыз (ойыннан шықтыңыз).</p>
      )}

      {state.is_host && (
        <HostNext code={state.code} pid={session.playerId} setError={setError} label="Дауыс беруге өту" />
      )}
    </div>
  );
}

// ---------------- Voting ----------------
function Voting({ state, session, refresh, setError }) {
  const me = state.me;
  const alive = state.players.filter((p) => p.alive);

  async function castVote(id) {
    try {
      await api.vote(state.code, session.playerId, id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!me || !me.alive) {
    return (
      <div className="card">
        <h2>Дауыс беру</h2>
        <p>Сіз ойыннан шықтыңыз — дауыс бере алмайсыз.</p>
        <p className="hint">Дауыс берген ойыншылар: {(state.voted_names || []).join(", ") || "әзірге жоқ"}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Кім күдікті?</h2>
      <p className="prompt">Бір ойыншыға дауыс беріңіз.</p>
      <div className="target-grid">
        {alive.map((p) => (
          <button
            key={p.id}
            className={"target-btn " + (state.my_vote === p.id ? "sel" : "")}
            onClick={() => castVote(p.id)}
            disabled={p.is_me}
          >
            {p.name}{p.is_me ? " (сіз)" : ""}
          </button>
        ))}
      </div>
      <button className="btn" onClick={() => castVote(null)}>Дауыс бермеу</button>
      <p className="hint">Дауыс бергендер: {(state.voted_names || []).join(", ") || "әзірге жоқ"}</p>
    </div>
  );
}

// ---------------- Day Result ----------------
function DayResult({ state, session, setError }) {
  return (
    <div className="card result-card">
      <h2>Күн қорытындысы</h2>
      <p className="news big">{state.day_result_text}</p>
      {state.is_host && (
        <HostNext code={state.code} pid={session.playerId} setError={setError} label="Жалғастыру" />
      )}
      <p className="hint">Ойын автоматты түрде жалғасады…</p>
    </div>
  );
}

// ---------------- Game Over ----------------
function GameOver({ state, session, setError, leave }) {
  async function again() {
    try {
      await api.reset(state.code, session.playerId);
    } catch (e) {
      setError(e.message);
    }
  }
  const winClass = TEAM_CLASS[state.winner] || "";
  return (
    <div className="card gameover-card">
      <h2 className="dramatic">Ойын аяқталды</h2>
      <p className="dramatic-sub">Ауылдың шындығы ашылды.</p>
      <div className={"winner-banner " + winClass}>
        🏆 {state.winner}
      </div>
      <p className="news">{state.winner_text}</p>

      <h3 className="reveal-title">Барлық рөлдер</h3>
      <ul className="reveal-list">
        {state.players.map((p) => (
          <li key={p.id} className={p.alive ? "" : "dead"}>
            <RoleImage roleKey={p.role} image={p.image} size={42} />
            <div className="reveal-info">
              <span className="p-name">{p.name} {p.is_bot && <span className="badge badge-bot">BOT</span>}</span>
              <span className="reveal-role">
                {p.role_name} · <span className={TEAM_CLASS[p.team]}>{p.team}</span>
              </span>
            </div>
            <span className={"badge " + (p.alive ? "badge-alive" : "badge-dead")}>
              {p.alive ? "Тірі" : "Шықты"}
            </span>
          </li>
        ))}
      </ul>

      {state.is_host ? (
        <button className="btn btn-primary big" onClick={again}>Қайта ойнау</button>
      ) : (
        <p className="hint">Хост қайта бастауын күтіңіз…</p>
      )}
      <button className="btn" onClick={leave}>Басты бетке</button>
    </div>
  );
}
