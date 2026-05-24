import React, { useMemo, useState } from "react";
import RoleCard from "./RoleCard.jsx";
import { ROLE_DETAILS, TEAM_FILTERS } from "../roles.js";

export default function RolesSection() {
  const [filter, setFilter] = useState("Барлығы");

  const roles = useMemo(() => {
    if (filter === "Барлығы") return ROLE_DETAILS;
    return ROLE_DETAILS.filter((r) => r.team === filter);
  }, [filter]);

  return (
    <section id="roles" className="roles-section">
      <header className="roles-section-head">
        <h2 className="roles-title">Рөлдер</h2>
        <p className="roles-intro">
          Әр рөлдің өз мақсаты мен түнгі әрекеті бар. Рөліңізді ешкімге айтпаңыз.
        </p>
        <div className="roles-filter">
          {TEAM_FILTERS.map((f) => (
            <button
              key={f}
              className={"roles-filter-btn " + (filter === f ? "active" : "")}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="roles-grid">
        {roles.map((r) => (
          <RoleCard key={r.id} role={r} />
        ))}
      </div>
    </section>
  );
}
