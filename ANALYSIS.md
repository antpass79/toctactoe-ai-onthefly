# Tic Tac Toe AI — Deep Analysis & Implementation Plan

## PLACEHOLDERS

This is the **only** section of this document that names concrete technologies, libraries, versions, ports, environment variable names, or any other implementation-specific detail. Every other section refers exclusively to the placeholder tokens listed below. When reading or implementing this document, substitute each token with its value defined here.

**If some placeholder values are not specified or are wrong, choose for yourself the best ones based on other placeholder values.**

### Frontend

| Placeholder | Value |
|-------------|-------|
| `UI_LANGUAGE` | Latest stable version of **TypeScript** |
| `UI_FRAMEWORK` | Latest stable version of **Angular** |
| `UI_LIBRARY` | Latest stable version of **MUI (Material UI)** |
| `UI_STATE_MANAGER` | Latest stable version of **Zustand** |
| `FRONTEND_TEST_FRAMEWORK` | Latest stable version of **Vitest** + **Angular Testing Library** |
| `FRONTEND_PACKAGE_MANAGER` | Latest stable version of **npm** |
| `FRONTEND_BUILD_TOOL` | **Angular CLI** (latest stable) |
| `FRONTEND_DEV_SERVER` | **Angular CLI dev server** (`ng serve`) |
| `FRONTEND_HTTP_CLIENT` | **Angular `HttpClient`** |
| `FRONTEND_DEV_PORT` | `4200` |
| `FRONTEND_PUBLIC_PORT` | `8080` |
| `FRONTEND_WEB_SERVER_IMAGE` | `nginx:alpine` |
| `FRONTEND_BUILD_IMAGE` | `node:20-alpine` |

### Backend

| Placeholder | Value |
|-------------|-------|
| `BACKEND_LANGUAGE` | Latest stable version of **Python** |
| `BACKEND_FRAMEWORK` | Latest stable version of **FastAPI** |
| `BACKEND_RUNTIME_SERVER` | Latest stable version of **Uvicorn** |
| `BACKEND_VALIDATION_LIB` | Latest stable version of **Pydantic** |
| `BACKEND_SETTINGS_LIB` | Latest stable version of **pydantic-settings** |
| `BACKEND_RATE_LIMIT_LIB` | Latest stable version of **slowapi** |
| `BACKEND_TEST_FRAMEWORK` | Latest stable version of **pytest** |
| `BACKEND_HTTP_TEST_LIB` | Latest stable version of **httpx** + FastAPI `TestClient` |
| `BACKEND_PACKAGE_MANAGER` | Latest stable version of **pip** (with `pyproject.toml`) |
| `BACKEND_BASE_IMAGE` | `python:3.12-slim` |
| `BACKEND_PORT` | `5000` |

### AI

| Placeholder | Value |
|-------------|-------|
| `LLM_MODEL` | **Azure OpenAI GPT-4o** |
| `LLM_SDK` | Latest stable version of the **`openai` Python SDK** (`AzureOpenAI` client) |
| `ENV_LLM_ENDPOINT` | `AZURE_OPENAI_URL` |
| `ENV_LLM_KEY` | `AZURE_OPENAI_KEY` |
| `ENV_LLM_MODEL` | `AZURE_OPENAI_MODEL` |
| `LLM_ENDPOINT_EXAMPLE` | `https://ent-poc-openai-gpt4-o.openai.azure.com` |
| `LLM_DEPLOYMENT_EXAMPLE` | `ENT-POC-OpenAI-GPT4-O` |

### Infrastructure

| Placeholder | Value |
|-------------|-------|
| `CONTAINER_RUNTIME` | **Docker** / **Rancher Desktop** (latest stable) |
| `CONTAINER_ORCHESTRATOR_LOCAL` | **Docker Compose** (latest stable) |
| `CONTAINER_ORCHESTRATOR_CLOUD` | **Azure Container Apps** |
| `CONTAINER_REGISTRY` | **Azure Container Registry (ACR)** |

---

## 1. Project Overview

A web-based Tic Tac Toe game where a human player competes against an AI opponent powered by `LLM_MODEL`. The solution is composed of:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | `UI_LANGUAGE` + `UI_FRAMEWORK` + `UI_LIBRARY` + `UI_STATE_MANAGER` | Game UI, board rendering, user interaction |
| Backend | `BACKEND_LANGUAGE` + `BACKEND_FRAMEWORK` | Game logic orchestration, AI integration, REST API |
| AI | `LLM_MODEL` | Opponent move generation |
| Testing | `BACKEND_TEST_FRAMEWORK` (backend) + `FRONTEND_TEST_FRAMEWORK` (frontend) | Unit & integration tests |
| Infrastructure | `CONTAINER_RUNTIME` / `CONTAINER_ORCHESTRATOR_LOCAL` | Containerized deployment (local `CONTAINER_RUNTIME` / `CONTAINER_ORCHESTRATOR_CLOUD`) |

---

## 2. Architecture

```
┌─────────────────────────────┐
│         Frontend            │
│   UI_FRAMEWORK + UI_LIBRARY │
│        + UI_STATE_MANAGER   │
│  http://localhost:FRONTEND_DEV_PORT │
└──────────┬──────────────────┘
           │  REST API (JSON)
           ▼
┌─────────────────────────────┐
│           Backend           │
│   BACKEND_LANGUAGE +        │
│   BACKEND_FRAMEWORK         │
│  http://localhost:BACKEND_PORT │
│                             │
│  ┌───────────┐ ┌──────────┐ │
│  │ GameEngine│ │ AIService│ │
│  └───────────┘ └─────┬────┘ │
└──────────────────────┼──────┘
                       │  HTTPS (LLM_SDK)
                       ▼
              ┌────────────────┐
              │   LLM_MODEL    │
              └────────────────┘
```

### 2.1 Communication Flow

1. Player clicks a cell → Frontend sends `POST /api/game/move` with board state + player move.
2. Backend validates the move, updates the board, checks for win/draw.
3. If the game is still ongoing, backend calls `LLM_MODEL` via `LLM_SDK` to get the AI's move.
4. Backend validates the AI move, updates the board, checks for win/draw again.
5. Backend returns the full updated game state (board, status, winner) to the frontend.

---

## 3. Solution Structure

```
tictactoe-ai-pipeline/
│
├── ANALYSIS.md                          # This document
├── docker-compose.yml                   # Orchestration (CONTAINER_ORCHESTRATOR_LOCAL)
│
├── backend/                             # BACKEND_LANGUAGE / BACKEND_FRAMEWORK
│   ├── pyproject.toml                   # BACKEND_PACKAGE_MANAGER manifest
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py                      # BACKEND_FRAMEWORK entrypoint
│   │   ├── config.py                    # Settings (BACKEND_SETTINGS_LIB)
│   │   ├── models/
│   │   │   ├── game_state.py
│   │   │   ├── move_request.py
│   │   │   └── move_response.py
│   │   ├── routers/
│   │   │   └── game.py                  # /api/game/* endpoints
│   │   └── services/
│   │       ├── game_engine.py
│   │       └── ai_player_service.py
│   │
│   └── tests/
│       ├── test_game_engine.py
│       ├── test_ai_player_service.py
│       └── test_game_router.py
│
├── frontend/                            # UI_FRAMEWORK + UI_LANGUAGE
│   ├── package.json                     # FRONTEND_PACKAGE_MANAGER manifest
│   ├── angular.json                     # FRONTEND_BUILD_TOOL config
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── nginx.conf                       # Production static serving
│   ├── src/
│   │   ├── main.ts
│   │   ├── index.html
│   │   ├── styles.scss
│   │   ├── app/
│   │   │   ├── app.component.ts         # Root component
│   │   │   ├── app.config.ts            # Standalone bootstrap config
│   │   │   ├── api/
│   │   │   │   └── game-api.service.ts  # FRONTEND_HTTP_CLIENT wrapper
│   │   │   ├── components/
│   │   │   │   ├── board/               # 3×3 grid using UI_LIBRARY primitives
│   │   │   │   ├── cell/                # Single cell
│   │   │   │   ├── game-status/         # Status display
│   │   │   │   ├── score-board/         # Win/loss/draw tracker
│   │   │   │   └── new-game-button/     # Reset button
│   │   │   ├── store/
│   │   │   │   └── game.store.ts        # UI_STATE_MANAGER store
│   │   │   ├── types/
│   │   │   │   └── game.ts              # UI_LANGUAGE interfaces
│   │   │   └── theme/
│   │   │       └── theme.ts             # UI_LIBRARY theme tokens
│   └── tests/
│       ├── board.component.spec.ts
│       ├── cell.component.spec.ts
│       ├── game-status.component.spec.ts
│       ├── new-game-button.component.spec.ts
│       ├── score-board.component.spec.ts
│       └── game.store.spec.ts
│
└── .github/                             # (Optional) CI/CD
    └── workflows/
        └── ci.yml
```

