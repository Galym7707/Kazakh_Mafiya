import React, { useEffect, useRef, useState, useCallback } from "react";
import { api } from "./api.js";
import { TEAM_CLASS } from "./roles.js";
import RoleImage from "./components/RoleImage.jsx";
import Sidebar from "./components/Sidebar.jsx";
import HomePage from "./components/HomePage.jsx";
import MafiaTable from "./components/MafiaTable.jsx";
import PhaseBanner from "./components/PhaseBanner.jsx";
import TimerBar from "./components/TimerBar.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import NightActionPanel from "./components/NightActionPanel.jsx";
import VotingPanel from "./components/VotingPanel.jsx";
import MorningNews from "./components/MorningNews.jsx";
import GameOverReveal from "./components/GameOverReveal.jsx";
import EliminatedReveal from "./components/EliminatedReveal.jsx";

const LS_KEY = "auyl_mafia_session";
const loadSession = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; } };
const saveSession = (s) => { if (s) localStorage.setItem(LS_KEY, JSON.stringify(s)); else localStorage.removeItem(LS_KEY); };

export default function App() {
  const [session, setSession] = useState(loadSession());
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [sbOpen, setSbOpen] = useState(false);
  const [voteSel, setVoteSel] = useState(null);
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
      if (e.message.includes("Бөлме табылмады")) { saveSession(null); setSession(null); setState(null); }
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    refresh();
    pollRef.current = setInterval(refresh, 1300);
    return () => clearInterval(pollRef.current);
  }, [session, refresh]);

  const phase = state?.phase;
  useEffect(() => { setVoteSel(null); }, [phase]);

  function enterRoom(code, playerId, name, st) {
    const s = { code, playerId, name };
    saveSession(s); setSession(s); if (st) setState(st);
  }
  function leave() {
    saveSession(null); setSession(null); setState(null);
    window.history.replaceState({}, "", "/");
  }

  async function call(fn) { try { await fn(); refresh(); } catch (e) { setError(e.message); } }

  const theme = state?.phase_theme || "day";

  // ----- HOME (бөлмеге кірмеген кезде) -----
  if (!session || !state) {
    return (
      <div className="app app-shell phase-day home-mode">
        <Stars /><NightScenery />
        <Sidebar
          mode="home"
          open={sbOpen}
          onClose={() => setSbOpen(false)}
        />
        <header className="top-bar topbar home-topbar">
          <button className="hamburger" onClick={() => setSbOpen(true)} aria-label="Меню">☰</button>
          <div className="brand">
            <span className="brand-title">Ауыл Mafia</span>
            <span className="brand-sub">Түнгі Құпия</span>
          </div>
          <span className="topbar-spacer" />
        </header>
        <main className="main-content home-content with-sidebar">
          <div className="screen-container landing-layout">
            <HomePage
              onEnter={enterRoom}
              presetCode={codeFromUrl}
              setError={setError}
              error={error}
            />
          </div>
        </main>
      </div>
    );
  }

  const actions = {
    addBot: () => call(() => api.addBot(state.code, session.playerId)),
    start: () => call(() => api.start(state.code, session.playerId)),
    reset: () => call(() => api.reset(state.code, session.playerId)),
    leave,
  };

  const votedIds = (state.voted_names || [])
    .map((nm) => state.players.find((p) => p.name === nm)?.id)
    .filter(Boolean);
  const voteCounts = {};
  (state.vote_breakdown || []).forEach((v) => {
    const pl = state.players.find((p) => p.name === v.name);
    if (pl) voteCounts[pl.id] = v.count;
  });
  const screenClass = state.phase === "lobby" ? "lobby-layout" : "game-layout";
  const continuePhase = () => call(() => api.next(state.code, session.playerId));

  return (
    <div className={"app app-shell phase-" + theme}>
      <Stars /><NightScenery />
      <Sidebar
        mode="game"
        state={state}
        session={session}
        open={sbOpen}
        onClose={() => setSbOpen(false)}
        actions={actions}
      />

      <header className="top-bar topbar with-sidebar">
        <button className="hamburger" onClick={() => setSbOpen(true)}>☰</button>
        <div className="brand">
          <span className="brand-title">Ауыл Mafia</span>
          <span className="brand-sub">Түнгі Құпия</span>
        </div>
        <div className="topbar-code">{state.code}</div>
      </header>

      <main className="main-content content with-sidebar">
        <div className={"screen-container " + screenClass}>
        <PhaseBanner phase={state.phase} label={state.phase_label} dayNumber={state.day_number} />
        {state.phase !== "lobby" && state.phase !== "game_over" && (
          <TimerBar timeLeft={state.time_left} duration={state.phase_duration} />
        )}
        {error && <div className="error-banner">{error}</div>}

        {state.phase === "lobby" && <Lobby state={state} session={session} actions={actions} />}

        {state.phase === "role_reveal" && (
          <RoleReveal state={state} session={session} call={call} />
        )}

        {["night", "morning", "discussion", "voting", "day_result"].includes(state.phase) && (
          <>
            <MafiaTable
              players={state.players}
              currentSpeakerId={state.current_speaker_id}
              selectedId={state.phase === "voting" ? voteSel : null}
              clickable={state.phase === "voting" && state.me?.alive}
              votedIds={state.phase === "voting" ? votedIds : []}
              voteCounts={state.phase === "day_result" ? voteCounts : {}}
              reveal={false}
              onSeatClick={(p) => { if (!p.is_me) setVoteSel(p.id); }}
              center={<TableCenter state={state} />}
            />
            {state.phase === "night" && (
              <NightActionPanel
                state={state}
                onSubmit={(a, t, t2) => call(() => api.action(state.code, session.playerId, a, t, t2))}
              />
            )}
            {state.phase === "morning" && (
              <>
                <MorningNews state={state} />
                <EliminatedReveal state={state} isHost={state.is_host} onContinue={continuePhase} />
              </>
            )}
            {state.phase === "discussion" && (
              <ChatPanel state={state} session={session}
                onSend={(txt) => call(() => api.chat(state.code, session.playerId, txt))} />
            )}
            {state.phase === "voting" && (
              <VotingPanel state={state} selectedId={voteSel}
                onConfirm={() => call(() => api.vote(state.code, session.playerId, voteSel))}
                onSkip={() => call(() => api.vote(state.code, session.playerId, null))} />
            )}
            {state.phase === "day_result" && (
              <>
                <DayResult state={state} />
                <EliminatedReveal state={state} isHost={state.is_host} onContinue={continuePhase} />
              </>
            )}
            {state.is_host && ["discussion", "voting"].includes(state.phase) && (
              <button className="btn host-next" onClick={continuePhase}>
                Келесі фаза →
              </button>
            )}
          </>
        )}

        {state.phase === "game_over" && (
          <GameOverReveal state={state} isHost={state.is_host}
            onAgain={actions.reset} onLeave={leave} />
        )}
        </div>
      </main>
    </div>
  );
}

