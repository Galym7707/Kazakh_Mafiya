import React from "react";

const TEAMS = [
  {
    name: "Ауыл",
    cls: "team-auyl",
    icon: "🏡",
    win: "Барлық Хуторлықтарды ойыннан шығарса жеңеді.",
  },
  {
    name: "Хуторлықтар",
    cls: "team-hutor",
    icon: "🌑",
    win: "Ауыл тұрғындарымен теңессе жеңеді.",
  },
  {
    name: "Бейтарап",
    cls: "team-neutral",
    icon: "🌀",
    win: "Өзінің жеке шартын орындаса жеңеді.",
  },
];

export default function TeamCards() {
  return (
    <section id="teams" className="teams-section">
      <h2 className="section-title">Командалар</h2>
      <div className="teams-grid">
        {TEAMS.map((t) => (
          <div key={t.name} className={"team-card " + t.cls}>
            <div className="team-icon">{t.icon}</div>
            <h3 className="team-name">{t.name}</h3>
            <p className="team-win">{t.win}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