---

## 4. Detailed Component Design

### 4.1 Backend

#### 4.1.1 Models

All request/response models are defined as `BACKEND_VALIDATION_LIB` schemas and enforce the following shapes.

**`GameState`**

| Field | Type | Notes |
|-------|------|-------|
| `board` | array of 9 cells (`""`, `"X"`, `"O"`) | Initial value: 9 empty strings |
| `current_player` | `"X"` \| `"O"` | Human = `"X"`, AI = `"O"` |
| `status` | `"ongoing"` \| `"win"` \| `"draw"` | Default `"ongoing"` |
| `winner` | `"X"` \| `"O"` \| `null` | `null` while ongoing / on draw |

**`MoveRequest`**

| Field | Type | Constraints |
|-------|------|-------------|
| `board` | array of 9 cells | Must contain only `""`, `"X"`, `"O"` |
| `position` | integer | `0..8` inclusive |

**`MoveResponse`**

| Field | Type | Notes |
|-------|------|-------|
| `board` | array of 9 cells | Updated board |
| `ai_move` | integer \| `null` | `null` if game ended before AI moved |
| `status` | `"ongoing"` \| `"win"` \| `"draw"` | |
| `winner` | `"X"` \| `"O"` \| `null` | |

#### 4.1.2 GameEngine Service

Responsibilities:
- Validate a move (cell must be empty, game must be ongoing).
- Apply a move to the board.
- Check win condition (8 winning lines).
- Check draw condition (all cells filled, no winner).

This service contains **zero AI logic** and is fully deterministic → easy to unit test with `BACKEND_TEST_FRAMEWORK`.

#### 4.1.3 AiPlayerService

Responsibilities:
- Build a prompt describing the current board and ask `LLM_MODEL` (via `LLM_SDK`) for the best move.
- Parse the AI response to extract a valid cell index (0–8).
- Implement retry logic (max 3 attempts) in case of invalid/unparseable responses.
- Fallback: if AI consistently fails, pick a random valid cell.

**Prompt strategy:**
```
You are playing Tic Tac Toe as "O". The board positions are numbered 0-8:
0|1|2
3|4|5
6|7|8

Current board state: ["X","","O","","X","","","",""]

Available positions: [1, 3, 5, 6, 7, 8]

Respond with ONLY a single integer representing your chosen position.
```

**`LLM_MODEL` configuration** (loaded through `BACKEND_SETTINGS_LIB` from environment variables / secrets):

| Purpose | Environment variable |
|---------|----------------------|
| Endpoint URL | `ENV_LLM_ENDPOINT` |
| API Key (⚠ never in source control) | `ENV_LLM_KEY` |
| Deployment name | `ENV_LLM_MODEL` |

#### 4.1.4 GameController (`BACKEND_FRAMEWORK` router)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/game/move` | POST | Submit player move, get AI response |
| `/api/game/new` | POST | Start a new game (returns empty board) |

#### 4.1.5 Security Considerations (MDR-relevant)

- **Input validation**: Enforced by `BACKEND_VALIDATION_LIB` — position must be 0–8, board must be an array of 9 valid cell values.
- **No authentication** required for this game (single-player), but CORS is restricted to the frontend origin via `BACKEND_FRAMEWORK` CORS middleware.
- **API key** is never exposed to the frontend; all AI calls happen server-side.
- **Rate limiting** via `BACKEND_RATE_LIMIT_LIB` to prevent abuse.

---

### 4.2 Frontend

> `UI_LIBRARY` is integrated into `UI_FRAMEWORK` components through a thin adapter layer — its design tokens (theme, spacing, color palette, typography scale, elevation) are exposed as CSS custom properties and consumed by `UI_FRAMEWORK` components. `UI_STATE_MANAGER` is used in its framework-agnostic (vanilla) form and subscribed to from `UI_FRAMEWORK` components through a small service wrapper that exposes reactive primitives.

#### 4.2.1 Component Tree

```
AppComponent
└── <theme-provider>                     (UI_LIBRARY theme via CSS vars)
    └── <app-container>
        ├── <h1> — "Tic Tac Toe vs AI"
        ├── <app-game-status>            — current status / winner announcement
        ├── <app-board>
        │   └── <app-cell> × 9           — 3×3 Grid
        ├── <app-score-board>            — wins / losses / draws
        └── <app-new-game-button>
```

#### 4.2.2 `UI_LIBRARY` Design Elements Used

| Area | `UI_LIBRARY` Element (adapted to `UI_FRAMEWORK`) | Notes |
|------|--------------------------------------------------|-------|
| Board | Grid system (CSS grid using `UI_LIBRARY` spacing tokens) | 3×3 responsive grid |
| Cell | Paper elevation + ButtonBase-like interaction | Elevation, hover effect, click handler |
| Game Status | Alert / Typography tokens | Color-coded: info/success/warning |
| Score Board | Card + CardContent styling | Persistent score tracking |
| New Game | Contained Button style | Primary action |
| Loading | CircularProgress + Backdrop | Shown while waiting for AI move |
| Layout | Container, Box, Stack tokens (spacing scale) | Spacing and alignment |

#### 4.2.3 State Management — `UI_STATE_MANAGER` Store

The store (defined using the vanilla form of `UI_STATE_MANAGER`) holds the following shape:

| Field | Type | Purpose |
|-------|------|---------|
| `board` | array of 9 strings | Current board |
| `status` | `"ongoing"` \| `"win"` \| `"draw"` | Game status |
| `winner` | `"X"` \| `"O"` \| `null` | Winner if any |
| `isLoading` | boolean | `true` while awaiting AI move |
| `score` | `{ player, ai, draws }` | Persistent score counters |

Actions:
- `makeMove(position)` — posts the move to the backend and applies the response.
- `newGame()` — resets the board.

A `UI_FRAMEWORK` service (`GameStoreService`) wraps this vanilla store and exposes reactive primitives so components re-render on state changes.

Flow inside `makeMove`:
1. Set `isLoading = true`.
2. Call `POST /api/game/move` with current board + position.
3. Update board, status, winner from response.
4. Update score if game ended.
5. Set `isLoading = false`.

#### 4.2.4 API Client (`game-api.service.ts`)

- Uses `FRONTEND_HTTP_CLIENT`.
- Base URL configurable via `UI_FRAMEWORK` environment files.
- Error handling: network errors dispatch a snackbar-style notification using `UI_LIBRARY` styling.

---

### 4.3 Unit Tests

#### 4.3.1 Backend Tests (`BACKEND_TEST_FRAMEWORK`)

