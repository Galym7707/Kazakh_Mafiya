import React, { useState, useEffect } from "react";
import { getRoleImage, ROLE_FALLBACK } from "../roles.js";

// Рөл суреті: /roles/<roleKey>.png. Жүктелмесе — эмодзи fallback.
export default function RoleImage({ roleKey, size = 120, round = false, fit = "contain", className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [roleKey]);

  const src = getRoleImage(roleKey);
  const showImg = src && !failed;
  const sizeStyle = Number.isFinite(size) ? { width: size, height: size } : undefined;

  return (
    <div
      className={["role-image", round ? "round" : "", className].filter(Boolean).join(" ")}
      style={sizeStyle}
    >
      {showImg ? (
        <img
          src={src}
          alt={roleKey ? `${roleKey} role` : "role"}
          draggable={false}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: fit }}
        />
      ) : (
        <div className="role-image-fallback">
          <span>{ROLE_FALLBACK[roleKey] || "?"}</span>
        </div>
      )}
    </div>
  );
}
