class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            // 안전장치: 캔버스가 없다면 최소 구성 생성
            const fallback = document.createElement('div');
            fallback.style.display = 'flex';
            fallback.style.width = '100%';
            fallback.style.height = '100vh';
            fallback.style.alignItems = 'center';
            fallback.style.justifyContent = 'center';
            const c = document.createElement('canvas');
            c.id = 'gameCanvas';
            c.width = 600;
            c.height = 400;
            c.style.background = '#000';
            fallback.appendChild(c);
            document.body.appendChild(fallback);
            this.canvas = c;
        }
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverElement = document.getElementById('gameOver');
        // this.userEmailElement = document.getElementById('userEmail');
        
        // 게임 설정
        this.cellSize = 20;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.fps = 10;
        this.lastUpdate = 0;
        this.scorePerFood = 10;
        this.foodRange = 3;
        this.baseFps = this.fps;
        
        // 게임 상태
        this.snake = [{x: 100, y: 100}];
        this.direction = {x: this.cellSize, y: 0};
        this.food = this.generateFood();
        this.score = 0;
        this.userEmail = '';
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gamePaused = false;
        
        // 성능 최적화
        this.animationId = null;
        
        // 이벤트 리스너
        this.setupEventListeners();
        this.setupHotkeys();

        // 스네이크 캐릭터 이미지 로드 (py_0)
        this.snakeImage = new Image();
        this.snakeImageLoaded = false;
        this.snakeImage.onload = () => { this.snakeImageLoaded = true; };
        this.snakeImage.src = '/img/py_0.png';
        
        // 초기화 (설정 로드 후 처리)
        this.loadConfig().then(() => {
            this.updateHighScore();
            this.draw();
        }).catch(() => {
            this.updateHighScore();
            this.draw();
        });
    }

    async loadConfig() {
        try {
            const res = await fetch('/config/config.json', { cache: 'no-store' });
            if (!res.ok) return;
            const cfg = await res.json();
            // 크기
            const w = Number(cfg.width);
            const h = Number(cfg.height);
            if (Number.isFinite(w) && Number.isFinite(h)) {
                this.width = w; this.height = h;
                this.canvas.width = w; this.canvas.height = h;
            }
            // 셀, FPS, 점수/먹이 범위
            const cs = Number(cfg.cellSize);
            if (Number.isFinite(cs)) this.cellSize = cs;
            const f = Number(cfg.fps);
            if (Number.isFinite(f)) { this.fps = f; this.baseFps = f; }
            const sp = Number(cfg.scorePerFood);
            if (Number.isFinite(sp)) this.scorePerFood = sp;
            const fr = Number(cfg.foodRange);
            if (Number.isFinite(fr)) this.foodRange = fr;
        } catch {}
    }

    setupHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            } else if (e.key === 'r' || e.key === 'R') {
                this.restartGame();
                this.startGame();
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            }
        });
    }
    
    setupEventListeners() {
        // 키보드 이벤트 - 전역에서 처리
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            // 방향키만 기본 이벤트 방지
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
                e.preventDefault();
            }
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction.y === 0) {
                        this.direction = {x: 0, y: -this.cellSize};
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction.y === 0) {
                        this.direction = {x: 0, y: this.cellSize};
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction.x === 0) {
                        this.direction = {x: -this.cellSize, y: 0};
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction.x === 0) {
                        this.direction = {x: this.cellSize, y: 0};
                    }
                    break;
            }
        });
        
        // 캔버스에도 키보드 이벤트 추가
        this.canvas.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            // 방향키만 기본 이벤트 방지
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
                e.preventDefault();
            }
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction.y === 0) {
                        this.direction = {x: 0, y: -this.cellSize};
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction.y === 0) {
                        this.direction = {x: 0, y: this.cellSize};
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction.x === 0) {
                        this.direction = {x: -this.cellSize, y: 0};
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction.x === 0) {
                        this.direction = {x: this.cellSize, y: 0};
                    }
                    break;
            }
        });
        
        // 터치 이벤트 (모바일용)
        this.setupTouchControls();
        
        // 확대/축소 방지
        this.preventZoom();
        
        // 이메일 등록 & 로그아웃(변경)
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
        
        // 게임 버튼 이벤트
        const startBtn = document.getElementById('startBtn');
        if (startBtn) startBtn.addEventListener('click', () => {
            // 로그인 화면이 보이는 상태면, 이메일 입력 없이 게스트로 바로 시작
            const loginScreen = document.getElementById('loginScreen');
            if (!loginScreen.classList.contains('hidden')) {
                // 게스트로 바로 시작 (백엔드 제출은 하지 않음)
                this.userEmail = '';
                const label = document.getElementById('userEmail');
                if (label) label.textContent = '게스트';
                this.showGameScreen();
            }
            this.startGame();
        });
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        // 모바일 컨트롤 버튼 이벤트
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameRunning) return;
                
                const direction = e.target.dataset.direction;
                switch(direction) {
                    case 'up':
                        if (this.direction.y === 0) {
                            this.direction = {x: 0, y: -this.cellSize};
                        }
                        break;
                    case 'down':
                        if (this.direction.y === 0) {
                            this.direction = {x: 0, y: this.cellSize};
                        }
                        break;
                    case 'left':
                        if (this.direction.x === 0) {
                            this.direction = {x: -this.cellSize, y: 0};
                        }
                        break;
                    case 'right':
                        if (this.direction.x === 0) {
                            this.direction = {x: this.cellSize, y: 0};
                        }
                        break;
                }
            });
        });
    }
    
    setupTouchControls() {
        let startX, startY;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // 최소 스와이프 거리
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 가로 스와이프
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0 && this.direction.x === 0) {
                        // 오른쪽
                        this.direction = {x: this.cellSize, y: 0};
                    } else if (deltaX < 0 && this.direction.x === 0) {
                        // 왼쪽
                        this.direction = {x: -this.cellSize, y: 0};
                    }
                }
            } else {
                // 세로 스와이프
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0 && this.direction.y === 0) {
                        // 아래쪽
                        this.direction = {x: 0, y: this.cellSize};
                    } else if (deltaY < 0 && this.direction.y === 0) {
                        // 위쪽
                        this.direction = {x: 0, y: -this.cellSize};
                    }
                }
            }
        });
        
        // 캔버스에 포커스 설정
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.style.outline = 'none';
        
        // 게임 시작 시 캔버스에 포커스
        document.getElementById('startBtn').addEventListener('click', () => {
            setTimeout(() => {
                this.canvas.focus();
            }, 100);
        });
        
        // 게임 재시작 시 캔버스에 포커스
        document.getElementById('restartBtn').addEventListener('click', () => {
            setTimeout(() => {
                this.canvas.focus();
            }, 100);
        });
        
        // 초기 포커스 설정
        setTimeout(() => {
            this.canvas.focus();
        }, 500);
    }
    
    preventZoom() {
        // 핀치 줌 방지
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
        
        // 더블탭 줌 방지
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // 키보드 확대/축소 방지
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
                e.preventDefault();
            }
        });
    }
    
    generateFood() {
        let x, y;
        const range = this.foodRange; // 설정 기반 범위
        
        // 뱀 머리 위치
        const headX = this.snake[0].x;
        const headY = this.snake[0].y;
        
        // 뱀 머리 주변 범위 내에서 랜덤 위치 생성
        const minX = Math.max(0, headX - (range * this.cellSize));
        const maxX = Math.min(this.width - this.cellSize, headX + (range * this.cellSize));
        const minY = Math.max(0, headY - (range * this.cellSize));
        const maxY = Math.min(this.height - this.cellSize, headY + (range * this.cellSize));
        
        // 범위 내에서 랜덤 위치 선택
        x = Math.floor(Math.random() * ((maxX - minX) / this.cellSize + 1)) * this.cellSize + minX;
        y = Math.floor(Math.random() * ((maxY - minY) / this.cellSize + 1)) * this.cellSize + minY;
        
        // 뱀 몸통과 겹치지 않는지 확인
        while (this.snake.some(segment => segment.x === x && segment.y === y)) {
            x = Math.floor(Math.random() * ((maxX - minX) / this.cellSize + 1)) * this.cellSize + minX;
            y = Math.floor(Math.random() * ((maxY - minY) / this.cellSize + 1)) * this.cellSize + minY;
        }
        
        return {x, y};
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOverElement.classList.add('hidden');
        this.lastUpdate = performance.now();
        
        // 게임 시작 시 캔버스에 포커스
        setTimeout(() => {
            this.canvas.focus();
        }, 100);
        
        this.gameLoop(this.lastUpdate);
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.lastUpdate = performance.now();
            this.gameLoop(this.lastUpdate);
        } else {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }
    
    gameLoop(currentTime) {
        if (!this.gameRunning || this.gamePaused) return;
        
        // FPS 제한을 위한 시간 체크
        if (currentTime - this.lastUpdate >= 1000 / this.fps) {
            this.update();
            this.draw();
            this.lastUpdate = currentTime;
        }
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // 뱀 머리 이동
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };
        
        // 충돌 검사
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // 먹이 먹었는지 검사
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += this.scorePerFood;
            this.food = this.generateFood();
            this.updateScore();
            
            // 속도 증가
            if (this.score % (this.scorePerFood * 5) === 0) {
                this.fps = Math.min(this.fps + 1, this.baseFps + 10);
            }
        } else {
            this.snake.pop();
        }
    }
    
    checkCollision(head) {
        // 벽 충돌
        if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
            return true;
        }
        
        // 자기 몸 충돌
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }
    
    draw() {
        // 배경 지우기
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 먹이 그리기
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(this.food.x, this.food.y, this.cellSize, this.cellSize);
        
        // 뱀 그리기 (초록색 네모 → py_0 이미지)
        this.snake.forEach((segment) => {
            if (this.snakeImageLoaded) {
                this.ctx.drawImage(this.snakeImage, segment.x, segment.y, this.cellSize, this.cellSize);
            } else {
                // 이미지 로딩 전에는 기존 사각형으로 표시 (임시)
                this.ctx.fillStyle = '#00cc00';
                this.ctx.fillRect(segment.x, segment.y, this.cellSize, this.cellSize);
            }
        });
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            const key = this.userEmail ? `snakeHighScore_${this.userEmail}` : 'snakeHighScore_guest';
            localStorage.setItem(key, this.highScore);
        }
    }
    
    // 로그인 관련 메서드들
    handleLogin() {
        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === '') {
            // 게스트로 시작
            this.userEmail = 'guest@local';
            localStorage.removeItem('snakeUserEmail');
            this.highScore = Number(localStorage.getItem('snakeHighScore_guest') || 0);
            this.updateHighScore();
            this.userEmailElement = document.getElementById('userEmail');
            if (this.userEmailElement) this.userEmailElement.textContent = '게스트';
            this.showGameScreen();
            this.startGame();
            return;
        }

        if (!emailRegex.test(email)) {
            alert('올바른 이메일 형식을 입력해주세요. (또는 비워두고 게스트로 시작)');
            emailInput.focus();
            return;
        }

        // 서버 등록
        registerEmail(email)
            .then(() => {
                this.userEmail = email;
                localStorage.setItem('snakeUserEmail', email);
                this.highScore = Number(localStorage.getItem(`snakeHighScore_${email}`) || 0);
                this.updateHighScore();
                this.userEmailElement = document.getElementById('userEmail');
                this.userEmailElement.textContent = email;
                this.showGameScreen();
                this.startGame();
            })
            .catch((err) => {
                console.error(err);
                alert('서버 연결에 실패했습니다. 다시 시도해 주세요.');
            });
    }
    
    handleLogout() {
        this.showLoginScreen();
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.userEmail = '';
        this.userEmailElement = document.getElementById('userEmail');
        this.userEmailElement.textContent = '';
        document.getElementById('email').value = '';
    }
    
    showGameScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
    }
    
    showLoginScreen() {
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    gameOver() {
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');

        // 키오스크 모드에서 자동 재시작 옵션
        if (window.__kioskAutoRestart) {
            setTimeout(() => {
                this.restartGame();
                this.startGame();
            }, window.__kioskAutoRestartDelayMs || 2000);
        }

        // 서버에 점수 제출
        if (this.userEmail && this.userEmail !== 'guest@local') {
            submitScore(this.userEmail, this.score).catch(() => {
                // Ignore errors during booth play
            });
        }
    }
    
    restartGame() {
        this.snake = [{x: 100, y: 100}];
        this.direction = {x: this.cellSize, y: 0};
        this.food = this.generateFood();
        this.score = 0;
        this.fps = 10;
        this.updateScore();
        this.gameOverElement.classList.add('hidden');
        
        // 게임 재시작 시 캔버스에 포커스
        setTimeout(() => {
            this.canvas.focus();
        }, 100);
        
        this.draw();
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();

    // game.html은 순수 플레이 화면이므로 즉시 표시 보장
    game.showGameScreen();
    setTimeout(() => game.canvas && game.canvas.focus(), 100);

    // 키오스크 모드 쿼리 파라미터 처리
    const params = new URLSearchParams(window.location.search);
    // 저장된 이메일 자동 로드 (선택: remember=1 일 때만)
    if (params.get('remember') === '1') {
        const saved = localStorage.getItem('snakeUserEmail');
        if (saved) {
            game.userEmail = saved;
            const label = document.getElementById('userEmail');
            if (label) label.textContent = saved;
            game.showGameScreen();
        }
    }

    
    const kiosk = params.get('kiosk');
    if (kiosk) {
        // 키오스크: 자동 전체화면, 자동 시작, 자동 재시작 옵션
        requestFullscreen(document.documentElement).catch(() => {});
        window.__kioskAutoRestart = true;
        const delay = parseInt(params.get('delay') || '1500', 10);
        window.__kioskAutoRestartDelayMs = Number.isFinite(delay) ? delay : 1500;
        setTimeout(() => game.startGame(), 400);
    }

    // 전체화면 버튼
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => toggleFullscreen());
    }
}); 

// Backend integration
const API_BASE = (function() {
    // Allow override via ?api=URL
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('api');
    if (fromParam) return fromParam.replace(/\/$/, '');
    // default to same-origin server on / (CORS-enabled)
    return '';
})();

function registerEmail(email) {
    return fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    }).then(r => {
        if (!r.ok) throw new Error('Failed to register');
        return r.json();
    });
}

function submitScore(email, score) {
    return fetch(`${API_BASE}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, score })
    }).then(r => {
        if (!r.ok) throw new Error('Failed to submit score');
        return r.json();
    });
}

// 전체화면 토글 유틸
function requestFullscreen(element) {
    if (element.requestFullscreen) return element.requestFullscreen();
    if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
    if (element.msRequestFullscreen) return element.msRequestFullscreen();
    return Promise.reject();
}

function exitFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
}

function toggleFullscreen() {
    const isFull = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (isFull) {
        exitFullscreen();
    } else {
        requestFullscreen(document.documentElement).catch(() => {});
    }
}