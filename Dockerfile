# 파이썬 3.10-slim 이미지를 사용
FROM python:3.10-slim

# 작업 디렉토리를 /app으로 설정
WORKDIR /app

# requirements.txt 파일을 복사
COPY requirements.txt .

# 파이썬 라이브러리들을 설치
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 소스코드를 컨테이너의 /app 디렉토리로 복사
COPY . .

# 컨테이너가 시작될 때 Uvicorn을 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