function Stars() {
  return <div className="stars" aria-hidden>{Array.from({ length: 40 }).map((_, i) => (
    <span key={i} className="star" style={{
      left: Math.random() * 100 + "%", top: Math.random() * 60 + "%",
      animationDelay: Math.random() * 3 + "s", opacity: 0.3 + Math.random() * 0.7,
    }} />))}</div>;
}
function NightScenery() {
  return (<div className="scenery" aria-hidden>
    <div className="moon-orb" /><div className="sun-orb" />
    <div className="fog fog-1" /><div className="fog fog-2" /><div className="fog fog-3" />
    <div className="silhouette" />
    <div className="hills" />
    <div className="vignette" />
  </div>);
}

function TableCenter({ state }) {
  if (state.phase === "night")
    return <div className="tc"><div className="tc-moon">🌙</div>
      <p className="tc-strong">Түн түсті… ауыл үнсіз.</p>
      <p>Барлығы ұйықтап жатыр.<br />Құпия әрекеттер басталды.</p></div>;
  if (state.phase === "morning")
    return <div className="tc"><div className="tc-sun">🌅</div><p>Таң атты</p></div>;
  if (state.phase === "discussion")
    return <div className="tc"><p className="tc-speak">🎤</p>
      <p>{state.current_speaker_name ? `Сөйлеп тұр: ${state.current_speaker_name}` : "Талқылау"}</p></div>;
  if (state.phase === "voting")
    return <div className="tc"><div className="tc-vote">🗳️</div>
      <p className="tc-strong">Ауыл шешім қабылдайды…</p>
      <p>Күдік кімге түсті?</p></div>;
  if (state.phase === "day_result")
    return <div className="tc"><div className="tc-scroll">📜</div><p>{state.day_result_text}</p></div>;
  return <div className="tc" />;
}

