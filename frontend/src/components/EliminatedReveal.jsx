import React from "react";
import RoleImage from "./RoleImage.jsx";
import { TEAM_CLASS } from "../roles.js";

export default function EliminatedReveal({ state, isHost = false, onContinue }) {
  const name = state.last_eliminated_player_name;
  const role = state.last_eliminated_role;
  const roleName = state.last_eliminated_role_name;
  const team = state.last_eliminated_team;
  const reason = state.last_eliminated_reason;
  const description = state.last_eliminated_role_description;
  const summary = state.last_day_result_summary || "Бұл жолы ешкім ойыннан шықпады.";

  if (!name || !role) {
    return (
      <section className="panel eliminated-reveal no-elimination">
        <p className="reveal-kicker">Күн қорытындысы</p>
        <h3 className="panel-title">{summary}</h3>
        {isHost && onContinue ? (
          <button className="btn btn-primary host-next-inline" onClick={onContinue}>Келесі кезең</button>
        ) : (
          <p className="hint">Келесі кезеңге дейін күтіңіз.</p>
        )}
      </section>
    );
  }

  return (
    <section className="panel eliminated-reveal">
      <p className="reveal-kicker">Рөл ашылды</p>
      <h3 className="panel-title">Ойыннан шыққан ойыншы</h3>
      <div className="eliminated-stage">
        <article className="mafia-card eliminated-card">
          <div className="card-image-frame eliminated-image">
            <RoleImage roleKey={role} size={null} fit="contain" />
          </div>
          <div className="card-player-name">{name}</div>
          <div className="card-role-name">{roleName}</div>
          <span className={"card-team-badge " + (TEAM_CLASS[team] || "")}>Команда: {team}</span>
          {description && <p className="card-description">{description}</p>}
          <div className="reveal-reason">
            <span>Себеп</span>
            <b>{reason}</b>
          </div>
        </article>
      </div>
      <p className="news big">{name} ойыннан шықты</p>
      {isHost && onContinue ? (
        <button className="btn btn-primary host-next-inline" onClick={onContinue}>Келесі кезең</button>
      ) : (
        <p className="hint">Келесі кезеңге дейін күтіңіз.</p>
      )}
    </section>
  );
}
