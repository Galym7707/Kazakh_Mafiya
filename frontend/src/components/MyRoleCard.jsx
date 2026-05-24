import React from "react";
import RoleImage from "./RoleImage.jsx";
import { TEAM_CLASS } from "../roles.js";

// Менің рөлім — әрқашан көрініп тұратын ықшам карта
export default function MyRoleCard({ me }) {
  if (!me || !me.role) return null;

  const alive = me.alive;

  return (
    <aside className={"my-role-card mafia-card " + (alive ? "" : "dead")}>
      <div className="my-role-image card-image-frame">
        <RoleImage roleKey={me.role} size={null} fit="contain" />
      </div>
      <div className="my-role-info">
        <div className="my-role-kicker">Сіздің рөліңіз</div>
        <div className="my-role-name card-role-name">{me.role_name}</div>
        <span className={"card-team-badge team-badge " + (TEAM_CLASS[me.team] || "")}>
          {me.team}
        </span>
        {me.ability && <p className="my-role-ability">{me.ability}</p>}
        {!alive && <div className="my-role-dead">💤 Сіз ойыннан шықтыңыз</div>}
      </div>
    </aside>
  );
}
