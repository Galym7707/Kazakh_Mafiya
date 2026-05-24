"""Ауыл Mafia — рөлдер мен командалар.

Барлық мәтін қазақ тілінде. Қатыгездік жоқ, ойыннан шығу тек ойынша.
"""

# Командалар
TEAM_AUYL = "Ауыл"
TEAM_HUTOR = "Хуторлықтар"
TEAM_NEUTRAL = "Бейтарап"

# Рөл кілттері суреттер атауымен сәйкес: frontend/public/roles/<key>.png
ROLES = {
    "villager": {
        "key": "villager",
        "name": "Ауыл тұрғыны",
        "team": TEAM_AUYL,
        "image": "villager.png",
        "night_action": None,
        "ability": "Қарапайым тұрғын. Күдіктілерді талқылап, күндіз дауыс береді.",
        "short": "Күндіз дауыс береді.",
    },
    "uchastkovyi": {
        "key": "uchastkovyi",
        "name": "Учаскелік",
        "team": TEAM_AUYL,
        "image": "uchastkovyi.png",
        "night_action": "inspect",
        "ability": "Түнде бір ойыншыны тексереді: «таза» немесе «күдікті».",
        "short": "Түнде бір ойыншыны тексереді.",
    },
    "emshi": {
        "key": "emshi",
        "name": "Емші",
        "team": TEAM_AUYL,
        "image": "emshi.png",
        "night_action": "protect",
        "ability": "Түнде бір ойыншыны қорғайды. Қатарынан екі түн бір адамды қорғай алмайды. Өзін бір рет қана қорғайды.",
        "short": "Түнде бір ойыншыны қорғайды.",
    },
    "taxi": {
        "key": "taxi",
        "name": "Таксист",
        "team": TEAM_AUYL,
        "image": "taxi.png",
        "night_action": "swap",
        "ability": "Түнде екі ойыншыны ауыстырады. Оларға бағытталған әрекеттер орын ауыстырады.",
        "short": "Түнде екі ойыншыны ауыстырады.",
    },
    "akim": {
        "key": "akim",
        "name": "Аким",
        "team": TEAM_AUYL,
        "image": "akim.png",
        "night_action": None,
        "ability": "Дауыс тең болса, Акимнің даусы шешеді. Алғаш дауыспен шықса, бір рет аман қалады.",
        "short": "Тең дауыста шешеді, бір рет аман қалады.",
    },
    "hutor": {
        "key": "hutor",
        "name": "Хуторлық",
        "team": TEAM_HUTOR,
        "image": "hutor.png",
        "night_action": "hutor_target",
        "ability": "Түнде ауылды шатастырады. Әр түнде бір ойыншыны ойыннан шығаруға тырысады. Мақсат — ауылмен теңесіп жеңу.",
        "short": "Түнде бір ойыншыны таңдайды.",
    },
    "bandit": {
        "key": "bandit",
        "name": "Бандит",
        "team": TEAM_HUTOR,
        "image": "bandit.png",
        "night_action": "block",
        "ability": "Хуторлықтардың күшейтілген рөлі. Бір ойыншының түнгі әрекетін бұғаттай алады.",
        "short": "Бір ойыншының әрекетін бұғаттайды.",
    },
    "spletni": {
        "key": "spletni",
        "name": "Өсекші",
        "team": TEAM_AUYL,
        "image": "spletni.png",
        "night_action": None,
        "ability": "Әр таңда бұлыңғыр кеңес алады. Тікелей емес, бірақ пайдалы.",
        "short": "Әр таңда кеңес алады.",
    },
    "haosshy": {
        "key": "haosshy",
        "name": "Хаосшы",
        "team": TEAM_NEUTRAL,
        "image": "haosshy.png",
        "night_action": "block",
        "ability": "Түнде бір ойыншының әрекетін бұғаттайды. Соңғы 2 ойыншыда тірі қалса — жеке жеңіске жетеді.",
        "short": "Әрекет бұғаттайды. Финалда жеңуі мүмкін.",
    },
}


def get_role(key):
    return ROLES.get(key)


# Рөл саны ойыншыларға қарай (адам + бот)
DISTRIBUTIONS = {
    4: ["uchastkovyi", "emshi", "hutor", "villager"],
    5: ["uchastkovyi", "emshi", "hutor", "haosshy", "villager"],
    6: ["uchastkovyi", "emshi", "taxi", "hutor", "hutor", "villager"],
    7: ["uchastkovyi", "emshi", "taxi", "spletni", "hutor", "hutor", "villager"],
    8: ["uchastkovyi", "emshi", "taxi", "akim", "spletni", "hutor", "bandit", "villager"],
}


def distribution_for(count):
    """count ойыншыға рөл тізімін қайтарады (4..10)."""
    if count < 4:
        count = 4
    if count in DISTRIBUTIONS:
        return list(DISTRIBUTIONS[count])
    # 9-10: 8 базасын алып, қалғанын тұрғынмен толтырамыз
    base = list(DISTRIBUTIONS[8])
    extra = count - 8
    for i in range(extra):
        # 10 ойыншыда тепе-теңдік үшін тағы бір Хуторлық
        if count == 10 and i == 0:
            base.append("hutor")
        else:
            base.append("villager")
    return base