| Test Module | What It Tests |
|-------------|--------------|
| `test_game_engine.py` | Move validation, win detection (all 8 lines), draw detection, invalid move rejection |
| `test_ai_player_service.py` | Prompt construction, response parsing, retry on invalid response, fallback behavior (`LLM_SDK` mocked) |
| `test_game_router.py` | `BACKEND_FRAMEWORK` endpoint integration tests using `BACKEND_HTTP_TEST_LIB` |

**`GameEngine` scenarios:**
- Placing a move on an empty cell succeeds.
- Placing a move on an occupied cell fails.
- Horizontal/vertical/diagonal wins are detected.
- Full board with no winner is a draw.
- Move on a finished game is rejected.

**`AiPlayerService` scenarios:**
- Mock `LLM_SDK` to simulate `LLM_MODEL` responses.
- Valid integer response → returns that position.
- Non-integer response → retries.
- All retries fail → falls back to random valid cell.

#### 4.3.2 Frontend Tests (`FRONTEND_TEST_FRAMEWORK`)

| Test File | What It Tests |
|-----------|--------------|
| `board.component.spec.ts` | Renders 9 cells, click triggers callback, disabled during loading |
| `cell.component.spec.ts` | Displays X/O/empty, click handler, disabled when occupied |
| `game-status.component.spec.ts` | Shows correct message for ongoing/win/draw |
| `new-game-button.component.spec.ts` | Click resets store state |
| `score-board.component.spec.ts` | Renders current score from store |
| `game.store.spec.ts` | State transitions, API call on move, score updates |

---

## 5. Docker & Deployment

### 5.1 Backend Dockerfile

```dockerfile
# Build / install stage
FROM BACKEND_BASE_IMAGE AS build
WORKDIR /app
COPY backend/pyproject.toml backend/requirements.txt* ./
RUN <BACKEND_PACKAGE_MANAGER install step>

# Runtime stage
FROM BACKEND_BASE_IMAGE
WORKDIR /app
COPY --from=build <installed deps>
COPY backend/ .
EXPOSE BACKEND_PORT
CMD ["<BACKEND_RUNTIME_SERVER entrypoint for BACKEND_FRAMEWORK app on BACKEND_PORT>"]
```

### 5.2 Frontend Dockerfile

```dockerfile
# Build stage
FROM FRONTEND_BUILD_IMAGE AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN <FRONTEND_PACKAGE_MANAGER install step>
COPY frontend/ .
RUN <FRONTEND_BUILD_TOOL production build>

# Runtime stage
FROM FRONTEND_WEB_SERVER_IMAGE
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build <FRONTEND_BUILD_TOOL output directory> /usr/share/nginx/html
EXPOSE 80
```

### 5.3 docker-compose.yml

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "BACKEND_PORT:BACKEND_PORT"
    environment:
      - ENV_LLM_ENDPOINT=${ENV_LLM_ENDPOINT}
      - ENV_LLM_KEY=${ENV_LLM_KEY}
      - ENV_LLM_MODEL=${ENV_LLM_MODEL}

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "FRONTEND_PUBLIC_PORT:80"
    depends_on:
      - backend
```

### 5.4 Running Locally (`CONTAINER_RUNTIME`)

```bash
# Create .env file with secrets (git-ignored)
echo "ENV_LLM_ENDPOINT=LLM_ENDPOINT_EXAMPLE" > .env
echo "ENV_LLM_KEY=<your-key>" >> .env
echo "ENV_LLM_MODEL=LLM_DEPLOYMENT_EXAMPLE" >> .env

<CONTAINER_ORCHESTRATOR_LOCAL up --build>
```

Frontend accessible at `http://localhost:FRONTEND_PUBLIC_PORT`, backend API at `http://localhost:BACKEND_PORT`.

### 5.5 `CONTAINER_ORCHESTRATOR_CLOUD` Deployment (Optional)

1. Push images to `CONTAINER_REGISTRY`.
2. Create a `CONTAINER_ORCHESTRATOR_CLOUD` environment.
3. Deploy backend as internal container app (ingress: internal).
4. Deploy frontend as external container app (ingress: external).
5. Store API key in `CONTAINER_ORCHESTRATOR_CLOUD` secrets, map to env var `ENV_LLM_KEY`.

---

## 6. Implementation Steps (Ordered)

### Phase 1 — Backend Core (No AI)

| Step | Task | Output |
|------|------|--------|
| 1.1 | Create `BACKEND_FRAMEWORK` project, add `BACKEND_VALIDATION_LIB` models | Project scaffolding |
| 1.2 | Implement `GameEngine` (move, validate, win/draw check) | `game_engine.py` |
| 1.3 | Write `test_game_engine.py` with `BACKEND_TEST_FRAMEWORK` | Full test coverage of game logic |
| 1.4 | Create game router with `/new` and `/move` (mock AI with random) | Working API |

### Phase 2 — AI Integration

| Step | Task | Output |
|------|------|--------|
| 2.1 | Add `LLM_SDK` dependency | Dependency |
| 2.2 | Implement `AiPlayerService` with prompt engineering targeting `LLM_MODEL` | AI opponent |
| 2.3 | Write `test_ai_player_service.py` (mocked `LLM_SDK`) | Test coverage |
| 2.4 | Wire `AiPlayerService` into game router | End-to-end AI play |

### Phase 3 — Frontend

| Step | Task | Output |
|------|------|--------|
| 3.1 | Scaffold `UI_FRAMEWORK` + `UI_LANGUAGE` project with `FRONTEND_BUILD_TOOL` | Project setup |
| 3.2 | Install `UI_LIBRARY` tokens + `UI_STATE_MANAGER`, configure theme | Themed app |
| 3.3 | Build `cell`, `board` components | Visual board |
| 3.4 | Build `game-status`, `score-board`, `new-game-button` components | Complete UI |
| 3.5 | Implement `UI_STATE_MANAGER` store + `GameApiService` (`FRONTEND_HTTP_CLIENT`) | Working game |
| 3.6 | Write frontend tests with `FRONTEND_TEST_FRAMEWORK` | Test coverage |

### Phase 4 — Docker & Integration

| Step | Task | Output |
|------|------|--------|
| 4.1 | Create backend Dockerfile, test build & run | Containerized API |
| 4.2 | Create frontend Dockerfile + nginx.conf, test build & run | Containerized UI |
| 4.3 | Create docker-compose.yml, test full stack | Working system |
| 4.4 | Add `.env.example`, `.dockerignore`, `.gitignore` | Clean repo |

### Phase 5 — Polish & Hardening

| Step | Task | Output |
|------|------|--------|
| 5.1 | Configure `BACKEND_FRAMEWORK` CORS (restrict to frontend origin) | Security |
| 5.2 | Add input validation via `BACKEND_VALIDATION_LIB` + global exception handlers | Robustness |
| 5.3 | Add loading states and error handling in UI | UX |
| 5.4 | Final end-to-end manual testing | Verified system |

---

## 7. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Stateless backend** | Board state travels with each request. No server-side session needed. Simpler scaling. |
| **AI calls server-side only** | API key never exposed to browser. Required for security. |
| **Structured prompt with position numbers** | Reduces ambiguity in `LLM_MODEL` response; easier to parse a single integer. |
| **Retry + fallback for AI** | `LLM_MODEL` may occasionally return invalid output; graceful degradation prevents stuck games. |
| **Separate GameEngine from AI** | Game rules are fully testable without any external dependency. Clean separation of concerns. |
| **`UI_LIBRARY` design tokens via adapter** | Consistent visual language while keeping `UI_FRAMEWORK` as the rendering framework. |
| **`UI_STATE_MANAGER` (vanilla) + `UI_FRAMEWORK` wrapper** | Framework-agnostic state store; minimal boilerplate; shareable logic. |
| **Multi-stage Docker builds** | Smaller production images, no build tools in runtime container. |

---

## 8. Environment & Prerequisites

