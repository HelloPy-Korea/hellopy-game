import asyncio
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from .models import User, Score
from .schemas import (
    RegisterEmailRequest,
    RegisterEmailResponse,
    SubmitScoreRequest,
    LeaderboardResponse,
    ScoreItem,
    UserItem,
)

# Simple in-memory broadcaster for SSE
class Broadcaster:
    def __init__(self) -> None:
        self._subscribers: List[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        try:
            self._subscribers.remove(q)
        except ValueError:
            pass

    async def publish(self, event: dict) -> None:
        for q in list(self._subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                # Skip slow consumers
                pass

broadcaster = Broadcaster()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(lifespan=lifespan)

# CORS for local dev and kiosk
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=RegisterEmailResponse)
def register_email(payload: RegisterEmailRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    
    # 이메일 유효성 검사
    if not email:
        raise HTTPException(status_code=400, detail="이메일을 입력해주세요")
    
    import re
    email_regex = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    if not email_regex.match(email):
        raise HTTPException(status_code=400, detail="올바른 이메일 형식을 입력해주세요")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
    return RegisterEmailResponse(ok=True)

# Duplicate endpoints under /game prefix for environments where backend is routed behind /game
@app.post("/game/register", response_model=RegisterEmailResponse)
def register_email_game(payload: RegisterEmailRequest, db: Session = Depends(get_db)):
    return register_email(payload, db)

@app.post("/score")
async def submit_score(payload: SubmitScoreRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if not db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email not registered")

    score = Score(user_email=email, score=payload.score)
    db.add(score)
    db.commit()

    # Publish leaderboard update
    await publish_leaderboard()
    return {"ok": True}

@app.post("/game/score")
async def submit_score_game(payload: SubmitScoreRequest, db: Session = Depends(get_db)):
    return await submit_score(payload, db)

async def publish_leaderboard():
    db = SessionLocal()
    try:
        # Top 10 all-time and top for current hour
        top_all = (
            db.query(Score)
            .order_by(Score.score.desc(), Score.created_at.asc())
            .limit(10)
            .all()
        )
        now = datetime.utcnow()
        hour_start = now.replace(minute=0, second=0, microsecond=0)
        top_hour = (
            db.query(Score)
            .filter(Score.created_at >= hour_start)
            .order_by(Score.score.desc(), Score.created_at.asc())
            .limit(10)
            .all()
        )

        def serialize(rows: List[Score]):
            return [
                {
                    "email": r.user_email,
                    "score": r.score,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in rows
            ]

        event = {
            "type": "leaderboard",
            "all_time": serialize(top_all),
            "this_hour": serialize(top_hour),
            "ts": datetime.utcnow().isoformat(),
        }
        await broadcaster.publish(event)
    finally:
        db.close()

@app.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(db: Session = Depends(get_db)):
    top = (
        db.query(Score)
        .order_by(Score.score.desc(), Score.created_at.asc())
        .limit(10)
        .all()
    )

@app.get("/game/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard_game(db: Session = Depends(get_db)):
    return get_leaderboard(db)
    return LeaderboardResponse(
        top=[
            ScoreItem(email=r.user_email, score=r.score, created_at=r.created_at)
            for r in top
        ]
    )


@app.get("/users", response_model=List[UserItem])
def list_users(limit: int = 100, db: Session = Depends(get_db)):
    rows = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(max(1, min(limit, 1000)))
        .all()
    )
    return [UserItem(email=r.email, created_at=r.created_at) for r in rows]

@app.get("/game/users", response_model=List[UserItem])
def list_users_game(limit: int = 100, db: Session = Depends(get_db)):
    return list_users(limit=limit, db=db)

@app.get("/user-scores")
def get_user_scores(email: str, db: Session = Depends(get_db)):
    """특정 사용자의 모든 점수를 가져옵니다."""
    scores = db.query(Score).filter(Score.user_email == email.lower().strip()).order_by(Score.created_at.desc()).all()
    return [
        {
            "score": score.score,
            "created_at": score.created_at.isoformat() if score.created_at else None
        }
        for score in scores
    ]

@app.get("/game/user-scores")
def get_user_scores_game(email: str, db: Session = Depends(get_db)):
    return get_user_scores(email=email, db=db)

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/game/healthz")
def healthz_game():
    return healthz()

# Serve frontend from server/static
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
CONFIG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "config"))

INDEX_HTML = os.path.join(STATIC_DIR, "index.html")
GAME_HTML = os.path.join(STATIC_DIR, "game.html")
USERS_HTML = os.path.join(STATIC_DIR, "users.html")

@app.get("/game", include_in_schema=False)
def serve_game_home():
    return FileResponse(INDEX_HTML)

@app.get("/game/", include_in_schema=False)
def serve_game_home_slash():
    return FileResponse(INDEX_HTML)

@app.get("/game/play", include_in_schema=False)
def serve_game_play():
    return FileResponse(GAME_HTML)

@app.get("/game/play/", include_in_schema=False)
def serve_game_play_slash():
    return FileResponse(GAME_HTML)

@app.get("/game/user", include_in_schema=False)
def serve_game_user():
    return FileResponse(USERS_HTML)

@app.get("/game/user/", include_in_schema=False)
def serve_game_user_slash():
    return FileResponse(USERS_HTML)

# Mount more specific paths first so they take precedence
app.mount("/config", StaticFiles(directory=CONFIG_DIR, html=False), name="config")
app.mount("/game/config", StaticFiles(directory=CONFIG_DIR, html=False), name="config_game")
app.mount("/game/", StaticFiles(directory=STATIC_DIR, html=True), name="frontend")
# Serve root-scoped assets used by pages (e.g., /style.css, /landing.js, /img/...)
app.mount("/", StaticFiles(directory=STATIC_DIR, html=False), name="assets")
