import React, { useState } from "react";

// Рөл суреттері frontend/public/roles/<image> ішінен ізделеді.
// Сурет болмаса — әдемі SVG/эмодзи fallback көрсетіледі (ойын бұзылмайды).
const FALLBACK = {
  villager: "🧑‍🌾",
  uchastkovyi: "👮",
  emshi: "⚕️",
  taxi: "🚕",
  akim: "🎩",
  hutor: "🌑",
  bandit: "🕶️",
  spletni: "🗣️",
  haosshy: "🌀",
  bot: "🤖",
};

export default function RoleImage({ roleKey, image, size = 120 }) {
  const [failed, setFailed] = useState(false);
  const src = image ? `/roles/${image}` : null;
  const showImg = src && !failed;

  return (
    <div className="role-image" style={{ width: size, height: size }}>
      {showImg ? (
        <img
          src={src}
          alt={roleKey}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div className="role-image-fallback" style={{ fontSize: size * 0.5 }}>
          <span>{FALLBACK[roleKey] || "❓"}</span>
        </div>
      )}
    </div>
  );
}
