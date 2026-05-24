const BASE = "/api";

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.error || "Қате орын алды.");
  }
  return data;
}

export const api = {
  createRoom: (name) => req("POST", "/rooms", { name }),
  joinRoom: (code, name) => req("POST", `/rooms/${code}/join`, { name }),
  addBot: (code, player_id) => req("POST", `/rooms/${code}/add-bot`, { player_id }),
  removePlayer: (code, player_id, target_id) =>
    req("POST", `/rooms/${code}/remove`, { player_id, target_id }),
  start: (code, player_id) => req("POST", `/rooms/${code}/start`, { player_id }),
  getState: (code, player_id) =>
    req("GET", `/rooms/${code}/state?player_id=${encodeURIComponent(player_id)}`),
  action: (code, player_id, action, target, target2) =>
    req("POST", `/rooms/${code}/action`, { player_id, action, target, target2 }),
  vote: (code, player_id, target) =>
    req("POST", `/rooms/${code}/vote`, { player_id, target }),
  chat: (code, player_id, text) =>
    req("POST", `/rooms/${code}/chat`, { player_id, text }),
  next: (code, player_id) => req("POST", `/rooms/${code}/next`, { player_id }),
  reset: (code, player_id) => req("POST", `/rooms/${code}/reset`, { player_id }),
};
