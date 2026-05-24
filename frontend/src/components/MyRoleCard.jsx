import React from "react";
import RoleImage from "./RoleImage.jsx";
import { TEAM_CLASS } from "../roles.js";

export default function MyRoleCard({ me }) {
  if (!me?.role) return null;

  return (
    <section className="my-role-dock" aria-label="Менің рөлім">
      <article className="mafia-card my-role-card">
        <div className="card-image-frame my-role-image">
          <RoleImage roleKey={me.role} size={null} fit="contain" />
        </div>
        <div className="my-role-copy">
          <span className="my-role-kicker">Менің рөлім</span>
          <h2 className="card-role-name my-role-title">{me.role_name}</h2>
          <span className={"team-badge card-team-badge " + (TEAM_CLASS[me.team] || "")}>
            {me.team}
          </span>
          {me.ability && <p className="my-role-ability">{me.ability}</p>}
        </div>
        <div className="my-role-private">Тек сізге көрінеді</div>
      </article>
    </section>
  );
}
