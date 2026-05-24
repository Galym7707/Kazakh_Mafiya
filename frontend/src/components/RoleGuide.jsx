import React from "react";
import RoleImage from "./RoleImage.jsx";
import { ROLE_GUIDE, TEAM_CLASS } from "../roles.js";

export default function RoleGuide() {
  return (
    <ul className="role-guide">
      {ROLE_GUIDE.map((r) => (
        <li key={r.id}>
          <RoleImage roleKey={r.id} size={40} round />
          <div className="rg-info">
            <span className="rg-name">
              {r.name}
              <span className={"rg-team " + (TEAM_CLASS[r.team] || "")}>{r.team}</span>
            </span>
            <span className="rg-desc">{r.desc}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
