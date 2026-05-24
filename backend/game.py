"""Ауыл Mafia — ойын логикасы (in-memory, дерекқорсыз)."""
import random
import string
import time
import threading

from . import roles as R
from . import content as C

# Фазалар
LOBBY = "lobby"
ROLE_REVEAL = "role_reveal"
NIGHT = "night"
MORNING = "morning"
DISCUSSION = "discussion"
VOTING = "voting"
DAY_RESULT = "day_result"
GAME_OVER = "game_over"

PHASE_DURATIONS = {
    ROLE_REVEAL: 12,
    NIGHT: 35,
    MORNING: 8,
    DISCUSSION: 90,
    VOTING: 25,
    DAY_RESULT: 8,
}

# Күн/түн визуал темасы (frontend phase-<theme> класы)
PHASE_THEME = {
    LOBBY: "day",
    ROLE_REVEAL: "reveal",
    NIGHT: "night",
    MORNING: "day",
    DISCUSSION: "day",
    VOTING: "voting",
    DAY_RESULT: "result",
    GAME_OVER: "game-over",
}

SPEAK_TURN = 20  # сөйлеу кезегі (сек)

PHASE_LABEL = {
    LOBBY: "Лобби",
    ROLE_REVEAL: "Рөлмен танысу",
    NIGHT: "Түн",
    MORNING: "Таңғы жаңалық",
    DISCUSSION: "Талқылау",
    VOTING: "Дауыс беру",
    DAY_RESULT: "Күн қорытындысы",
    GAME_OVER: "Ойын аяқталды",
}

MIN_PLAYERS = 4
MAX_PLAYERS = 10
ROOM_TTL = 6 * 3600  # 6 сағат


def _gen_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=5))


def _gen_id():
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=12))


class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


