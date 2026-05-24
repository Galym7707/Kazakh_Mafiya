"""Қарапайым симуляция тесті — логиканы тексеру (CI емес)."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.game import manager, NIGHT, VOTING, DISCUSSION, GAME_OVER, ROLE_REVEAL, ApiError


def run_one(num_players):
    room, host = manager.create_room("Хост")
    ids = [host]
    for i in range(num_players - 1):
        ids.append(room.add_bot())
    room.start()
    assert room.phase == ROLE_REVEAL
    # Барлық рөл таратылды ма
    assert all(room.players[p]["role"] for p in ids)

    guard = 0
    while room.phase != GAME_OVER and guard < 200:
        guard += 1
        # Хост тұрғыны болмаса да, host_id арқылы келесіге өтеміз
        st = room.state_for(host)
        phase = room.phase
        if phase == NIGHT:
            # адам хост әрекет жасайды (бар болса)
            me = st.get("me", {})
            if me.get("alive") and (me.get("night_action") or me.get("can_target")):
                alive = [p["id"] for p in st["players"] if p["alive"] and p["id"] != host]
                if alive:
                    act = me["night_action"] or "hutor_target"
                    try:
                        if act == "swap" and len(alive) >= 2:
                            room.submit_action(host, "swap", alive[0], alive[1])
                        elif act == "block":
                            room.submit_action(host, "block", alive[0])
                        else:
                            room.submit_action(host, act if act != "block" else "hutor_target", alive[0])
                    except ApiError:
                        # ереже бойынша жарамсыз (мыс. екі түн қатар қорғау) — өткіземіз
                        pass
            # таймерді мәжбүрлеп аяқтау
            room.timer_end = 0
            room.maybe_advance()
        elif phase == VOTING:
            me = st.get("me", {})
            if me.get("alive"):
                alive = [p["id"] for p in st["players"] if p["alive"] and p["id"] != host]
                if alive:
                    room.vote(host, alive[0])
            room.timer_end = 0
            room.maybe_advance()
        else:
            room.timer_end = 0
            room.maybe_advance()

    assert room.phase == GAME_OVER, f"{num_players} ойыншы: ойын аяқталмады (guard={guard})"
    assert room.winner in ("Ауыл", "Хуторлықтар", "Бейтарап"), f"winner={room.winner}"
    print(f"  {num_players} ойыншы -> жеңімпаз: {room.winner} ({guard} қадам)")


if __name__ == "__main__":
    print("Симуляция тесті басталды...")
    for n in range(4, 11):
        for _ in range(20):
            run_one(n)
    print("OK — барлық симуляциялар сәтті аяқталды.")
