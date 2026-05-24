import React, { useCallback, useEffect, useRef, useState } from "react";

const LS_WIDTH = "auyl_mafia_sidebar_width";
const MIN_W = 240;
const MAX_W = 420;
const DEFAULT_W = 300;
const STEP = 20;

function loadWidth() {
  const raw = parseInt(localStorage.getItem(LS_WIDTH) || "", 10);
  if (Number.isFinite(raw)) return Math.min(MAX_W, Math.max(MIN_W, raw));
  return DEFAULT_W;
}

function clampWidth(w) {
  return Math.min(MAX_W, Math.max(MIN_W, w));
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 760;
}

const HOME_NAV = [
  { id: "top", label: "Басты бет", icon: "🏠" },
  { id: "how", label: "Қалай ойнайды", icon: "📖" },
  { id: "roles", label: "Рөлдер", icon: "🎴" },
  { id: "teams", label: "Командалар", icon: "👥" },
  { id: "faq", label: "FAQ", icon: "❓" },
  { id: "join", label: "Ойынға кіру", icon: "🎲" },
];

export default function Sidebar({
  state,
  session,
  open,
  onClose,
  actions,
  mode = "game", // "home" | "game"
}) {
  const [width, setWidth] = useState(loadWidth);
  const [mobile, setMobile] = useState(isMobileViewport);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWRef = useRef(width);

  useEffect(() => {
    const onResize = () => setMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Негізгі контент сайдбардың енімен жылжуы үшін CSS айнымалысы
  useEffect(() => {
    if (mobile) {
      document.documentElement.style.setProperty("--sidebar-w", "0px");
    } else {
      document.documentElement.style.setProperty("--sidebar-w", (open ? width : 0) + "px");
    }
  }, [width, open, mobile]);

  const persist = useCallback((w) => {
    localStorage.setItem(LS_WIDTH, String(w));
  }, []);

  const setW = useCallback(
    (w) => {
      const c = clampWidth(w);
      setWidth(c);
      persist(c);
    },
    [persist]
  );

  // Drag-resize
  useEffect(() => {
    if (mobile) return;
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - startXRef.current;
      setW(startWRef.current + dx);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.classList.remove("sb-resizing");
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [mobile, setW]);

  const onHandleDown = (e) => {
    if (mobile) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWRef.current = width;
    document.body.classList.add("sb-resizing");
    e.preventDefault();
  };

  const goHome = (id) => {
    if (mode === "home") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Ойын ішінде болсақ — бастыға қайтамыз да, hash беріп өтеміз
      window.location.href = `/#${id}`;
    }
    if (mobile) onClose?.();
  };

  const isLobby = state?.phase === "lobby";
  const isHost = state?.is_host;

  const sidebarStyle = mobile ? undefined : { width: `${width}px` };

  return (
    <>
      <div
        className={"sb-backdrop " + (open && mobile ? "show" : "")}
        onClick={onClose}
      />
      <aside
        className={"sidebar " + (open ? "open" : "") + (mobile ? " mobile" : " desktop")}
        style={sidebarStyle}
      >
        <div className="sb-brand">
          <span className="sb-title">Ауыл Mafia</span>
          <span className="sb-sub">Түнгі Құпия</span>
          <button className="sb-x" onClick={onClose} aria-label="Жабу">✕</button>
        </div>

        <div className="sb-scroll">
          {mode === "home" ? (
            <nav className="sb-nav">
              {HOME_NAV.map((it) => (
                <button
                  key={it.id}
                  className="sb-nav-btn"
                  onClick={() => goHome(it.id)}
                  type="button"
                >
                  <span className="sb-nav-icon">{it.icon}</span>
                  <span>{it.label}</span>
                </button>
              ))}
            </nav>
          ) : (
            <GameSidebarContent
              state={state}
              session={session}
              actions={actions}
              isHost={isHost}
              isLobby={isLobby}
              onCloseMobile={() => mobile && onClose?.()}
            />
          )}
        </div>

        {!mobile && (
          <div className="sb-resize-controls">
            <div className="sb-width-row">
              <button
                className="sb-w-btn"
                onClick={() => setW(width - STEP)}
                title="Тарлау"
                disabled={width <= MIN_W}
              >
                −
              </button>
              <span className="sb-w-num">{width}px</span>
              <button
                className="sb-w-btn"
                onClick={() => setW(width + STEP)}
                title="Кеңейту"
                disabled={width >= MAX_W}
              >
                +
              </button>
              <button
                className="sb-w-btn sb-w-reset"
                onClick={() => setW(DEFAULT_W)}
                title="Әдепкі"
              >
                Әдепкі
              </button>
            </div>
          </div>
        )}

        {!mobile && (
          <div
            className="sb-resize-handle"
            onMouseDown={onHandleDown}
            aria-label="Сайдбар өлшемін өзгерту"
            role="separator"
          />
        )}
      </aside>
    </>
  );
}

function GameSidebarContent({ state, session, actions, isHost, isLobby, onCloseMobile }) {
  const [copied, setCopied] = useState(false);
  if (!state) return null;

  const inviteLink = `${window.location.origin}/?room=${state.code}`;
  function copy() {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <div className="sb-block">
        <div className="sb-block-title">🏠 Бөлме</div>
        <div className="sb-room-code">{state.code}</div>
        <button className="btn small" onClick={copy}>
          {copied ? "Көшірілді!" : "Сілтемені көшіру"}
        </button>
        <div className="sb-meta">
          <span>Ойыншылар: {state.player_count}/{state.max_players}</span>
          <span>Кезең: {state.phase_label}</span>
          {isHost && <span className="mini-badge host">Сіз — хостсыз</span>}
        </div>
      </div>

      <div className="sb-block">
        <div className="sb-block-title">👥 Ойыншылар</div>
        <ul className="sb-players">
          {state.players.map((p) => (
            <li key={p.id} className={p.alive ? "" : "dead"}>
              <span className="sb-pn">
                {state.phase !== "game_over" && (
                  <span className="unknown-ic">{p.alive ? "🎭" : "💤"}</span>
                )}
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
      </div>

      <div className="sb-block">
        <div className="sb-block-title">📖 Қысқа ережелер</div>
        <ul className="sb-rules">
          <li>Түнде рөлдер әрекет етеді.</li>
          <li>Күндіз ауыл талқылайды.</li>
          <li>Дауыс беру арқылы күдікті ойыннан шығады.</li>
          <li>Ауыл барлық Хуторлықтарды тапса жеңеді.</li>
          <li>Хуторлықтар ауылмен теңессе жеңеді.</li>
        </ul>
      </div>

      <div className="sb-block">
        <div className="sb-block-title">🎴 Рөлдер</div>
        <a
          className="btn small sb-link-btn"
          href="/#roles"
          onClick={(e) => {
            // Ойын ішінен — басты бетке өтіп, рөлдер бөліміне барамыз
            // (бұл тек ойыннан шықпай-ақ, жаңа қойындыда ашуды ұсынады)
            e.preventDefault();
            window.open("/#roles", "_blank", "noopener");
          }}
        >
          Толық рөлдер бетін ашу ↗
        </a>
      </div>

      <div className="sb-block">
        <div className="sb-block-title">⚙️ Басқару</div>
        {isHost && isLobby && (
          <>
            <button
              className="btn small"
              onClick={() => { actions.addBot(); }}
              disabled={state.player_count >= state.max_players}
            >
              🤖 Бот қосу
            </button>
            <button
              className="btn btn-primary small"
              onClick={() => { actions.start(); }}
              disabled={state.player_count < state.min_players}
            >
              Ойынды бастау
            </button>
          </>
        )}
        {isHost && !isLobby && (
          <button className="btn small" onClick={() => { actions.reset(); }}>
            Ойынды қайта бастау
          </button>
        )}
        <button
          className="btn small"
          onClick={() => { actions.leave(); onCloseMobile?.(); }}
        >
          Шығу
        </button>
      </div>
    </>
  );
}