class Room:
    def __init__(self, code, host_id, host_name):
        self.code = code
        self.host_id = host_id
        self.created_at = time.time()
        self.last_active = time.time()
        # players: id -> dict
        self.players = {}
        self.order = []  # тұрақты реттілік
        self.phase = LOBBY
        self.timer_end = None
        self.day_number = 0
        self.night_number = 0
        self.night_actions = {}     # player_id -> {action, target, target2}
        self.votes = {}             # voter_id -> target_id
        self.chat = []              # {name, text, ts, dead}
        self.morning_news = ""
        self.day_result_text = ""
        self.history = []           # human-readable journal
        self.winner = None          # team string
        self.winner_text = ""
        self.osek_clues = {}        # player_id -> clue (current morning)
        self.inspection_results = {}  # player_id -> {target_name, result}
        self.emshi_last_protect = {}  # emshi_id -> target_id (prev night)
        self.emshi_self_used = set()
        self.akim_immunity_used = False
        self.last_eliminated = None  # name for morning
        self.speaking_order = []     # талқылаудағы сөйлеу кезегі (player_id тізімі)
        self.discussion_start = None
        self.vote_breakdown = []     # [{name, count}] нәтиже көрсету үшін
        self._add_player(host_id, host_name, is_bot=False)

    # ---------- ойыншыларды басқару ----------
    def _add_player(self, pid, name, is_bot):
        self.players[pid] = {
            "id": pid,
            "name": name,
            "is_bot": is_bot,
            "role": None,
            "team": None,
            "alive": True,
            "connected": True,
        }
        self.order.append(pid)

    def alive_players(self):
        return [self.players[p] for p in self.order if self.players[p]["alive"]]

    def alive_ids(self):
        return [p for p in self.order if self.players[p]["alive"]]

    def players_in_order(self):
        return [self.players[p] for p in self.order]

    def touch(self):
        self.last_active = time.time()

    # ---------- лобби әрекеттері ----------
    def join(self, name):
        if self.phase != LOBBY:
            raise ApiError("Ойын басталып кетті. Қосылу мүмкін емес.")
        if len(self.players) >= MAX_PLAYERS:
            raise ApiError("Бөлме толы (макс 10).")
        pid = _gen_id()
        self._add_player(pid, name.strip()[:20] or "Ойыншы", is_bot=False)
        self.touch()
        return pid

    def add_bot(self):
        if self.phase != LOBBY:
            raise ApiError("Ботты тек лоббиде қосуға болады.")
        if len(self.players) >= MAX_PLAYERS:
            raise ApiError("Бөлме толы (макс 10).")
        used = {p["name"] for p in self.players.values()}
        name = next((n for n in C.BOT_NAMES if n not in used), None)
        if name is None:
            name = "Бот " + str(len(self.players) + 1)
        pid = _gen_id()
        self._add_player(pid, name, is_bot=True)
        self.touch()
        return pid

    def remove_player(self, pid):
        if pid not in self.players:
            return
        if self.phase != LOBBY:
            # Ойын барысында: ажыратылды деп белгілейміз
            self.players[pid]["connected"] = False
            return
        del self.players[pid]
        self.order = [p for p in self.order if p != pid]
        if pid == self.host_id and self.order:
            # хост кетсе — жаңа хост
            self.host_id = self.order[0]
        self.touch()

    # ---------- ойынды бастау ----------
    def start(self):
        if self.phase != LOBBY:
            raise ApiError("Ойын бұрыннан басталған.")
        if len(self.players) < MIN_PLAYERS:
            raise ApiError(f"Кемінде {MIN_PLAYERS} ойыншы керек.")
        self._assign_roles()
        self.day_number = 0
        self.night_number = 0
        self._set_phase(ROLE_REVEAL)
        self.history.append("Ойын басталды. Рөлдер таратылды.")
        self.touch()

    def _assign_roles(self):
        ids = list(self.order)
        dist = R.distribution_for(len(ids))
        random.shuffle(dist)
        random.shuffle(ids)
        for pid, role_key in zip(ids, dist):
            role = R.get_role(role_key)
            self.players[pid]["role"] = role_key
            self.players[pid]["team"] = role["team"]
            self.players[pid]["alive"] = True

    # ---------- фаза ауысуы ----------
    def _set_phase(self, phase):
        self.phase = phase
        dur = PHASE_DURATIONS.get(phase)
        self.timer_end = (time.time() + dur) if dur else None

    def time_left(self):
        if self.timer_end is None:
            return None
        return max(0, int(round(self.timer_end - time.time())))

    # Таймер біткенде немесе шарт орындалғанда келесі фазаға автокөшу
    def maybe_advance(self):
        if self.phase in (LOBBY, GAME_OVER):
            return
        if self.phase == NIGHT and self._all_night_actions_in():
            self._advance_from(NIGHT)
            return
        if self.timer_end is not None and time.time() >= self.timer_end:
            self._advance_from(self.phase)

    def next_phase(self, requester_id):
        # Хост қолмен жалғастыра алады
        if requester_id != self.host_id:
            raise ApiError("Тек хост жалғастыра алады.", 403)
        if self.phase in (LOBBY, GAME_OVER):
            return
        self._advance_from(self.phase)

    def _advance_from(self, phase):
        if phase == ROLE_REVEAL:
            self._begin_night()
        elif phase == NIGHT:
            self._resolve_night()
        elif phase == MORNING:
            self._begin_discussion()
        elif phase == DISCUSSION:
            self.votes = {}
            self._set_phase(VOTING)
        elif phase == VOTING:
            self._resolve_votes()
        elif phase == DAY_RESULT:
            if self.winner is None:
                self._begin_night()
            else:
                self._set_phase(GAME_OVER)

    def _begin_discussion(self):
        # Сөйлеу кезегі: тірі ойыншылар тұрақты ретпен
        self.speaking_order = list(self.alive_ids())
        self.discussion_start = time.time()
        self._set_phase(DISCUSSION)
        self._maybe_bot_chat()

    def current_speaker(self):
        if self.phase != DISCUSSION or not self.speaking_order or self.discussion_start is None:
            return None, None
        elapsed = time.time() - self.discussion_start
        idx = int(elapsed // SPEAK_TURN) % len(self.speaking_order)
        speaker = self.speaking_order[idx]
        turn_end = self.discussion_start + (int(elapsed // SPEAK_TURN) + 1) * SPEAK_TURN
        if self.timer_end is not None:
            turn_end = min(turn_end, self.timer_end)
        return speaker, turn_end

    def _begin_night(self):
        self.night_number += 1
        self.night_actions = {}
        self.inspection_results = {}
        self.osek_clues = {}
        self._set_phase(NIGHT)
        self.history.append(f"{self.night_number}-түн басталды.")

    # ---------- түнгі әрекеттер ----------
    def _roles_requiring_action(self):
        """Тірі, түнгі әрекеті бар адам ойыншыларының id-лері."""
        need = []
        for pid in self.alive_ids():
            p = self.players[pid]
            if p["is_bot"]:
                continue
            role = R.get_role(p["role"])
            if role and role["night_action"]:
                # бандит әрекеті болуы үшін
                need.append(pid)
        return need

    def _all_night_actions_in(self):
        for pid in self._roles_requiring_action():
            if pid not in self.night_actions:
                return False
        return True

    def submit_action(self, pid, action, target, target2=None):
        if self.phase != NIGHT:
            raise ApiError("Қазір түнгі әрекет уақыты емес.")
        if pid not in self.players:
            raise ApiError("Ойыншы табылмады.", 404)
        p = self.players[pid]
        if not p["alive"]:
            raise ApiError("Ойыннан шыққан ойыншы әрекет жасай алмайды.", 403)
        role = R.get_role(p["role"])
        if not role or not role["night_action"]:
            raise ApiError("Сізде түнгі әрекет жоқ.")
        expected = role["night_action"]
        # Хуторсыз бандит team target таңдай алады
        allowed = {expected}
        if p["role"] == "bandit" and not self._other_hutor_alive(pid):
            allowed.add("hutor_target")
        if action not in allowed:
            raise ApiError("Бұл әрекет сізге қолжетімді емес.")
        # мақсаттарды тексеру
        if target is not None and (target not in self.players or not self.players[target]["alive"]):
            raise ApiError("Жарамсыз мақсат.")
        if action == "swap":
            if target2 is None or target2 not in self.players or not self.players[target2]["alive"]:
                raise ApiError("Таксистке екі жарамды мақсат керек.")
            if target == target2:
                raise ApiError("Екі түрлі ойыншы таңдаңыз.")
        if action == "protect":
            if target == pid and pid in self.emshi_self_used:
                raise ApiError("Өзіңізді бір-ақ рет қорғай аласыз.")
            if self.emshi_last_protect.get(pid) == target:
                raise ApiError("Қатарынан екі түн бір адамды қорғай алмайсыз.")
        self.night_actions[pid] = {"action": action, "target": target, "target2": target2}
        self.touch()

    def _other_hutor_alive(self, exclude_id):
        for pid in self.alive_ids():
            if pid == exclude_id:
                continue
            if self.players[pid]["role"] == "hutor":
                return True
        return False

    def _bot_night_actions(self):
        for pid in self.alive_ids():
            p = self.players[pid]
            if not p["is_bot"]:
                continue
            if pid in self.night_actions:
                continue
            role = R.get_role(p["role"])
            if not role or not role["night_action"]:
                continue
            others = [x for x in self.alive_ids() if x != pid]
            if not others:
                continue
            act = role["night_action"]
            if act == "swap":
                if len(self.alive_ids()) >= 2:
                    a, b = random.sample(self.alive_ids(), 2)
                    self.night_actions[pid] = {"action": "swap", "target": a, "target2": b}
            elif act == "protect":
                cand = [x for x in self.alive_ids()
                        if self.emshi_last_protect.get(pid) != x]
                cand = cand or self.alive_ids()
                self.night_actions[pid] = {"action": "protect", "target": random.choice(cand), "target2": None}
            elif act == "hutor_target":
                non_team = [x for x in others if self.players[x]["team"] != R.TEAM_HUTOR]
                tgt = random.choice(non_team or others)
                self.night_actions[pid] = {"action": "hutor_target", "target": tgt, "target2": None}
            elif act == "block":
                non_team = [x for x in others if self.players[x]["team"] != R.TEAM_HUTOR] \
                    if p["role"] == "bandit" else others
                self.night_actions[pid] = {"action": "block", "target": random.choice(non_team or others), "target2": None}
            elif act == "inspect":
                self.night_actions[pid] = {"action": "inspect", "target": random.choice(others), "target2": None}

    def _resolve_night(self):
        self._bot_night_actions()
        acts = {pid: a for pid, a in self.night_actions.items()
                if pid in self.players and self.players[pid]["alive"]}

        # 1) Бұғаттаулар (Бандит, Хаосшы) — бастапқы мақсаттар бойынша
        blocked = set()
        for pid, a in acts.items():
            if a["action"] == "block" and a.get("target"):
                blocked.add(a["target"])

        # 2) Таксист ауыстыруы
        swap_a = swap_b = None
        for pid, a in acts.items():
            if a["action"] == "swap" and pid not in blocked:
                swap_a, swap_b = a.get("target"), a.get("target2")
                break

        def redirect(x):
            if x is None:
                return None
            if swap_a is not None and x == swap_a:
                return swap_b
            if swap_b is not None and x == swap_b:
                return swap_a
            return x

        # 3) Тексерулер
        for pid, a in acts.items():
            if a["action"] != "inspect":
                continue
            if pid in blocked:
                self.inspection_results[pid] = {"target_name": None, "result": "Тексеру сәтсіз болды."}
                continue
            tgt = redirect(a.get("target"))
            if not tgt or not self.players.get(tgt, {}).get("alive"):
                self.inspection_results[pid] = {"target_name": None, "result": "Тексеру сәтсіз болды."}
                continue
            tp = self.players[tgt]
            suspicious = tp["team"] == R.TEAM_HUTOR or tp["role"] == "haosshy"
            self.inspection_results[pid] = {
                "target_name": tp["name"],
                "result": "күдікті" if suspicious else "таза",
            }

        # 4) Қорғау
        protected = set()
        for pid, a in acts.items():
            if a["action"] == "protect" and pid not in blocked:
                tgt = redirect(a.get("target"))
                if tgt:
                    protected.add(tgt)
                self.emshi_last_protect[pid] = a.get("target")
                if a.get("target") == pid:
                    self.emshi_self_used.add(pid)

        # 5) Хуторлық мақсаты
        targets = []
        for pid, a in acts.items():
            if a["action"] == "hutor_target" and pid not in blocked:
                tgt = redirect(a.get("target"))
                if tgt:
                    targets.append(tgt)

        eliminated = None
        if targets:
            counts = {}
            for t in targets:
                counts[t] = counts.get(t, 0) + 1
            top = max(counts.values())
            choices = [t for t, c in counts.items() if c == top]
            chosen = random.choice(choices)
            # 6) Қорғалмаса — ойыннан шығады
            if chosen not in protected and self.players.get(chosen, {}).get("alive"):
                self.players[chosen]["alive"] = False
                eliminated = self.players[chosen]["name"]

        self.last_eliminated = eliminated
        # Таңғы жаңалық
        if eliminated:
            self.morning_news = C.morning_neutral() + " " + C.morning_eliminated(eliminated)
            self.history.append(f"Түнде {eliminated} ойыннан шықты.")
        else:
            self.morning_news = C.morning_safe()
            self.history.append("Түн тыныш өтті.")

        # Өсекшіге кеңес
        for pid in self.alive_ids():
            if self.players[pid]["role"] == "spletni":
                self.osek_clues[pid] = C.osek_clue()

        self._check_winner()
        self.day_number += 1
        if self.winner is not None:
            self._set_phase(GAME_OVER)
        else:
            self._set_phase(MORNING)

    # ---------- дауыс беру ----------
    def vote(self, voter_id, target_id):
        if self.phase != VOTING:
            raise ApiError("Қазір дауыс беру уақыты емес.")
        if voter_id not in self.players or not self.players[voter_id]["alive"]:
            raise ApiError("Тек тірі ойыншы дауыс бере алады.", 403)
        if target_id is not None and (target_id not in self.players or not self.players[target_id]["alive"]):
            raise ApiError("Жарамсыз мақсат.")
        self.votes[voter_id] = target_id  # қайта дауыс берсе — ауысады
        self.touch()
        # барлық тірі адам дауыс берсе — ертерек аяқтау
        if self._all_humans_voted():
            self._resolve_votes()

    def _all_humans_voted(self):
        for pid in self.alive_ids():
            if not self.players[pid]["is_bot"] and pid not in self.votes:
                return False
        return True

    def _bot_votes(self):
        for pid in self.alive_ids():
            p = self.players[pid]
            if not p["is_bot"] or pid in self.votes:
                continue
            others = [x for x in self.alive_ids() if x != pid]
            if not others:
                continue
            # Учаскелік бот күдіктіні тапса — соған
            if p["role"] == "uchastkovyi":
                ins = self.inspection_results.get(pid)
                if ins and ins["result"] == "күдікті" and ins["target_name"]:
                    match = [x for x in others if self.players[x]["name"] == ins["target_name"]]
                    if match:
                        self.votes[pid] = match[0]
                        continue
            # Хутор бот серіктесіне дауыс бермеуге тырысады
            if p["team"] == R.TEAM_HUTOR:
                non_team = [x for x in others if self.players[x]["team"] != R.TEAM_HUTOR]
                others = non_team or others
            # кейде дауыс бермейді
            if random.random() < 0.2:
                self.votes[pid] = None
            else:
                self.votes[pid] = random.choice(others)

    def _resolve_votes(self):
        self._bot_votes()
        tally = {}
        for voter, tgt in self.votes.items():
            if tgt is None:
                continue
            if voter not in self.players or not self.players[voter]["alive"]:
                continue
            if tgt not in self.players or not self.players[tgt]["alive"]:
                continue
            tally[tgt] = tally.get(tgt, 0) + 1

        eliminated_name = None
        if tally:
            top = max(tally.values())
            leaders = [t for t, c in tally.items() if c == top]
            chosen = None
            if len(leaders) == 1:
                chosen = leaders[0]
            else:
                # Тең дауыс — Аким шешеді (тірі әрі дауыс берген болса)
                akim_id = next((pid for pid in self.alive_ids()
                                if self.players[pid]["role"] == "akim"), None)
                if akim_id and self.votes.get(akim_id) in leaders:
                    chosen = self.votes[akim_id]
            if chosen is not None:
                # Аким иммунитеті
                if self.players[chosen]["role"] == "akim" and not self.akim_immunity_used:
                    self.akim_immunity_used = True
                    self.day_result_text = "Акимат жабық. Аким бүгін шықпайды."
                    self.history.append("Аким иммунитетімен аман қалды.")
                else:
                    self.players[chosen]["alive"] = False
                    eliminated_name = self.players[chosen]["name"]
                    self.day_result_text = C.day_result_out(eliminated_name)
                    self.history.append(f"Дауыспен {eliminated_name} ойыннан шықты.")
            else:
                self.day_result_text = C.day_result_none()
                self.history.append("Дауыс тең болды, ешкім шықпады.")
        else:
            self.day_result_text = C.day_result_none()
            self.history.append("Ешкім дауыс алмады.")

        # Дауыс қорытындысын (атаулар бойынша) сақтаймыз
        self.vote_breakdown = sorted(
            [{"name": self.players[t]["name"], "count": c} for t, c in tally.items()],
            key=lambda x: -x["count"],
        )
        self._check_winner()
        self._set_phase(DAY_RESULT)

    # ---------- чат ----------
    def add_chat(self, pid, text):
        if pid not in self.players:
            raise ApiError("Ойыншы табылмады.", 404)
        if self.phase != DISCUSSION:
            raise ApiError("Чат тек талқылау кезінде ашық.")
        if not self.players[pid]["alive"]:
            raise ApiError("Ойыннан шыққан ойыншы хабар жаза алмайды.", 403)
        text = (text or "").strip()[:180]
        if not text:
            raise ApiError("Бос хабар жіберуге болмайды.")
        self.chat.append({"name": self.players[pid]["name"], "text": text, "ts": time.time()})
        self.touch()

    def _maybe_bot_chat(self):
        bots = [self.players[p] for p in self.alive_ids() if self.players[p]["is_bot"]]
        for b in bots:
            if random.random() < 0.5:
                self.chat.append({"name": b["name"], "text": C.bot_chat(), "ts": time.time()})

    # ---------- жеңіс шарты ----------
    def _check_winner(self):
        alive = self.alive_players()
        n = len(alive)
        hutor = [p for p in alive if p["team"] == R.TEAM_HUTOR]
        auyl = [p for p in alive if p["team"] == R.TEAM_AUYL]
        haos = [p for p in alive if p["role"] == "haosshy"]

        # 1) Хаосшы финалда (2 ойыншы) тірі болса — жеке жеңіс
        if haos and n <= 2:
            self.winner = R.TEAM_NEUTRAL
            self.winner_text = "Хаосшы соңына дейін аман қалып, жеке жеңіске жетті!"
            return
        # 2) Хуторлық қалмаса — Ауыл жеңеді
        if not hutor:
            self.winner = R.TEAM_AUYL
            self.winner_text = "Ауыл барлық Хуторлықтарды әшкереледі. Ауыл жеңді!"
            return
        # 3) Хуторлық саны Ауылмен теңессе — Хуторлықтар жеңеді
        if len(hutor) >= len(auyl):
            self.winner = R.TEAM_HUTOR
            self.winner_text = "Хуторлықтар ауылмен теңесіп, ойынды басып алды!"
            return

    # ---------- қалпына келтіру ----------
    def reset(self):
        self.phase = LOBBY
        self.timer_end = None
        self.day_number = 0
        self.night_number = 0
        self.night_actions = {}
        self.votes = {}
        self.chat = []
        self.morning_news = ""
        self.day_result_text = ""
        self.history = []
        self.winner = None
        self.winner_text = ""
        self.osek_clues = {}
        self.inspection_results = {}
        self.emshi_last_protect = {}
        self.emshi_self_used = set()
        self.akim_immunity_used = False
        self.last_eliminated = None
        self.speaking_order = []
        self.discussion_start = None
        self.vote_breakdown = []
        for p in self.players.values():
            p["role"] = None
            p["team"] = None
            p["alive"] = True
        self.touch()

    # ---------- күй (ойыншыға бейімделген) ----------
    def state_for(self, player_id):
        self.maybe_advance()
        me = self.players.get(player_id)
        reveal_all = self.phase == GAME_OVER

        players_view = []
        for pid in self.order:
            p = self.players[pid]
            entry = {
                "id": pid,
                "name": p["name"],
                "is_bot": p["is_bot"],
                "alive": p["alive"],
                "is_host": pid == self.host_id,
                "is_me": pid == player_id,
                "connected": p["connected"],
            }
            if reveal_all and p["role"]:
                role = R.get_role(p["role"])
                entry["role"] = p["role"]
                entry["role_name"] = role["name"]
                entry["team"] = role["team"]
                entry["image"] = role["image"]
            players_view.append(entry)

        state = {
            "code": self.code,
            "phase": self.phase,
            "phase_label": PHASE_LABEL.get(self.phase, self.phase),
            "phase_theme": PHASE_THEME.get(self.phase, "day"),
            "time_left": self.time_left(),
            "phase_duration": PHASE_DURATIONS.get(self.phase),
            "day_number": self.day_number,
            "night_number": self.night_number,
            "host_id": self.host_id,
            "is_host": player_id == self.host_id,
            "player_count": len(self.players),
            "min_players": MIN_PLAYERS,
            "max_players": MAX_PLAYERS,
            "players": players_view,
            "morning_news": self.morning_news if self.phase in (MORNING, DISCUSSION, VOTING, DAY_RESULT) else "",
            "day_result_text": self.day_result_text if self.phase in (DAY_RESULT, GAME_OVER) else "",
            "winner": self.winner,
            "winner_text": self.winner_text,
            "history": self.history[-12:],
            "chat_enabled": self.phase == DISCUSSION,
            "vote_breakdown": self.vote_breakdown if self.phase in (DAY_RESULT, GAME_OVER) else [],
        }

        # Сөйлеу кезегі (талқылау)
        if self.phase == DISCUSSION:
            sp_id, sp_end = self.current_speaker()
            state["current_speaker_id"] = sp_id
            state["current_speaker_name"] = self.players[sp_id]["name"] if sp_id else None
            state["speaking_turn_end"] = int(round(sp_end - time.time())) if sp_end else None
            state["can_chat"] = bool(me and me["alive"])

        # Менің жеке рөлім
        if me and me["role"]:
            role = R.get_role(me["role"])
            state["me"] = {
                "id": me["id"],
                "name": me["name"],
                "role": me["role"],
                "role_name": role["name"],
                "team": role["team"],
                "image": role["image"],
                "ability": role["ability"],
                "night_action": role["night_action"],
                "alive": me["alive"],
            }
            # Хуторлықтар бір-бірін біледі
            if me["team"] == R.TEAM_HUTOR and self.phase not in (LOBBY,):
                mates = [self.players[p]["name"] for p in self.order
                         if self.players[p]["team"] == R.TEAM_HUTOR and p != player_id]
                state["me"]["teammates"] = mates
            # Тексеру нәтижесі (Учаскелік)
            if me["role"] == "uchastkovyi" and player_id in self.inspection_results:
                state["me"]["inspection"] = self.inspection_results[player_id]
            # Өсекші кеңесі
            if me["role"] == "spletni" and player_id in self.osek_clues:
                state["me"]["clue"] = self.osek_clues[player_id]
            # Менің түнгі әрекетім жіберілді ме
            state["me"]["action_submitted"] = player_id in self.night_actions
            # Бандит team target таңдай ала ма
            if me["role"] == "bandit":
                state["me"]["can_target"] = not self._other_hutor_alive(player_id)
        elif me:
            state["me"] = {"id": me["id"], "name": me["name"], "alive": me["alive"], "role": None}

        # Түнгі әрекет прогресі (хостқа/барлығына сан)
        if self.phase == NIGHT:
            need = len(self._roles_requiring_action())
            done = sum(1 for pid in self._roles_requiring_action() if pid in self.night_actions)
            state["night_progress"] = {"done": done, "need": need}

        # Дауыс беру: кім дауыс берді (мақсатты жасырамыз)
        if self.phase == VOTING:
            voted = [self.players[v]["name"] for v in self.votes
                     if v in self.players and self.players[v]["alive"]]
            state["voted_names"] = voted
            state["my_vote"] = self.votes.get(player_id)

        # Чат (өлгендер оқи алады, жаза алмайды)
        if self.phase in (DISCUSSION, VOTING, DAY_RESULT, GAME_OVER):
            state["chat"] = [{"name": m["name"], "text": m["text"]} for m in self.chat[-50:]]
            state["quick_messages"] = C.QUICK_MESSAGES

        return state


class RoomManager:
    def __init__(self):
        self.rooms = {}
        self.lock = threading.Lock()

    def create_room(self, host_name):
        with self.lock:
            self._cleanup()
            code = _gen_code()
            while code in self.rooms:
                code = _gen_code()
            host_id = _gen_id()
            room = Room(code, host_id, (host_name or "Хост").strip()[:20] or "Хост")
            self.rooms[code] = room
            return room, host_id

    def get(self, code):
        room = self.rooms.get((code or "").upper())
        if not room:
            raise ApiError("Бөлме табылмады.", 404)
        return room

    def _cleanup(self):
        now = time.time()
        dead = [c for c, r in self.rooms.items() if now - r.last_active > ROOM_TTL]
        for c in dead:
            del self.rooms[c]


manager = RoomManager()
