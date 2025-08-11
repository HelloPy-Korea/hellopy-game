from sqlalchemy import Column, Integer, String, DateTime, func, Index, text
from datetime import datetime, timezone, timedelta
from .database import Base

def kst_now():
    """한국 표준시(KST) 현재 시간을 반환합니다."""
    utc_now = datetime.now(timezone.utc)
    kst = timezone(timedelta(hours=9))
    return utc_now.astimezone(kst)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("(datetime('now', '+9 hours'))"))

class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), index=True, nullable=False)
    score = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("(datetime('now', '+9 hours'))"))

Index("idx_scores_email_created", Score.user_email, Score.created_at.desc())