// ---------------- Lobby ----------------
function Lobby({ state, session, actions }) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/?room=${state.code}`;
  function copy() { navigator.clipboard?.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  const notEnough = state.player_count < state.min_players;

  return (
    <div className="card lobby">
      <div className="lobby-head">
        <h1>Ауыл Mafia</h1>
        <p className="lobby-subtitle">Түнгі Құпия</p>
      </div>

      <div className="room-code-box room-code-card">
        <span className="room-code-label">Бөлме коды</span>
        <span className="room-code">{state.code}</span>
      </div>
      <button className="btn invite-btn" onClick={copy}>{copied ? "Сілтеме көшірілді!" : "Сілтемені көшіру"}</button>

      <div className="lobby-players">
        {state.players.map((p) => (
          <div key={p.id} className="lobby-player-card lobby-pcard">
            <div className="lp-avatar">{p.is_bot ? "🤖" : "🧑"}</div>
            <div className="lp-name card-player-name">{p.name}{p.is_me ? " (сіз)" : ""}</div>
            <div className="lp-badges">
              {p.is_host && <span className="mini-badge host">HOST</span>}
              {p.is_bot && <span className="mini-badge bot">BOT</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="count-line">Ойыншылар: {state.player_count} / {state.max_players}</div>
      {notEnough && <div className="warn-line">Бастау үшін тағы {state.min_players - state.player_count} ойыншы керек</div>}

      {state.is_host ? (
        <div className="host-controls">
          <button className="btn" onClick={actions.addBot} disabled={state.player_count >= state.max_players}>🤖 Бот қосу</button>
          <button className="btn btn-primary big" onClick={actions.start} disabled={notEnough}>Ойынды бастау</button>
        </div>
      ) : (
        <p className="waiting">Хост ойынды бастауын күтіңіз…</p>
      )}
    </div>
  );
}

// ---------------- Role Reveal ----------------
function RoleReveal({ state, session, call }) {
  const me = state.me;
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { const t = setTimeout(() => setFlipped(true), 400); return () => clearTimeout(t); }, []);
  if (!me || !me.role) return <div className="card">Рөл жүктелуде…</div>;
  return (
    <div className="card role-reveal">
      <h2>Сіздің құпия рөліңіз</h2>
      <div className={"flip-card mafia-card role-card-large " + (flipped ? "flipped" : "")} onClick={() => setFlipped(true)}>
        <div className="flip-inner">
          <div className="flip-back"><div className="card-pattern">🎴</div><span>Ашу үшін басыңыз</span></div>
          <div className="flip-front">
            <div className="card-image-frame role-card-image">
              <RoleImage roleKey={me.role} size={null} fit="contain" />
            </div>
            <h3 className="role-name card-role-name">{me.role_name}</h3>
            <span className={"team-badge card-team-badge " + (TEAM_CLASS[me.team] || "")}>{me.team}</span>
          </div>
        </div>
      </div>
      <p className="role-ability">{me.ability}</p>
      {me.teammates && me.teammates.length > 0 && (
        <div className="teammates">🤝 Серіктестеріңіз: {me.teammates.join(", ")}</div>
      )}
      {state.is_host && (
        <button className="btn btn-primary big" onClick={() => call(() => api.next(state.code, session.playerId))}>Түнге өту</button>
      )}
      <p className="hint">Рөліңізді басқаларға айтпаңыз 🤫</p>
    </div>
  );
}

// ---------------- Day Result ----------------
function DayResult({ state }) {
  return (
    <div className="panel result-panel">
      <h3 className="panel-title">📜 Күн қорытындысы</h3>
      <p className="news big">{state.day_result_text}</p>
      {(state.vote_breakdown || []).length > 0 && (
        <div className="vote-breakdown">
          <span className="vb-title">Дауыстар:</span>
          {state.vote_breakdown.map((v) => (
            <div key={v.name} className="vb-row">
              <span>{v.name}</span><span className="vb-count">{v.count}</span>
            </div>
          ))}
        </div>
      )}
      <p className="hint">Ойын автоматты түрде жалғасады…</p>
    </div>
  );
}
