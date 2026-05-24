// Рөл суреттері frontend/public/roles/ ішінен жүктеледі.
// Vite-те public файлдар "/roles/<file>.png" деп сілтенеді (жергілікті Windows жолы емес!).

export function getRoleImage(roleId) {
  if (!roleId) return null;
  const filename = roleId.endsWith(".png") ? roleId : `${roleId}.png`;
  return `/roles/${filename}`;
}

// PNG жүктелмесе — кірістірілген эмодзи fallback
export const ROLE_FALLBACK = {
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

export const TEAM_CLASS = {
  Ауыл: "team-auyl",
  Хуторлықтар: "team-hutor",
  Бейтарап: "team-neutral",
};

// Сайдбардағы Рөлдер FAQ
export const ROLE_GUIDE = [
  { id: "villager", name: "Ауыл тұрғыны", team: "Ауыл", desc: "Қарапайым тұрғын. Түнде әрекеті жоқ, күндіз дауыс береді." },
  { id: "uchastkovyi", name: "Учаскелік", team: "Ауыл", desc: "Түнде бір ойыншыны тексереді: «таза» немесе «күдікті»." },
  { id: "emshi", name: "Емші", team: "Ауыл", desc: "Түнде бір ойыншыны қорғайды. Қатарынан бір адамды екі рет емес." },
  { id: "taxi", name: "Таксист", team: "Ауыл", desc: "Түнде екі ойыншыны ауыстырады — оларға бағытталған әрекеттер орын ауыстырады." },
  { id: "akim", name: "Аким", team: "Ауыл", desc: "Тең дауыста шешеді. Алғаш дауыспен шықса, бір рет аман қалады." },
  { id: "hutor", name: "Хуторлық", team: "Хуторлықтар", desc: "Түнде ауылды шатастырады. Әр түнде бір ойыншыны таңдайды." },
  { id: "bandit", name: "Бандит", team: "Хуторлықтар", desc: "Бір ойыншының түнгі әрекетін бұғаттайды. Хуторлықтар жағында." },
  { id: "spletni", name: "Өсекші", team: "Ауыл", desc: "Әр таңда бұлыңғыр кеңес (өсек) алады." },
  { id: "haosshy", name: "Хаосшы", team: "Бейтарап", desc: "Әрекет бұғаттайды. Финалда (2 ойыншы) тірі қалса жеке жеңеді." },
];
