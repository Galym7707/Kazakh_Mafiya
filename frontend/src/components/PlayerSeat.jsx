import React from "react";
import RoleImage from "./RoleImage.jsx";
import { TEAM_CLASS } from "../roles.js";

export default function PlayerSeat({
  player,
  style,
  speaking = false,
  selected = false,
  voteCount = 0,
  voted = false,
  clickable = false,
  reveal = false,
  onClick,
}) {
  const showRole = (reveal || !player.alive || player.is_me) && player.role;
  const cls = [
    "seat",
    "mafia-card",
    "player-seat-card",
    player.alive ? "alive" : "dead",
    speaking ? "speaking" : "",
    selected ? "selected" : "",
    voted ? "is-voted" : "",
    player.is_me ? "me" : "",
    clickable ? "clickable" : "",
  ].join(" ");

  return (
    <div className={cls} style={style} onClick={clickable ? onClick : undefined}>
      <div className="card-image-frame seat-avatar">
        {showRole ? (
          <RoleImage roleKey={player.role} size={null} fit="contain" />
        ) : (
          <div className="seat-unknown">{player.alive ? "?" : "💤"}</div>
        )}
        {voteCount > 0 && <span className="vote-count">{voteCount}</span>}
        {voted && <span className="voted-dot" title="дауыс берді">✓</span>}
      </div>
      <div className="seat-name">
        {player.name}
        {player.is_me && <span className="seat-you"> (сіз)</span>}
      </div>
      <div className="seat-badges">
        {player.is_host && <span className="mini-badge host">HOST</span>}
        {player.is_bot && <span className="mini-badge bot">BOT</span>}
        {!player.alive && <span className="mini-badge dead">ШЫҚТЫ</span>}
      </div>
      {showRole && player.role_name && (
        <div className={"seat-role card-role-name " + (TEAM_CLASS[player.team] || "")}>
          {player.role_name}
        </div>
      )}
    </div>
  );
}
