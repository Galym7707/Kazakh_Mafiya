import React, { useState, useEffect } from "react";
import { getRoleImage, ROLE_FALLBACK } from "../roles.js";

// Рөл суреті: /roles/<roleKey>.png. Жүктелмесе — эмодзи fallback.
export default function RoleImage({ roleKey, size = 120, round = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [roleKey]);

  const src = getRoleImage(roleKey);
  const showImg = src && !failed;

  return (
    <div
      className={"role-image" + (round ? " round" : "")}
      style={{ width: size, height: size }}
    >
      {showImg ? (
        <img
          src={src}
          alt={roleKey}
          draggable={false}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div className="role-image-fallback" style={{ fontSize: size * 0.5 }}>
          <span>{ROLE_FALLBACK[roleKey] || "❓"}</span>
        </div>
      )}
    </div>
  );
}