| Tool | Placeholder | Purpose |
|------|-------------|---------|
| Backend language | `BACKEND_LANGUAGE` | Backend development |
| Backend framework | `BACKEND_FRAMEWORK` | REST API & DI |
| Backend package manager | `BACKEND_PACKAGE_MANAGER` | Dependency install |
| Frontend framework | `UI_FRAMEWORK` | Frontend rendering |
| Frontend language | `UI_LANGUAGE` | Frontend language |
| Frontend build tool | `FRONTEND_BUILD_TOOL` | Scaffolding & build |
| Frontend package manager | `FRONTEND_PACKAGE_MANAGER` | Dependency install |
| Container runtime | `CONTAINER_RUNTIME` | Containerization |
| Local orchestration | `CONTAINER_ORCHESTRATOR_LOCAL` | Local multi-container run |
| Cloud orchestration (optional) | `CONTAINER_ORCHESTRATOR_CLOUD` | Cloud deployment |

---

## 9. Security Notes

- **API Key Management**: The `LLM_MODEL` key must be stored as an environment variable (`ENV_LLM_KEY`) or container secret. Configuration files contain placeholder values only. The `.env` file is git-ignored.
- **CORS**: Backend allows requests only from the frontend origin (`http://localhost:FRONTEND_PUBLIC_PORT` in development).
- **Input Validation**: All incoming requests are validated by `BACKEND_VALIDATION_LIB` (board length, position range, cell content values).
- **No User Data Stored**: The application is stateless; no personal or medical data is processed.

---

## 10. Agent Commands

### `Command: run`

When the user writes **`Command: run`**, the agent must:

1. Implement the full game **in memory** following this analysis document (Phases 1–5) using the exact technologies defined in the **PLACEHOLDERS** section.
2. Create all backend and frontend source files, tests, and Docker artifacts.
3. **Run the full test suite (`BACKEND_TEST_FRAMEWORK` for the backend and `FRONTEND_TEST_FRAMEWORK` for the frontend). All tests MUST pass before proceeding.** The game is not considered ready to use until every test passes successfully.
4. Build and run both the backend (via `BACKEND_RUNTIME_SERVER` on `BACKEND_PORT`) and the frontend (via `FRONTEND_DEV_SERVER` on `FRONTEND_DEV_PORT`).
5. Output **only the artifacts and results** — no code snippets in chat, only confirmation of running services.

### `Command: stop`

When the user writes **`Command: stop`**, the agent must:

1. Stop any running backend and frontend processes.
2. **Delete all folders** created during the `run` command (`backend/`, `frontend/`, and any root-level generated files such as `docker-compose.yml`, `.env`, `.gitignore`, `nginx.conf`).
3. **NEVER delete the `Tests/` folder.** Preserve this `ANALYSIS.md` file and the `Tests/` folder.
# Tic Tac Toe AI — Deep Analysis & Implementation Plan

## PLACEHOLDERS

The following placeholders define the concrete technologies used throughout this document. Any reference to these tokens in the sections below must be interpreted as the value specified here.

| Placeholder | Value |
|-------------|-------|
| `UI_LANGUAGE` | Latest stable version of **TypeScript** |
| `UI_LIBRARY` | Latest stable version of **MUI (Material UI)** |
| `UI_FRAMEWORK` | Latest stable version of **Angular** |
| `UI_STATE_MANAGER` | Latest stable version of **Zustand** |
| `BACKEND_FRAMEWORK` | Latest stable version of **Python** (FastAPI) |
| `LLM_MODEL` | **Azure OpenAI GPT-4o** |

> All tooling versions (package managers, runtimes, test frameworks) must be the latest stable release compatible with the placeholders above at implementation time.

---

## 1. Project Overview

A web-based Tic Tac Toe game where a human player competes against an AI opponent powered by `LLM_MODEL`. The solution is composed of:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | `UI_LANGUAGE` + `UI_FRAMEWORK` + `UI_LIBRARY` + `UI_STATE_MANAGER` | Game UI, board rendering, user interaction |
| Backend | `BACKEND_FRAMEWORK` (FastAPI) | Game logic orchestration, AI integration, REST API |
| AI | `LLM_MODEL` | Opponent move generation |
| Testing | pytest (backend) + Vitest / Jest + Angular Testing utilities (frontend) | Unit & integration tests |
| Infrastructure | Docker / Docker Compose | Containerized deployment (Rancher Desktop / Azure Container Apps) |

---

## 2. Architecture

```
┌─────────────────────────────┐
│         Frontend            │
│  (Angular + MUI + Zustand)  │
│  http://localhost:4200      │
└──────────┬──────────────────┘
           │  REST API (JSON)
           ▼
┌─────────────────────────────┐
│           Backend           │
│  (Python / FastAPI)         │
│  http://localhost:5000      │
│                             │
│  ┌───────────┐ ┌──────────┐ │
│  │ GameEngine│ │ AIService│ │
│  └───────────┘ └─────┬────┘ │
└──────────────────────┼──────┘
                       │  HTTPS (Azure OpenAI SDK)
                       ▼
              ┌────────────────┐
              │   LLM_MODEL    │
              │ (Azure OpenAI  │
              │    GPT-4o)     │
              └────────────────┘
```

### 2.1 Communication Flow

1. Player clicks a cell → Frontend sends `POST /api/game/move` with board state + player move.
2. Backend validates the move, updates the board, checks for win/draw.
3. If the game is still ongoing, backend calls `LLM_MODEL` to get the AI's move.
4. Backend validates the AI move, updates the board, checks for win/draw again.
5. Backend returns the full updated game state (board, status, winner) to the frontend.

---

## 3. Solution Structure

```
tictactoe-ai-pipeline/
│
├── ANALYSIS.md                          # This document
├── docker-compose.yml                   # Orchestration
│
├── backend/                             # Python / FastAPI
│   ├── pyproject.toml                   # or requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI entrypoint
│   │   ├── config.py                    # Settings (pydantic-settings)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── game_state.py
│   │   │   ├── move_request.py
│   │   │   └── move_response.py
│   │   ├── routers/
│   │   │   └── game.py                  # /api/game/* endpoints
│   │   └── services/
│   │       ├── game_engine.py
│   │       └── ai_player_service.py
│   │
│   └── tests/
│       ├── __init__.py
│       ├── test_game_engine.py
│       ├── test_ai_player_service.py
│       └── test_game_router.py
│
├── frontend/                            # Angular + TypeScript
│   ├── package.json
│   ├── angular.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── nginx.conf                       # Production static serving
│   ├── src/
│   │   ├── main.ts
│   │   ├── index.html
│   │   ├── styles.scss
│   │   ├── app/
│   │   │   ├── app.component.ts         # Root component
│   │   │   ├── app.config.ts            # Standalone bootstrap config
│   │   │   ├── api/
│   │   │   │   └── game-api.service.ts  # HttpClient wrapper
│   │   │   ├── components/
│   │   │   │   ├── board/               # 3×3 grid using MUI primitives
│   │   │   │   ├── cell/                # Single cell
│   │   │   │   ├── game-status/         # Status display
│   │   │   │   ├── score-board/         # Win/loss/draw tracker
│   │   │   │   └── new-game-button/     # Reset button
│   │   │   ├── store/
│   │   │   │   └── game.store.ts        # Zustand (vanilla) store
│   │   │   ├── types/
│   │   │   │   └── game.ts              # TypeScript interfaces
│   │   │   └── theme/
│   │   │       └── theme.ts             # MUI custom theme tokens
│   └── tests/
│       ├── board.component.spec.ts
│       ├── cell.component.spec.ts
│       ├── game-status.component.spec.ts
│       ├── new-game-button.component.spec.ts
│       ├── score-board.component.spec.ts
│       └── game.store.spec.ts
│
└── .github/                             # (Optional) CI/CD
    └── workflows/
        └── ci.yml
```

