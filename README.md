Run server (development)

- Install deps: `pip install -r server/requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2`
- Env (optional):
  - `DATABASE_URL` (default sqlite file `server/data.db`)
  - `CORS_ORIGINS` (default `*`)

Endpoints

- POST /register { email }
- POST /score { email, score }
- GET /leaderboard -> top 10
- GET /events -> SSE real-time leaderboard
- GET /healthz -> liveness probe
