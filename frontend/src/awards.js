// Жеңіс марапаттары мен жеке статистика
const LS_STATS = "auyl_mafia_stats";

function readStats() {
  try { return JSON.parse(localStorage.getItem(LS_STATS)) || {}; }
  catch { return {}; }
}

function writeStats(s) {
  try { localStorage.setItem(LS_STATS, JSON.stringify(s)); } catch {}
}

// Адамға марапат тізімін есептеу
export function computeAwards(player, state) {
  const winner = state.winner;
  const won = player.team === winner;
  const awards = [];

  if (won) {
    awards.push({ id: "winner", icon: "🏆", title: "Жеңімпаз", color: "gold" });
    if (player.alive) {
      awards.push({ id: "survivor", icon: "🌟", title: "Аман қалған", color: "green" });
    } else {
      awards.push({ id: "martyr", icon: "🎖️", title: "Команда үшін", color: "warm" });
    }
  } else {
    awards.push({ id: "played", icon: "🎲", title: "Ойнаған", color: "muted" });
  }

  // Арнайы: бейтарап жеке жеңіс
  if (won && player.team === "Бейтарап") {
    awards.push({ id: "lone-wolf", icon: "🌀", title: "Жалғыз қасқыр", color: "neutral" });
  }

  return awards;
}

// Тек «мен» (бот емес) үшін статистиканы жаңарту, дубль рет жазбау үшін game key
export function recordGameForMe(state, session) {
  if (!state || state.phase !== "game_over" || !session?.name) return null;
  const me = state.players.find((p) => p.is_me);
  if (!me || me.is_bot) return null;

  const gameKey = `${state.code}-${state.day_number || 0}-${state.winner}`;
  const stats = readStats();
  const player = stats[session.name] || {
    games: 0, wins: 0, by_team: { Ауыл: 0, Хуторлықтар: 0, Бейтарап: 0 }, recorded: {},
  };
  if (player.recorded?.[gameKey]) {
    return { stats: player, justRecorded: false, didWin: me.team === state.winner };
  }
  player.recorded = player.recorded || {};
  player.recorded[gameKey] = true;
  player.games += 1;
  const didWin = me.team === state.winner;
  if (didWin) {
    player.wins += 1;
    if (player.by_team[me.team] != null) player.by_team[me.team] += 1;
  }
  stats[session.name] = player;
  writeStats(stats);
  return { stats: player, justRecorded: true, didWin };
}

export function readMyStats(name) {
  if (!name) return null;
  return readStats()[name] || null;
}
