import React from "react";
import RoleImage from "./RoleImage.jsx";
import { TEAM_CLASS } from "../roles.js";

export default function RoleCard({ role, compact = false }) {
  return (
    <article className={"role-detail-card mafia-card " + (compact ? "compact" : "")}>
      <div className="card-image-frame role-detail-image">
        <RoleImage roleKey={role.id} size={null} fit="contain" />
      </div>
      <h3 className="card-role-name role-detail-name">{role.name}</h3>
      <span className={"team-badge card-team-badge " + (TEAM_CLASS[role.team] || "")}>
        {role.team}
      </span>

      {!compact && (
        <div className="role-detail-body">
          <p className="role-detail-desc">{role.desc}</p>
          <div className="role-detail-row">
            <span className="role-detail-label">🌙 Әрекет</span>
            <span className="role-detail-value">{role.action}</span>
          </div>
          <div className="role-detail-row">
            <span className="role-detail-label">🎯 Мақсат</span>
            <span className="role-detail-value">{role.goal}</span>
          </div>
          {role.tip && (
            <div className="role-detail-tip">
              <span className="role-detail-label">💡 Кеңес</span>
              <span>{role.tip}</span>
            </div>
          )}
        </div>
      )}

      {compact && <p className="role-detail-desc role-detail-desc-compact">{role.desc}</p>}
    </article>
  );
}