---

## 4. Detailed Component Design

### 4.1 Backend (`BACKEND_FRAMEWORK` = Python / FastAPI)

#### 4.1.1 Models (Pydantic)

**`GameState`**
```python
from pydantic import BaseModel, Field
from typing import Literal, Optional

Cell = Literal["", "X", "O"]

class GameState(BaseModel):
    board: list[Cell] = Field(default_factory=lambda: [""] * 9)
    current_player: Literal["X", "O"] = "X"   # Human = X, AI = O
    status: Literal["ongoing", "win", "draw"] = "ongoing"
    winner: Optional[Literal["X", "O"]] = None
```

**`MoveRequest`**
```python
class MoveRequest(BaseModel):
    board: list[Cell]
    position: int = Field(ge=0, le=8)
```

**`MoveResponse`**
```python
class MoveResponse(BaseModel):
    board: list[Cell]
    ai_move: Optional[int] = None
    status: Literal["ongoing", "win", "draw"]
    winner: Optional[Literal["X", "O"]] = None
```

#### 4.1.2 GameEngine Service

Responsibilities:
- Validate a move (cell must be empty, game must be ongoing).
- Apply a move to the board.
- Check win condition (8 winning lines).
- Check draw condition (all cells filled, no winner).

This service contains **zero AI logic** and is fully deterministic → easy to unit test with `pytest`.

#### 4.1.3 AiPlayerService

Responsibilities:
- Build a prompt describing the current board and ask `LLM_MODEL` for the best move.
- Parse the AI response to extract a valid cell index (0–8).
- Implement retry logic (max 3 attempts) in case of invalid/unparseable responses.
- Fallback: if AI consistently fails, pick a random valid cell.

**Prompt strategy:**
```
You are playing Tic Tac Toe as "O". The board positions are numbered 0-8:
0|1|2
3|4|5
6|7|8

Current board state: ["X","","O","","X","","","",""]

Available positions: [1, 3, 5, 6, 7, 8]

Respond with ONLY a single integer representing your chosen position.
```

**Azure OpenAI Configuration** (stored via environment variables / secrets; loaded through `pydantic-settings`):
- Endpoint: `AZURE_OPENAI_URL`
- API Key: `AZURE_OPENAI_KEY` (⚠ stored as a secret, never in source control)
- Deployment: `AZURE_OPENAI_MODEL`

The backend uses the official `openai` Python SDK configured for Azure (`AzureOpenAI` client) or `azure-ai-inference`, targeting `LLM_MODEL`.

#### 4.1.4 GameController (FastAPI router)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/game/move` | POST | Submit player move, get AI response |
| `/api/game/new` | POST | Start a new game (returns empty board) |

#### 4.1.5 Security Considerations (MDR-relevant)

- **Input validation**: Enforced by Pydantic — position must be 0–8, board must be an array of 9 valid cell values.
- **No authentication** required for this game (single-player), but CORS is restricted to the frontend origin via FastAPI `CORSMiddleware`.
- **API key** is never exposed to the frontend; all AI calls happen server-side.
- **Rate limiting** via `slowapi` middleware to prevent abuse.

---

### 4.2 Frontend (`UI_FRAMEWORK` = Angular + `UI_LIBRARY` = MUI + `UI_STATE_MANAGER` = Zustand)

> Because MUI is a React component library, the frontend integrates MUI design tokens and styling primitives (theme, spacing, color palette, typography scale) into Angular components via a thin adapter layer — leveraging MUI's `@mui/system` CSS/emotion primitives and design tokens while keeping Angular as the framework. All rendering is done by Angular components that consume the MUI theme (exposed as CSS custom properties) and replicate MUI's look & feel (elevation, ripple, typography). Zustand is used as a framework-agnostic vanilla store (`zustand/vanilla`), subscribed to from Angular components through a small service wrapper.

#### 4.2.1 Component Tree

```
AppComponent
└── <mat-theme-provider equivalent> (MUI theme via CSS vars)
    └── <app-container>
        ├── <h1> — "Tic Tac Toe vs AI"
        ├── <app-game-status>       — current status / winner announcement
        ├── <app-board>
        │   └── <app-cell> × 9      — 3×3 Grid
        ├── <app-score-board>       — wins / losses / draws
        └── <app-new-game-button>
```

#### 4.2.2 `UI_LIBRARY` (MUI) Design Elements Used

| Area | MUI Element (adapted to Angular) | Notes |
|------|----------------------------------|-------|
| Board | Grid system (CSS grid using MUI spacing tokens) | 3×3 responsive grid |
| Cell | Paper elevation + ButtonBase-like interaction | Elevation, hover effect, click handler |
| Game Status | Alert / Typography tokens | Color-coded: info/success/warning |
| Score Board | Card + CardContent styling | Persistent score tracking |
| New Game | Contained Button style | Primary action |
| Loading | CircularProgress + Backdrop | Shown while waiting for AI move |
| Layout | Container, Box, Stack tokens (spacing scale) | Spacing and alignment |

#### 4.2.3 State Management — `UI_STATE_MANAGER` (Zustand) Store

```typescript
import { createStore } from 'zustand/vanilla';

export interface GameState {
  board: string[];
  status: 'ongoing' | 'win' | 'draw';
  winner: string | null;
  isLoading: boolean;
  score: { player: number; ai: number; draws: number };
}

export interface GameActions {
  makeMove: (position: number) => Promise<void>;
  newGame: () => void;
}

export const gameStore = createStore<GameState & GameActions>((set, get) => ({
  /* ... */
}));
```

An Angular service (`GameStoreService`) wraps this vanilla store and exposes Angular `signal`s (or `Observable`s) so components reactively re-render on state changes.

Flow inside `makeMove`:
1. Set `isLoading = true`.
2. Call `POST /api/game/move` with current board + position.
3. Update board, status, winner from response.
4. Update score if game ended.
5. Set `isLoading = false`.

#### 4.2.4 API Client (`game-api.service.ts`)

- Uses Angular `HttpClient`.
- Base URL configurable via environment files (`environment.ts` / `environment.prod.ts`).
- Error handling: network errors dispatch a snackbar-style notification using MUI styling.

---

### 4.3 Unit Tests

#### 4.3.1 Backend Tests (`pytest`)

| Test Module | What It Tests |
|-------------|--------------|
| `test_game_engine.py` | Move validation, win detection (all 8 lines), draw detection, invalid move rejection |
| `test_ai_player_service.py` | Prompt construction, response parsing, retry on invalid response, fallback behavior (Azure OpenAI client mocked) |
| `test_game_router.py` | FastAPI endpoint integration tests using `httpx.AsyncClient` + `TestClient` |

**`GameEngine` scenarios:**
- Placing a move on an empty cell succeeds.
- Placing a move on an occupied cell fails.
- Horizontal/vertical/diagonal wins are detected.
- Full board with no winner is a draw.
- Move on a finished game is rejected.

**`AiPlayerService` scenarios:**
- Mock Azure OpenAI client to simulate `LLM_MODEL` responses.
- Valid integer response → returns that position.
- Non-integer response → retries.
- All retries fail → falls back to random valid cell.

#### 4.3.2 Frontend Tests (Vitest / Jest + Angular Testing utilities)

| Test File | What It Tests |
|-----------|--------------|
| `board.component.spec.ts` | Renders 9 cells, click triggers callback, disabled during loading |
| `cell.component.spec.ts` | Displays X/O/empty, click handler, disabled when occupied |
| `game-status.component.spec.ts` | Shows correct message for ongoing/win/draw |
| `new-game-button.component.spec.ts` | Click resets store state |
| `score-board.component.spec.ts` | Renders current score from store |
| `game.store.spec.ts` | State transitions, API call on move, score updates |

---

## 5. Docker & Deployment

### 5.1 Backend Dockerfile (Python)

