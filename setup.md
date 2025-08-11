# PY-SON Snake Game 설치 및 실행 가이드

Python으로 만든 스네이크 게임입니다. FastAPI 백엔드와 HTML5 Canvas 프론트엔드로 구성되어 있습니다.

## 주요 기능

- 아름다운 게임 오버 화면
- 픽셀 아트 이미지 (뱀과 파이 조각)
- 반응형 디자인 (모바일/데스크톱 지원)
- 실시간 리더보드
- 점수 저장 기능
- 점진적 난이도 (점수에 따른 속도 증가)

## 설치 및 실행

### 1. 프로젝트 폴더로 이동

```bash
cd Documents/studyProjects/snake_game
```

### 2. 가상환경 활성화

```bash
source .venv/bin/activate
```

### 3. 필요한 패키지 설치

```bash
pip install -r requirements.txt
```

### 4. 서버 실행

```bash
python -m uvicorn server.app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 게임 접속

브라우저에서 http://localhost:8000 으로 접속하세요!

## 게임 조작법

- **방향키** 또는 **WASD**: 뱀 이동
- **P**: 일시정지/재개
- **R**: 게임 재시작
- **F**: 전체화면 토글

## 게임 규칙

- 파이 조각을 먹어서 뱀을 성장시키세요
- 벽이나 자신의 몸에 부딪히면 게임 오버
- 먹이 하나당 10점 획득
- 점수가 올라갈수록 속도가 증가

## 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 다른 포트 사용
python -m uvicorn server.app.main:app --reload --port 8001

# 또는 기존 프로세스 종료
lsof -ti:8000 | xargs kill -9
```

### 가상환경 비활성화

```bash
deactivate
```

## 프로젝트 구조

```
snake_game/
├── server/
│   ├── app/              # FastAPI 서버 코드
│   ├── static/           # 게임 파일들
│   │   ├── game.html     # 게임 페이지
│   │   ├── img/          # 게임 이미지들
│   │   └── style.css     # 스타일시트
│   └── config/           # 게임 설정
├── requirements.txt      # Python 패키지 목록
└── setup.md             # 이 파일
```

## 접속 URL

- **메인 페이지**: http://localhost:8000
- **게임 페이지**: http://localhost:8000/game.html
- **API 문서**: http://localhost:8000/docs

---

즐거운 게임 되세요!
