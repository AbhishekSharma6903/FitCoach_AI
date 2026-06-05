#!/usr/bin/env bash
# dev.sh — start or stop the FitCoach AI development stack
#
# Usage:
#   ./dev.sh start   — start Postgres, backend, frontend
#   ./dev.sh stop    — stop all three
#   ./dev.sh status  — show what is running

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_LOG=/tmp/fitcoach_backend.log
FRONTEND_LOG=/tmp/fitcoach_frontend.log
BACKEND_PID_FILE=/tmp/fitcoach_backend.pid
FRONTEND_PID_FILE=/tmp/fitcoach_frontend.pid

# ── helpers ──────────────────────────────────────────────────────────────────

green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
cyan()  { printf '\033[0;36m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n'   "$*"; }

wait_for_url() {
  local url=$1 label=$2 max=${3:-30}
  printf "  Waiting for %s " "$label"
  for i in $(seq 1 "$max"); do
    if curl -sf --max-time 2 "$url" -o /dev/null 2>/dev/null; then
      printf ' ✓\n'; return 0
    fi
    printf '.'
    sleep 1
  done
  printf ' ✗\n'; return 1
}

# ── start ─────────────────────────────────────────────────────────────────────

cmd_start() {
  bold "=== Starting FitCoach AI ==="

  # 1. Docker Desktop
  if ! docker info &>/dev/null; then
    cyan "→ Starting Docker Desktop..."
    open -a Docker
    printf "  Waiting for Docker daemon"
    for i in $(seq 1 24); do
      docker info &>/dev/null && printf ' ✓\n' && break
      printf '.'; sleep 5
    done
    docker info &>/dev/null || { red "Docker failed to start. Aborting."; exit 1; }
  else
    green "→ Docker already running"
  fi

  # 2. Postgres
  cyan "→ Starting Postgres (docker-compose)..."
  docker-compose -f "$ROOT/docker-compose.yml" up -d 2>&1 | grep -v "^time="
  wait_for_url "http://localhost:5433" "Postgres" 20 || true  # port check optional

  # 3. Backend
  if lsof -i :8000 -sTCP:LISTEN &>/dev/null; then
    green "→ Backend already running on :8000"
  else
    cyan "→ Starting FastAPI backend..."
    cd "$ROOT/backend"
    source .venv/bin/activate 2>/dev/null || true
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
      > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    wait_for_url "http://localhost:8000/health" "backend" 30 \
      || { red "Backend failed to start. Check $BACKEND_LOG"; exit 1; }
  fi

  # 4. Frontend
  if lsof -i :3000 -sTCP:LISTEN &>/dev/null; then
    green "→ Frontend already running on :3000"
  else
    cyan "→ Starting Next.js frontend..."
    cd "$ROOT/frontend"
    nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    wait_for_url "http://localhost:3000/sign-in" "frontend" 60 \
      || { red "Frontend failed to start. Check $FRONTEND_LOG"; exit 1; }
  fi

  echo ""
  bold "=== All services up ==="
  green "  Frontend  →  http://localhost:3000"
  green "  Backend   →  http://localhost:8000"
  green "  Postgres  →  localhost:5433"
  echo ""
  echo "  Logs:  tail -f $BACKEND_LOG"
  echo "         tail -f $FRONTEND_LOG"
}

# ── stop ──────────────────────────────────────────────────────────────────────

cmd_stop() {
  bold "=== Stopping FitCoach AI ==="

  # Frontend
  if [ -f "$FRONTEND_PID_FILE" ]; then
    PID=$(cat "$FRONTEND_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      cyan "→ Stopping frontend (PID $PID)..."
      kill "$PID" 2>/dev/null || true
      rm -f "$FRONTEND_PID_FILE"
    fi
  fi
  # Kill any stray next dev processes
  pkill -f "next dev" 2>/dev/null || true
  green "  Frontend stopped"

  # Backend
  if [ -f "$BACKEND_PID_FILE" ]; then
    PID=$(cat "$BACKEND_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      cyan "→ Stopping backend (PID $PID)..."
      kill "$PID" 2>/dev/null || true
      rm -f "$BACKEND_PID_FILE"
    fi
  fi
  # Kill any stray uvicorn processes
  pkill -f "uvicorn app.main:app" 2>/dev/null || true
  green "  Backend stopped"

  # Postgres
  cyan "→ Stopping Postgres (docker-compose)..."
  docker-compose -f "$ROOT/docker-compose.yml" down 2>&1 | grep -v "^time="
  green "  Postgres stopped"

  echo ""
  bold "=== All services stopped ==="
}

# ── status ────────────────────────────────────────────────────────────────────

cmd_status() {
  bold "=== FitCoach AI — Service Status ==="
  echo ""

  # Docker / Postgres
  if docker info &>/dev/null; then
    PG=$(docker ps --filter name=fitcoach_postgres --format "{{.Status}}" 2>/dev/null)
    if [ -n "$PG" ]; then
      green "  Postgres   ✓  $PG"
    else
      red   "  Postgres   ✗  container not running"
    fi
  else
    red "  Docker     ✗  daemon not running"
  fi

  # Backend
  if curl -sf --max-time 2 http://localhost:8000/health -o /dev/null 2>/dev/null; then
    green "  Backend    ✓  http://localhost:8000"
  else
    red   "  Backend    ✗  not responding"
  fi

  # Frontend
  if curl -sf --max-time 3 http://localhost:3000/sign-in -o /dev/null 2>/dev/null; then
    green "  Frontend   ✓  http://localhost:3000"
  else
    red   "  Frontend   ✗  not responding"
  fi

  echo ""
}

# ── dispatch ──────────────────────────────────────────────────────────────────

case "${1:-}" in
  start)  cmd_start  ;;
  stop)   cmd_stop   ;;
  status) cmd_status ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
