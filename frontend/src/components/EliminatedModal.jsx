import React, { useEffect, useState } from "react";
import RoleImage from "./RoleImage.jsx";
import { TEAM_CLASS } from "../roles.js";

// Modal: ойыннан шыққан ойыншының рөлі ашылғанда — толық экранды mystery reveal
export default function EliminatedModal({ state, isHost, onContinue }) {
  const name = state?.last_eliminated_player_name;
  const role = state?.last_eliminated_role;
  const roleName = state?.last_eliminated_role_name;
  const team = state?.last_eliminated_team;
  const reason = state?.last_eliminated_reason;
  const description = state?.last_eliminated_role_description;
  const dayNumber = state?.day_number;

  // Әр жаңа elimination бойынша анимация қайта басталсын
  const key = `${name || ""}-${role || ""}-${dayNumber || 0}`;

  const [dismissed, setDismissed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // elimination өзгерсе — модальді қайта ашамыз
  useEffect(() => {
    setDismissed(false);
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, [key]);

  if (!name || !role) return null;
  if (dismissed) return null;

  // ESC жабу
  const close = () => setDismissed(true);

  return (
    <div className="elim-modal-backdrop" role="dialog" aria-modal="true" onClick={close}>
      <div className="elim-modal" onClick={(e) => e.stopPropagation()}>
        <button className="elim-modal-x" onClick={close} aria-label="Жабу">✕</button>

        <p className="elim-modal-kicker">🌅 Таң атты — рөл ашылды</p>

        <div className="elim-modal-stage">
          <div className={"flip-card elim-flip " + (revealed ? "flipped" : "")}>
            <div className="flip-inner">
              <div className="flip-back mafia-card">
                <div className="card-pattern">🎴</div>
                <span>Құпия ашылуда…</span>
              </div>
              <div className="flip-front mafia-card eliminated-card">
                <div className="card-image-frame eliminated-image">
                  <RoleImage roleKey={role} size={null} fit="contain" />
                </div>
                <div className="card-player-name">{name}</div>
                <div className="card-role-name">{roleName}</div>
                <span className={"card-team-badge team-badge " + (TEAM_CLASS[team] || "")}>
                  Команда: {team}
                </span>
                {description && <p className="card-description">{description}</p>}
                <div className="reveal-reason">
                  <span>Себеп</span>
                  <b>{reason}</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="elim-modal-news">{name} ойыннан шықты</p>

        <div className="elim-modal-actions">
          {isHost && onContinue ? (
            <button
              className="btn btn-primary big"
              onClick={() => {
                setDismissed(true);
                onContinue();
              }}
            >
              Келесі кезең →
            </button>
          ) : (
            <button className="btn big" onClick={close}>Жабу</button>
          )}
        </div>
      </div>
    </div>
  );
}