```dockerfile
# Build / install stage
FROM python:3.12-slim AS build
WORKDIR /app
COPY backend/pyproject.toml backend/requirements.txt* ./
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.12-slim
WORKDIR /app
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY backend/ .
EXPOSE 5000
ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

### 5.2 Frontend Dockerfile (Angular)

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build -- --configuration production

# Runtime stage
FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
```

### 5.3 docker-compose.yml

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "5000:5000"
    environment:
      - AZURE_OPENAI_URL=${AZURE_OPENAI_URL}
      - AZURE_OPENAI_KEY=${AZURE_OPENAI_KEY}
      - AZURE_OPENAI_MODEL=${AZURE_OPENAI_MODEL}

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "8080:80"
    depends_on:
      - backend
```

### 5.4 Running Locally (Rancher Desktop)

```bash
# Create .env file with secrets (git-ignored)
echo "AZURE_OPENAI_URL=https://ent-poc-openai-gpt4-o.openai.azure.com" > .env
echo "AZURE_OPENAI_KEY=<your-key>" >> .env
echo "AZURE_OPENAI_MODEL=ENT-POC-OpenAI-GPT4-O" >> .env

docker compose up --build
```

Frontend accessible at `http://localhost:8080`, backend API at `http://localhost:5000`.

### 5.5 Azure Container Apps Deployment (Optional)

1. Push images to Azure Container Registry (ACR).
2. Create a Container Apps Environment.
3. Deploy backend as internal Container App (ingress: internal).
4. Deploy frontend as external Container App (ingress: external).
5. Store API key in Container Apps Secrets, map to env var.

---

## 6. Implementation Steps (Ordered)

### Phase 1 — Backend Core (No AI)

| Step | Task | Output |
|------|------|--------|
| 1.1 | Create FastAPI project (`BACKEND_FRAMEWORK`), add Pydantic models | Project scaffolding |
| 1.2 | Implement `GameEngine` (move, validate, win/draw check) | `game_engine.py` |
| 1.3 | Write `test_game_engine.py` | Full test coverage of game logic |
| 1.4 | Create game router with `/new` and `/move` (mock AI with random) | Working API |

### Phase 2 — AI Integration

| Step | Task | Output |
|------|------|--------|
| 2.1 | Add `openai` (Azure) Python SDK dependency | Dependency |
| 2.2 | Implement `AiPlayerService` with prompt engineering targeting `LLM_MODEL` | AI opponent |
| 2.3 | Write `test_ai_player_service.py` (mocked client) | Test coverage |
| 2.4 | Wire `AiPlayerService` into game router | End-to-end AI play |

### Phase 3 — Frontend

| Step | Task | Output |
|------|------|--------|
| 3.1 | Scaffold Angular + `UI_LANGUAGE` project (`ng new`) | Project setup |
| 3.2 | Install `UI_LIBRARY` (MUI) tokens + `UI_STATE_MANAGER` (Zustand), configure theme | Themed app |
| 3.3 | Build `cell`, `board` components | Visual board |
| 3.4 | Build `game-status`, `score-board`, `new-game-button` components | Complete UI |
| 3.5 | Implement Zustand store + `GameApiService` | Working game |
| 3.6 | Write frontend tests | Test coverage |

### Phase 4 — Docker & Integration

| Step | Task | Output |
|------|------|--------|
| 4.1 | Create backend Dockerfile, test build & run | Containerized API |
| 4.2 | Create frontend Dockerfile + nginx.conf, test build & run | Containerized UI |
| 4.3 | Create docker-compose.yml, test full stack | Working system |
| 4.4 | Add `.env.example`, `.dockerignore`, `.gitignore` | Clean repo |

### Phase 5 — Polish & Hardening

| Step | Task | Output |
|------|------|--------|
| 5.1 | Configure FastAPI CORS (restrict to frontend origin) | Security |
| 5.2 | Add input validation via Pydantic + global exception handlers | Robustness |
| 5.3 | Add loading states and error handling in UI | UX |
| 5.4 | Final end-to-end manual testing | Verified system |

---

## 7. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Stateless backend** | Board state travels with each request. No server-side session needed. Simpler scaling. |
| **AI calls server-side only** | API key never exposed to browser. Required for security. |
| **Structured prompt with position numbers** | Reduces ambiguity in `LLM_MODEL` response; easier to parse a single integer. |
| **Retry + fallback for AI** | `LLM_MODEL` may occasionally return invalid output; graceful degradation prevents stuck games. |
| **Separate GameEngine from AI** | Game rules are fully testable without any external dependency. Clean separation of concerns. |
| **`UI_LIBRARY` (MUI) design tokens via adapter** | Consistent visual language with MUI aesthetics while keeping `UI_FRAMEWORK` (Angular) as the rendering framework. |
| **`UI_STATE_MANAGER` (Zustand vanilla) + Angular wrapper** | Framework-agnostic state store; minimal boilerplate compared to NgRx; shareable logic. |
| **Multi-stage Docker builds** | Smaller production images, no build tools in runtime container. |

---

## 8. Environment & Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.12+ (latest stable) | Backend development (`BACKEND_FRAMEWORK`) |
| Node.js | 20 LTS (latest stable) | Frontend development |
| Angular CLI | Latest stable (`UI_FRAMEWORK`) | Frontend scaffolding & build |
| TypeScript | Latest stable (`UI_LANGUAGE`) | Frontend language |
| Docker / Rancher Desktop | Latest | Containerization |
| (Optional) Azure CLI | Latest | Container Apps deployment |

---

## 9. Security Notes

- **API Key Management**: The Azure OpenAI key for `LLM_MODEL` must be stored as an environment variable or Docker secret. Configuration files contain placeholder values only. The `.env` file is git-ignored.
- **CORS**: Backend allows requests only from the frontend origin (`http://localhost:8080` in development).
- **Input Validation**: All incoming requests are validated by Pydantic (board length, position range, cell content values).
- **No User Data Stored**: The application is stateless; no personal or medical data is processed.

---

## 10. Agent Commands

### `Command: run`

When the user writes **`Command: run`**, the agent must:

1. Implement the full game **in memory** following this analysis document (Phases 1–5) using the exact technologies defined in the **PLACEHOLDERS** section.
2. Create all backend and frontend source files, tests, and Docker artifacts.
3. **Run the full test suite (backend `pytest` and frontend tests). All tests MUST pass before proceeding.** The game is not considered ready to use until every test passes successfully.
4. Build and run both the backend (`uvicorn app.main:app`) and the frontend (`ng serve` / `npm start`).
5. Output **only the artifacts and results** — no code snippets in chat, only confirmation of running services.

### `Command: stop`

When the user writes **`Command: stop`**, the agent must:

1. Stop any running backend and frontend processes.
2. **Delete all folders** created during the `run` command (`backend/`, `frontend/`, and any root-level generated files such as `docker-compose.yml`, `.env`, `.gitignore`, `nginx.conf`).
3. **NEVER delete the `Tests/` folder.** Preserve this `ANALYSIS.md` file and the `Tests/` folder.
# Tic Tac Toe AI — Deep Analysis & Implementation Plan

**PLACEHOLDERS**

UI_LANGUAGE = Last version of Typescript

UI_LIBRARY = Last version of MUI

UI_FRAMEWORK = Last version of Angular

UI_STATE_MANAGER = Last version of Zustand

BACKEND_FRAMEWORK = Last version of Python

LLM_MODEL = Azure OpenAI GPT-4o

## 1. Project Overview

