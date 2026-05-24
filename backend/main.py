"""Ауыл Mafia — FastAPI backend (HTTP polling, in-memory)."""
import os

from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .game import manager, ApiError

app = FastAPI(title="Ауыл Mafia", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiError)
async def api_error_handler(request, exc: ApiError):
    return JSONResponse(status_code=exc.status, content={"error": exc.message})


# ---------------- API ----------------
@app.post("/api/rooms")
def create_room(payload: dict = Body(default={})):
    room, host_id = manager.create_room(payload.get("name"))
    return {"room_code": room.code, "player_id": host_id, "state": room.state_for(host_id)}


@app.post("/api/rooms/{room_code}/join")
def join_room(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    pid = room.join(payload.get("name"))
    return {"room_code": room.code, "player_id": pid, "state": room.state_for(pid)}


@app.post("/api/rooms/{room_code}/add-bot")
def add_bot(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    requester = payload.get("player_id")
    if requester != room.host_id:
        raise ApiError("Тек хост бот қоса алады.", 403)
    room.add_bot()
    return {"state": room.state_for(requester)}


@app.post("/api/rooms/{room_code}/remove")
def remove_player(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    requester = payload.get("player_id")
    target = payload.get("target_id")
    if requester != room.host_id:
        raise ApiError("Тек хост ойыншыны өшіре алады.", 403)
    room.remove_player(target)
    return {"state": room.state_for(requester)}


@app.post("/api/rooms/{room_code}/start")
def start_game(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    requester = payload.get("player_id")
    if requester != room.host_id:
        raise ApiError("Тек хост ойынды бастай алады.", 403)
    room.start()
    return {"state": room.state_for(requester)}


@app.get("/api/rooms/{room_code}/state")
def get_state(room_code: str, player_id: str = ""):
    room = manager.get(room_code)
    return {"state": room.state_for(player_id)}


@app.post("/api/rooms/{room_code}/action")
def submit_action(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    pid = payload.get("player_id")
    room.submit_action(pid, payload.get("action"), payload.get("target"), payload.get("target2"))
    return {"state": room.state_for(pid)}


@app.post("/api/rooms/{room_code}/vote")
def vote(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    pid = payload.get("player_id")
    room.vote(pid, payload.get("target"))
    return {"state": room.state_for(pid)}


@app.post("/api/rooms/{room_code}/chat")
def chat(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    pid = payload.get("player_id")
    room.add_chat(pid, payload.get("text"))
    return {"state": room.state_for(pid)}


@app.post("/api/rooms/{room_code}/next")
def next_phase(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    pid = payload.get("player_id")
    room.next_phase(pid)
    return {"state": room.state_for(pid)}


@app.post("/api/rooms/{room_code}/reset")
def reset(room_code: str, payload: dict = Body(default={})):
    room = manager.get(room_code)
    pid = payload.get("player_id")
    if pid != room.host_id:
        raise ApiError("Тек хост қайта бастай алады.", 403)
    room.reset()
    return {"state": room.state_for(pid)}


@app.get("/api/health")
def health():
    return {"ok": True, "rooms": len(manager.rooms)}


# ---------------- Статикалық frontend ----------------
_STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
_STATIC_DIR = os.path.abspath(_STATIC_DIR)

if os.path.isdir(_STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(_STATIC_DIR, "assets")), name="assets")
    if os.path.isdir(os.path.join(_STATIC_DIR, "roles")):
        app.mount("/roles", StaticFiles(directory=os.path.join(_STATIC_DIR, "roles")), name="roles")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        candidate = os.path.join(_STATIC_DIR, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(_STATIC_DIR, "index.html"))
