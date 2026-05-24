import React from "react";
import PlayerSeat from "./PlayerSeat.jsx";

// Ойыншыларды сопақ үстел айналасына орналастырады.
export default function MafiaTable({
  players,
  center,
  currentSpeakerId,
  selectedId,
  voteCounts = {},
  votedIds = [],
  clickable = false,
  reveal = false,
  onSeatClick,
}) {
  const n = players.length || 1;
  return (
    <div className="mafia-table-wrap">
      <div className="table-oval">
        <div className="table-center">{center}</div>
      </div>
      <div className="seats-layer">
        {players.map((p, i) => {
          const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
          const left = 50 + 47 * Math.cos(angle);
          const top = 50 + 44 * Math.sin(angle);
          return (
            <PlayerSeat
              key={p.id}
              player={p}
              style={{ left: left + "%", top: top + "%" }}
              speaking={currentSpeakerId === p.id}
              selected={selectedId === p.id}
              voteCount={voteCounts[p.id] || 0}
              voted={votedIds.includes(p.id)}
              clickable={clickable && p.alive}
              reveal={reveal}
              onClick={() => onSeatClick && onSeatClick(p)}
            />
          );
        })}
      </div>
    </div>
  );
}