A web-based Tic Tac Toe game where a human player competes against an AI opponent powered by Azure OpenAI (GPT-4o). The solution is composed of:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | UI_LANGUAGE + UI_LIBRARY + UI_FRAMEWORK + UI_STATE_MANAGER | Game UI, board rendering, user interaction |
| Backend | BACKEND_FRAMEWORK | Game logic orchestration, AI integration, REST API |
| AI | LLM_MODEL | Opponent move generation |
| Testing | xUnit (backend) + Vitest (frontend) | Unit & integration tests |
| Infrastructure | Docker / Docker Compose | Containerized deployment (Rancher Desktop / Azure Container Apps) |

---

## 2. Architecture

```
┌─────────────────────────────┐
│         Frontend            │
│  (MUI components, Vite)     │
│  http://localhost:5173      │
└──────────┬──────────────────┘
           │  REST API (JSON)
           ▼
┌─────────────────────────────┐
│           Backend           │
│   http://localhost:5000     │
│                             │
│  ┌───────────┐ ┌──────────┐ │
│  │ GameEngine│ │ AIService│ │
│  └───────────┘ └─────┬────┘ │
└──────────────────────┼──────┘
                       │  HTTPS (Azure OpenAI SDK)
                       ▼
              ┌────────────────┐
              │ LLM_MODEL      │
              └────────────────┘
```

### 2.1 Communication Flow

1. Player clicks a cell → Frontend sends `POST /api/game/move` with board state + player move.
2. Backend validates the move, updates the board, checks for win/draw.
3. If the game is still ongoing, backend calls Azure OpenAI to get the AI's move.
4. Backend validates the AI move, updates the board, checks for win/draw again.
5. Backend returns the full updated game state (board, status, winner) to the frontend.

---

## 3. Solution Structure

```
tictactoe-ai-pipeline/
│
├── ANALYSIS.md                          # This document
├── docker-compose.yml                   # Orchestration
│
├── backend/
│   ├── TicTacToe.Api/
│   │   ├── TicTacToe.Api.csproj
│   │   ├── Program.cs
│   │   ├── appsettings.json             # LLM config (non-secret defaults)
│   │   ├── appsettings.Development.json
│   │   ├── Dockerfile
│   │   ├── Controllers/
│   │   │   └── GameController.cs
│   │   ├── Models/
│   │   │   ├── GameState.cs
│   │   │   ├── MoveRequest.cs
│   │   │   └── MoveResponse.cs
│   │   └── Services/
│   │       ├── IGameEngine.cs
│   │       ├── GameEngine.cs
│   │       ├── IAiPlayerService.cs
│   │       └── AiPlayerService.cs
│   │
│   └── TicTacToe.Api.Tests/
│       ├── TicTacToe.Api.Tests.csproj
│       ├── GameEngineTests.cs
│       └── AiPlayerServiceTests.cs
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── nginx.conf                       # Production static serving
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── gameApi.ts               # Axios/fetch wrapper
│   │   ├── components/
│   │   │   ├── Board.tsx                 # 3×3 grid using MUI Grid/Paper
│   │   │   ├── Cell.tsx                  # Single cell (MUI Button/Paper)
│   │   │   ├── GameStatus.tsx            # Status display (MUI Typography/Alert)
│   │   │   ├── ScoreBoard.tsx            # Win/loss/draw tracker
│   │   │   └── NewGameButton.tsx         # Reset (MUI Button)
│   │   ├── hooks/
│   │   │   └── useGame.ts               # Game state management hook
│   │   ├── types/
│   │   │   └── game.ts                  # TypeScript interfaces
│   │   └── theme/
│   │       └── theme.ts                 # MUI custom theme
│   └── tests/
│       ├── Board.test.tsx
│       ├── Cell.test.tsx
│       ├── GameStatus.test.tsx
│       └── useGame.test.ts
│
└── .github/                             # (Optional) CI/CD
    └── workflows/
        └── ci.yml
```

---

## 4. Detailed Component Design

### 4.1 Backend

#### 4.1.1 Models

**`GameState`**
```csharp
public class GameState
{
    public string[] Board { get; set; } = new string[9]; // "", "X", "O"
    public string CurrentPlayer { get; set; } = "X";     // Human = X, AI = O
    public string Status { get; set; } = "ongoing";      // ongoing | win | draw
    public string? Winner { get; set; }                   // "X", "O", or null
}
```

**`MoveRequest`**
```csharp
public class MoveRequest
{
    public string[] Board { get; set; } = default!;
    public int Position { get; set; } // 0-8
}
```

**`MoveResponse`**
```csharp
public class MoveResponse
{
    public string[] Board { get; set; } = default!;
    public int? AiMove { get; set; }
    public string Status { get; set; } = default!;
    public string? Winner { get; set; }
}
```

#### 4.1.2 GameEngine Service

Responsibilities:
- Validate a move (cell must be empty, game must be ongoing).
- Apply a move to the board.
- Check win condition (8 winning lines).
- Check draw condition (all cells filled, no winner).

This service contains **zero AI logic** and is fully deterministic → easy to unit test.

#### 4.1.3 AiPlayerService

Responsibilities:
- Build a prompt describing the current board and ask GPT-4o for the best move.
- Parse the AI response to extract a valid cell index (0–8).
- Implement retry logic (max 3 attempts) in case of invalid/unparseable responses.
- Fallback: if AI consistently fails, pick a random valid cell.

**Prompt strategy:**
```
You are playing Tic Tac Toe as "O". The board positions are numbered 0-8:
0|1|2
3|4|5
6|7|8

Current board state: ["X","","O","","X","","","",""]

Available positions: [1, 3, 5, 6, 7, 8]

Respond with ONLY a single integer representing your chosen position.
```

**Azure OpenAI Configuration** (stored via environment variables / secrets):
- Endpoint: configured via `AzureOpenAi__Url`
- API Key: configured via `AzureOpenAi__Key` (⚠ stored as a secret, never in source control)
- Deployment: configured via `AzureOpenAi__Model`

#### 4.1.4 GameController

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/game/move` | POST | Submit player move, get AI response |
| `/api/game/new` | POST | Start a new game (returns empty board) |

#### 4.1.5 Security Considerations (MDR-relevant)

- **Input validation**: Position must be 0–8, board must be an array of 9 strings.
- **No authentication** required for this game (single-player), but CORS is restricted to the frontend origin.
- **API key** is never exposed to the frontend; all AI calls happen server-side.
- **Rate limiting** via ASP.NET middleware to prevent abuse.

---

### 4.2 Frontend

#### 4.2.1 Component Tree

```
App
├── ThemeProvider (MUI)
│   └── Container (MUI)
│       ├── Typography — "Tic Tac Toe vs AI"
│       ├── GameStatus — current status / winner announcement
│       ├── Board
│       │   ├── Cell [0] … Cell [8]  (3×3 Grid)
│       ├── ScoreBoard — wins / losses / draws
│       └── NewGameButton
```

#### 4.2.2 UI_STATE_MANAGER Components Used

| Component | UI_STATE_MANAGER Element | Notes |
|-----------|-------------|-------|
| Board | `Grid` (container + items) | 3×3 responsive grid |
| Cell | `Paper` + `ButtonBase` | Elevation, hover effect, click handler |
| Game Status | `Alert` or `Typography` | Color-coded: info/success/warning |
| Score Board | `Card` + `CardContent` | Persistent score tracking |
| New Game | `Button` (variant="contained") | Primary action |
| Loading | `CircularProgress` + `Backdrop` | Shown while waiting for AI move |
| Layout | `Container`, `Box`, `Stack` | Spacing and alignment |

#### 4.2.3 State Management — `useGame` Hook

```typescript
interface GameHookState {
  board: string[];
  status: "ongoing" | "win" | "draw";
  winner: string | null;
  isLoading: boolean;
  score: { player: number; ai: number; draws: number };
}

