import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import RoleCard from "./RoleCard.jsx";
import HowToPlay from "./HowToPlay.jsx";
import TeamCards from "./TeamCards.jsx";
import FAQAccordion from "./FAQAccordion.jsx";
import RolesSection from "./RolesSection.jsx";
import { ROLE_DETAILS } from "../roles.js";

const PREVIEW_IDS = ["villager", "emshi", "hutor", "haosshy"];

export default function HomePage({ onEnter, presetCode, error, setError }) {
  const [name, setName] = useState(localStorage.getItem("auyl_name") || "");
  const [code, setCode] = useState(presetCode || "");
  const [busy, setBusy] = useState(false);
  const joinRef = useRef(null);

  // ?room=CODE болса — кіру бөліміне жылжытып, кодты толтыру
  useEffect(() => {
    if (presetCode) {
      setCode(presetCode);
      const t = setTimeout(() => {
        document.getElementById("join")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [presetCode]);

  // hash арқылы өту (#roles, #how, ...)
  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    const t = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => clearTimeout(t);
  }, []);

  async function go(fn) {
    if (!name.trim()) {
      setError("Атыңызды жазыңыз.");
      document.getElementById("join")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem("auyl_name", name.trim());
      const d = await fn();
      window.history.replaceState({}, "", `/?room=${d.room_code}`);
      onEnter(d.room_code, d.player_id, name.trim(), d.state);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const previewRoles = ROLE_DETAILS.filter((r) => PREVIEW_IDS.includes(r.id));

  return (
    <div className="landing">
      {/* HERO */}
      <section id="top" className="hero-section">
        <div className="hero-inner">
          <div className="hero-badge">🌙 Түнгі Құпия</div>
          <h1 className="hero-title">Ауыл Mafia</h1>
          <p className="hero-subtitle">Түнгі Құпия</p>
          <p className="hero-text">
            Ауыл түнде тыныш сияқты... бірақ Хуторлықтар ояу. Күндіз бәрі сөйлейді,
            күдіктенеді және дауыс береді. Кім ауылды сақтайды, ал кім түнгі
            құпияны жасырып жүр?
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary big" onClick={() => scrollTo("join")}>
              Бөлме құру
            </button>
            <button className="btn big" onClick={() => scrollTo("join")}>
              Бөлмеге кіру
            </button>
            <button className="btn big" onClick={() => scrollTo("roles")}>
              Рөлдер
            </button>
            <button className="btn big" onClick={() => scrollTo("how")}>
              Қалай ойнайды?
            </button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about-section">
        <h2 className="section-title">Бұл қандай ойын?</h2>
        <p className="about-text">
          Ауыл Mafia — классикалық Mafia ойынының қазақ ауылындағы нұсқасы.
          Әр ойыншы құпия рөл алады. Түнде рөлдер әрекет етеді, күндіз ауыл
          талқылап, күдікті адамға дауыс береді.
        </p>
      </section>

      {/* HOW TO PLAY */}
      <HowToPlay />

      {/* ROLES PREVIEW */}
      <section className="roles-preview-section">
        <h2 className="section-title">Кейбір рөлдер</h2>
        <div className="roles-preview-grid">
          {previewRoles.map((r) => (
            <RoleCard key={r.id} role={r} compact />
          ))}
        </div>
        <div className="roles-preview-cta">
          <button className="btn btn-primary big" onClick={() => scrollTo("roles")}>
            Барлық рөлдерді көру
          </button>
        </div>
      </section>

      {/* TEAMS */}
      <TeamCards />

      {/* JOIN/CREATE */}
      <section id="join" className="join-section" ref={joinRef}>
        <h2 className="section-title">Ойынға кіру</h2>
        <p className="join-lead">
          Достарыңмен ойнау үшін бөлме құр немесе код арқылы қосыл.
        </p>

        <div className="join-grid">
          <div className="card join-card">
            <h3 className="join-card-title">🎲 Жаңа бөлме</h3>
            <label className="field">
              <span>Атыңыз</span>
              <input
                value={name}
                maxLength={20}
                placeholder="Мысалы: Айдос"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              className="btn btn-primary big"
              disabled={busy}
              onClick={() => go(() => api.createRoom(name.trim()))}
            >
              Бөлме құру
            </button>
          </div>

          <div className="card join-card">
            <h3 className="join-card-title">🔑 Бөлмеге кіру</h3>
            <label className="field">
              <span>Атыңыз</span>
              <input
                value={name}
                maxLength={20}
                placeholder="Мысалы: Айдос"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Бөлме коды</span>
              <input
                value={code}
                maxLength={5}
                placeholder="ABCDE"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </label>
            <button
              className="btn big"
              disabled={busy}
              onClick={() => go(() => api.joinRoom(code.trim().toUpperCase(), name.trim()))}
            >
              Бөлмеге кіру
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
      </section>

      {/* ROLES FULL PAGE */}
      <RolesSection />

      {/* FAQ */}
      <FAQAccordion />

      <footer className="landing-footer">
        <p>🌙 Ауыл Mafia — достармен ойнайтын қазақ Mafia ойыны</p>
      </footer>
    </div>
  );
}
