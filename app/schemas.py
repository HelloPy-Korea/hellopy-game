from pydantic import BaseModel, EmailStr, Field
from typing import List
from datetime import datetime

class RegisterEmailRequest(BaseModel):
    email: EmailStr = Field(..., description="사용자 이메일 주소")

class RegisterEmailResponse(BaseModel):
    ok: bool

class SubmitScoreRequest(BaseModel):
    email: EmailStr
    score: int = Field(ge=0)

class ScoreItem(BaseModel):
    email: EmailStr
    score: int
    created_at: datetime

class LeaderboardResponse(BaseModel):
    top: List[ScoreItem]


# Users
class UserItem(BaseModel):
    email: EmailStr
    created_at: datetime

# Users with stats
class UserWithStats(BaseModel):
    email: EmailStr
    created_at: datetime
    max_score: int
    game_count: int