interface GameHookActions {
  makeMove: (position: number) => Promise<void>;
  newGame: () => void;
}
```

Flow inside `makeMove`:
1. Set `isLoading = true`.
2. Call `POST /api/game/move` with current board + position.
3. Update board, status, winner from response.
4. Update score if game ended.
5. Set `isLoading = false`.

#### 4.2.4 API Client (`gameApi.ts`)

- Uses `fetch` or `axios`.
- Base URL configurable via `VITE_API_URL` environment variable.
- Error handling: network errors display a MUI `Snackbar` alert.

---

### 4.3 Unit Tests

#### 4.3.1 Backend Tests (xUnit)

| Test Class | What It Tests |
|------------|--------------|
| `GameEngineTests` | Move validation, win detection (all 8 lines), draw detection, invalid move rejection |
| `AiPlayerServiceTests` | Prompt construction, response parsing, retry on invalid response, fallback behavior |

**GameEngineTests scenarios:**
- Placing a move on an empty cell succeeds.
- Placing a move on an occupied cell fails.
- Horizontal/vertical/diagonal wins are detected.
- Full board with no winner is a draw.
- Move on a finished game is rejected.

**AiPlayerServiceTests scenarios:**
- Mock `HttpClient` to simulate Azure OpenAI responses.
- Valid integer response → returns that position.
- Non-integer response → retries.
- All retries fail → falls back to random valid cell.

#### 4.3.2 Frontend Tests (Vitest + UI_FRAMEWORK Testing Library)

| Test File | What It Tests |
|-----------|--------------|
| `Board.test.tsx` | Renders 9 cells, click triggers callback, disabled during loading |
| `Cell.test.tsx` | Displays X/O/empty, click handler, disabled when occupied |
| `GameStatus.test.tsx` | Shows correct message for ongoing/win/draw |
| `useGame.test.ts` | State transitions, API call on move, score updates |

---

## 5. Docker & Deployment

### 5.1 Backend Dockerfile

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/TicTacToe.Api/ .
RUN dotnet publish -c Release -o /app

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "TicTacToe.Api.dll"]
```

### 5.2 Frontend Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### 5.3 docker-compose.yml

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/TicTacToe.Api/Dockerfile
    ports:
      - "5000:5000"
    environment:
      - AzureOpenAi__Url=${AZURE_OPENAI_URL}
      - AzureOpenAi__Key=${AZURE_OPENAI_KEY}
      - AzureOpenAi__Model=${AZURE_OPENAI_MODEL}

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "8080:80"
    depends_on:
      - backend
```

### 5.4 Running Locally (Rancher Desktop)

```bash
# Create .env file with secrets (git-ignored)
echo "AZURE_OPENAI_URL=https://ent-poc-openai-gpt4-o.openai.azure.com" > .env
echo "AZURE_OPENAI_KEY=<your-key>" >> .env
echo "AZURE_OPENAI_MODEL=ENT-POC-OpenAI-GPT4-O" >> .env

docker compose up --build
```

Frontend accessible at `http://localhost:8080`, backend API at `http://localhost:5000`.

### 5.5 Azure Container Apps Deployment (Optional)

1. Push images to Azure Container Registry (ACR).
2. Create a Container Apps Environment.
3. Deploy backend as internal Container App (ingress: internal).
4. Deploy frontend as external Container App (ingress: external).
5. Store API key in Container Apps Secrets, map to env var.

---

## 6. Implementation Steps (Ordered)

### Phase 1 — Backend Core (No AI)

| Step | Task | Output |
|------|------|--------|
| 1.1 | Create ASP.NET Core project, add models | Project scaffolding |
| 1.2 | Implement `GameEngine` (move, validate, win/draw check) | `GameEngine.cs` |
| 1.3 | Write `GameEngineTests` | Full test coverage of game logic |
| 1.4 | Create `GameController` with `/new` and `/move` (mock AI with random) | Working API |

### Phase 2 — AI Integration

| Step | Task | Output |
|------|------|--------|
| 2.1 | Add Azure.AI.OpenAI NuGet package | Dependency |
| 2.2 | Implement `AiPlayerService` with prompt engineering | AI opponent |
| 2.3 | Write `AiPlayerServiceTests` (mocked HTTP) | Test coverage |
| 2.4 | Wire `AiPlayerService` into `GameController` | End-to-end AI play |

### Phase 3 — Frontend

| Step | Task | Output |
|------|------|--------|
| 3.1 | Scaffold UI_FRAMEWORK + Vite + TypeScript project | Project setup |
| 3.2 | Install and configure UI_LIBRARY + UI_STATE_MANAGER, create custom theme | Themed app |
| 3.3 | Build `Cell`, `Board` components | Visual board |
| 3.4 | Build `GameStatus`, `ScoreBoard`, `NewGameButton` | Complete UI |
| 3.5 | Implement `useGame` hook + `gameApi` client | Working game |
| 3.6 | Write frontend tests | Test coverage |

### Phase 4 — Docker & Integration

| Step | Task | Output |
|------|------|--------|
| 4.1 | Create backend Dockerfile, test build & run | Containerized API |
| 4.2 | Create frontend Dockerfile + nginx.conf, test build & run | Containerized UI |
| 4.3 | Create docker-compose.yml, test full stack | Working system |
| 4.4 | Add `.env.example`, `.dockerignore`, `.gitignore` | Clean repo |

### Phase 5 — Polish & Hardening

| Step | Task | Output |
|------|------|--------|
| 5.1 | Add CORS configuration (restrict to frontend origin) | Security |
| 5.2 | Add input validation middleware | Robustness |
| 5.3 | Add loading states and error handling in UI | UX |
| 5.4 | Final end-to-end manual testing | Verified system |

---

## 7. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Stateless backend** | Board state travels with each request. No server-side session needed. Simpler scaling. |
| **AI calls server-side only** | API key never exposed to browser. Required for security. |
| **Structured prompt with position numbers** | Reduces ambiguity in AI response; easier to parse a single integer. |
| **Retry + fallback for AI** | GPT may occasionally return invalid output; graceful degradation prevents stuck games. |
| **Separate GameEngine from AI** | Game rules are fully testable without any external dependency. Clean separation of concerns. |
| **MUI for all UI components** | Consistent design language, accessibility built-in, responsive by default. |
| **Multi-stage Docker builds** | Smaller production images, no build tools in runtime container. |

---

## 8. Environment & Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| .NET SDK | 8.0+ | Backend development |
| Node.js | 20 LTS | Frontend development |
| Docker / Rancher Desktop | Latest | Containerization |
| (Optional) Azure CLI | Latest | Container Apps deployment |

---

## 9. Security Notes

- **API Key Management**: The Azure OpenAI key must be stored as an environment variable or Docker secret. The `appsettings.json` file contains placeholder values only. The `.env` file is git-ignored.
- **CORS**: Backend allows requests only from the frontend origin (`http://localhost:8080` in development).
- **Input Validation**: All incoming requests are validated (board length, position range, cell content values).
- **No User Data Stored**: The application is stateless; no personal or medical data is processed.

---

## 10. Agent Commands

### `Command: run`

When the user writes **`Command: run`**, the agent must:

1. Implement the full game **in memory** following this analysis document (Phases 1–5).
2. Create all backend and frontend source files, tests, and Docker artifacts.
3. **Run the full test suite for the right stack (backend and frontend). All tests MUST pass before proceeding.** The game is not considered ready to use until every test passes successfully.
4. Build and run both the backend (`dotnet run`) and the frontend (`npm run dev`).
5. Output **only the artifacts and results** — no code snippets in chat, only confirmation of running services.

### `Command: stop`

When the user writes **`Command: stop`**, the agent must:

1. Stop any running backend and frontend processes.
2. **Delete all folders** created during the `run` command (`backend/`, `frontend/`, and any root-level generated files such as `docker-compose.yml`, `.env`, `.gitignore`, `nginx.conf`).
3. **NEVER delete the `Tests/` folder.** Preserve this `ANALYSIS.md` file and the `Tests/` folder.
