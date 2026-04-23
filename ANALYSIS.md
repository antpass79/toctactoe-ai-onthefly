# Tic Tac Toe AI — Deep Analysis & Implementation Plan

## PLACEHOLDERS

This is the **only** section of this document that names concrete technologies, libraries, versions, ports, environment variable names, or any other implementation-specific detail. Every other section refers exclusively to the placeholder tokens listed below. When reading or implementing this document, substitute each token with its value defined here.

**If some placeholder values are not specified or are wrong, choose for yourself the best ones based on other placeholder values.**

### Frontend

| Placeholder | Value |
|-------------|-------|
| `UI_LANGUAGE` | Latest stable version of **TypeScript** |
| `UI_FRAMEWORK` | Latest stable version of **React** |
| `UI_LIBRARY` | Latest stable version of **MUI (Material UI)** |
| `UI_STATE_MANAGER` | Latest stable version of **Zustand** |
| `FRONTEND_PACKAGE_MANAGER` | Latest stable version of **npm** |
| `FRONTEND_BUILD_TOOL` | **React CLI** (latest stable) |
| `FRONTEND_DEV_SERVER` | **React CLI dev server** (`ng serve`) |
| `FRONTEND_HTTP_CLIENT` | **React `HttpClient`** |
| `FRONTEND_DEV_PORT` | `4200` |
| `FRONTEND_PUBLIC_PORT` | `8080` |
| `FRONTEND_WEB_SERVER_IMAGE` | `nginx:alpine` |
| `FRONTEND_BUILD_IMAGE` | `node:20-alpine` |

### Backend

| Placeholder | Value |
|-------------|-------|
| `BACKEND_LANGUAGE` | Latest stable version of **C#** |
| `BACKEND_FRAMEWORK` | Latest stable version of **AspNet Core** |
| `BACKEND_RUNTIME_SERVER` |  |
| `BACKEND_VALIDATION_LIB` |  |
| `BACKEND_SETTINGS_LIB` |  |
| `BACKEND_RATE_LIMIT_LIB` |  |
| `BACKEND_PACKAGE_MANAGER` | Latest stable version of **nuget** (with `pyproject.toml`) |
| `BACKEND_BASE_IMAGE` |  |
| `BACKEND_PORT` | `5000` |
| `BACKEND_MANIFEST_FILE` | Project manifest file name for `BACKEND_PACKAGE_MANAGER` |
| `FRONTEND_MANIFEST_FILE` | Project manifest file name for `FRONTEND_PACKAGE_MANAGER` |
| `FRONTEND_BUILD_CONFIG_FILE` | Build configuration file for `FRONTEND_BUILD_TOOL` |

### AI

| Placeholder | Value |
|-------------|-------|
| `LLM_MODEL` | **Azure OpenAI GPT-4o** |
| `LLM_SDK` |  |
| `ENV_LLM_ENDPOINT` | `AZURE_OPENAI_URL` |
| `ENV_LLM_KEY` | `AZURE_OPENAI_KEY` |
| `ENV_LLM_MODEL` | `AZURE_OPENAI_MODEL` |

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
├── secrets.json                         # Local LLM settings (git-ignored, docker-ignored)
├── secrets.example.json                 # Committed template with empty values
│
├── backend/                             # BACKEND_LANGUAGE / BACKEND_FRAMEWORK
│   ├── BACKEND_MANIFEST_FILE            # BACKEND_PACKAGE_MANAGER manifest
│   ├── Dockerfile
│   ├── app/
│   │   ├── main                         # BACKEND_FRAMEWORK entrypoint
│   │   ├── config                       # Settings (BACKEND_SETTINGS_LIB)
│   │   ├── models/
│   │   │   ├── game_state
│   │   │   ├── move_request
│   │   │   └── move_response
│   │   ├── routers/
│   │   │   └── game                     # /api/game/* endpoints
│   │   └── services/
│   │       ├── game_engine
│   │       └── ai_player_service
│   │
│   └── tests/
│       ├── test_game_engine
│       ├── test_ai_player_service
│       └── test_game_router
│
├── frontend/                            # UI_FRAMEWORK + UI_LANGUAGE
│   ├── FRONTEND_MANIFEST_FILE           # FRONTEND_PACKAGE_MANAGER manifest
│   ├── FRONTEND_BUILD_CONFIG_FILE       # FRONTEND_BUILD_TOOL config
│   ├── Dockerfile
│   ├── nginx.conf                       # Production static serving
│   ├── src/
│   │   ├── main
│   │   ├── index.html
│   │   ├── styles
│   │   ├── app/
│   │   │   ├── app.component            # Root component
│   │   │   ├── app.config               # Standalone bootstrap config
│   │   │   ├── api/
│   │   │   │   └── game-api.service     # FRONTEND_HTTP_CLIENT wrapper
│   │   │   ├── components/
│   │   │   │   ├── board/               # 3×3 grid using UI_LIBRARY primitives
│   │   │   │   ├── cell/                # Single cell
│   │   │   │   ├── game-status/         # Status display
│   │   │   │   ├── score-board/         # Win/loss/draw tracker
│   │   │   │   └── new-game-button/     # Reset button
│   │   │   ├── store/
│   │   │   │   └── game.store           # UI_STATE_MANAGER store
│   │   │   ├── types/
│   │   │   │   └── game                 # UI_LANGUAGE type definitions
│   │   │   └── theme/
│   │   │       └── theme                # UI_LIBRARY theme tokens
│   └── tests/
│       ├── board.component.spec
│       ├── cell.component.spec
│       ├── game-status.component.spec
│       ├── new-game-button.component.spec
│       ├── score-board.component.spec
│       └── game.store.spec
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

This service contains **zero AI logic** and is fully deterministic → easy to unit test.

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

**`LLM_MODEL` configuration** is loaded through `BACKEND_SETTINGS_LIB` from a local secrets file `secrets.json` at the repository root. The file is **git-ignored** and **docker-ignored**; only `secrets.example.json` (with empty placeholder values) is committed.

**`secrets.json` shape:**

```json
{
  "ENV_LLM_ENDPOINT": "<your-endpoint>",
  "ENV_LLM_KEY": "<your-key>",
  "ENV_LLM_MODEL": "<your-deployment>"
}
```

| Purpose | Key in `secrets.json` |
|---------|-----------------------|
| Endpoint URL | `ENV_LLM_ENDPOINT` |
| API Key (⚠ never in source control) | `ENV_LLM_KEY` |
| Deployment name | `ENV_LLM_MODEL` |

At container start, `secrets.json` is mounted read-only into the backend container (e.g. `/run/secrets/secrets.json`) via `CONTAINER_ORCHESTRATOR_LOCAL` bind mount or secret mechanism. `BACKEND_SETTINGS_LIB` reads it once at startup and then keeps the values in memory as secret-typed fields.

**API key protection requirements** (enforced by the backend):

- The key is loaded **only** from `secrets.json` via `BACKEND_SETTINGS_LIB` — never from source files, query strings, request bodies, or client-provided headers.
- The key is typed as a **secret value** (e.g. `BACKEND_SETTINGS_LIB`'s `SecretStr` equivalent) so it is not serialised by default in logs, exception messages, debug output, or API responses.
- The key is **never** returned by any endpoint, echoed in error messages, or included in health/metrics responses.
- Logging is configured to redact or omit the `ENV_LLM_KEY` value (and any `Authorization` / `api-key` headers sent to `LLM_MODEL`).
- The key is **never** forwarded to the frontend; only server-side code holds it in memory.
- `secrets.json` (and any other local secrets file) is listed in `.gitignore` and `.dockerignore` so it is neither committed nor copied into images. It is mounted into the container at runtime, not baked in.
- `secrets.example.json` is committed with empty values only, to document the required keys without leaking secrets.
- In production (`CONTAINER_ORCHESTRATOR_CLOUD`) the same `secrets.json` contract is provided by mounting a platform secret (Container Apps secret / Key Vault reference) at the same path — not baked into the image.
- CORS restricts callers to the frontend origin so third-party sites cannot reach endpoints that would trigger `LLM_MODEL` calls on their behalf.
- `BACKEND_RATE_LIMIT_LIB` protects the AI-calling endpoints from abuse that would consume the key's quota.

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

#### 4.2.4 API Client (`game-api.service`)

- Uses `FRONTEND_HTTP_CLIENT`.
- Base URL configurable via `UI_FRAMEWORK` environment files.
- Error handling: network errors dispatch a snackbar-style notification using `UI_LIBRARY` styling.

---

### 4.3 Unit Tests

#### 4.3.1 Backend Tests

| Test Module | What It Tests |
|-------------|--------------|
| `test_game_engine` | Move validation, win detection (all 8 lines), draw detection, invalid move rejection |
| `test_ai_player_service` | Prompt construction, response parsing, retry on invalid response, fallback behavior (`LLM_SDK` mocked) |
| `test_game_router` | `BACKEND_FRAMEWORK` endpoint integration tests |

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

#### 4.3.2 Frontend Tests 

| Test File | What It Tests |
|-----------|--------------|
| `board.component` spec | Renders 9 cells, click triggers callback, disabled during loading |
| `cell.component` spec | Displays X/O/empty, click handler, disabled when occupied |
| `game-status.component` spec | Shows correct message for ongoing/win/draw |
| `new-game-button.component` spec | Click resets store state |
| `score-board.component` spec | Renders current score from store |
| `game.store` spec | State transitions, API call on move, score updates |

---

## 5. Docker & Deployment

### 5.1 Backend Dockerfile

```dockerfile
# Build / install stage
FROM BACKEND_BASE_IMAGE AS build
WORKDIR /app
COPY backend/BACKEND_MANIFEST_FILE ./
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
COPY frontend/FRONTEND_MANIFEST_FILE ./
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
    volumes:
      - ./secrets.json:/run/secrets/secrets.json:ro

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "FRONTEND_PUBLIC_PORT:80"
    depends_on:
      - backend
```

The backend reads `/run/secrets/secrets.json` at startup via `BACKEND_SETTINGS_LIB`. The file is never copied into the image (it is excluded by `.dockerignore`) — only mounted from the host at runtime.

### 5.4 Running Locally (`CONTAINER_RUNTIME`)

```bash
# Create secrets.json at the repo root (git-ignored, docker-ignored)
cat > secrets.json <<'EOF'
{
  "ENV_LLM_ENDPOINT": "<your-endpoint>",
  "ENV_LLM_KEY": "<your-key>",
  "ENV_LLM_MODEL": "<your-deployment>"
}
EOF

<CONTAINER_ORCHESTRATOR_LOCAL up --build>
```

Frontend accessible at `http://localhost:FRONTEND_PUBLIC_PORT`, backend API at `http://localhost:BACKEND_PORT`.

### 5.5 `CONTAINER_ORCHESTRATOR_CLOUD` Deployment (Optional)

1. Push images to `CONTAINER_REGISTRY`.
2. Create a `CONTAINER_ORCHESTRATOR_CLOUD` environment.
3. Deploy backend as internal container app (ingress: internal).
4. Deploy frontend as external container app (ingress: external).
5. Store API key (and the other LLM settings) as `CONTAINER_ORCHESTRATOR_CLOUD` secrets and mount them as `secrets.json` at the same path (`/run/secrets/secrets.json`) the backend expects.

---

## 6. Implementation Steps (Ordered)

### Phase 1 — Backend Core (No AI)

| Step | Task | Output |
|------|------|--------|
| 1.1 | Create `BACKEND_FRAMEWORK` project, add `BACKEND_VALIDATION_LIB` models | Project scaffolding |
| 1.2 | Implement `GameEngine` (move, validate, win/draw check) | `GameEngine` module |
| 1.3 | Write `GameEngine` tests | Full test coverage of game logic |
| 1.4 | Create game router with `/new` and `/move` (mock AI with random) | Working API |

### Phase 2 — AI Integration

| Step | Task | Output |
|------|------|--------|
| 2.1 | Add `LLM_SDK` dependency | Dependency |
| 2.2 | Implement `AiPlayerService` with prompt engineering targeting `LLM_MODEL` | AI opponent |
| 2.3 | Write `AiPlayerService` tests (mocked `LLM_SDK`) | Test coverage |
| 2.4 | Wire `AiPlayerService` into game router | End-to-end AI play |

### Phase 3 — Frontend

| Step | Task | Output |
|------|------|--------|
| 3.1 | Scaffold `UI_FRAMEWORK` + `UI_LANGUAGE` project with `FRONTEND_BUILD_TOOL` | Project setup |
| 3.2 | Install `UI_LIBRARY` tokens + `UI_STATE_MANAGER`, configure theme | Themed app |
| 3.3 | Build `cell`, `board` components | Visual board |
| 3.4 | Build `game-status`, `score-board`, `new-game-button` components | Complete UI |
| 3.5 | Implement `UI_STATE_MANAGER` store + `GameApiService` (`FRONTEND_HTTP_CLIENT`) | Working game |

### Phase 4 — Docker & Integration

| Step | Task | Output |
|------|------|--------|
| 4.1 | Create backend Dockerfile, test build & run | Containerized API |
| 4.2 | Create frontend Dockerfile + nginx.conf, test build & run | Containerized UI |
| 4.3 | Create docker-compose.yml, test full stack | Working system |
| 4.4 | Add `secrets.example.json`, `.dockerignore`, `.gitignore` (both excluding `secrets.json`) | Clean repo |

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

- **API Key Management**: The `LLM_MODEL` key is treated as a high-sensitivity secret. It is:
  - Stored only in a local `secrets.json` (git-ignored, docker-ignored) or, in production, as a `CONTAINER_ORCHESTRATOR_CLOUD` secret / Key Vault reference mounted at the same path — never in source, tracked configuration, or container images.
  - Loaded through `BACKEND_SETTINGS_LIB` as a secret-typed value so it is not serialised in logs, exceptions, or API responses.
  - Redacted from application logs and from any outbound diagnostic output.
  - Held exclusively server-side; the frontend never receives or references it.
  - Excluded from version control and from container build context via `.gitignore` and `.dockerignore` (covering `secrets.json` and any other local secret files). Only `secrets.example.json`, containing empty placeholders, is committed.
  - Rotated by updating `secrets.json` (or the platform secret) and restarting the backend — no code change or rebuild required.
- **CORS**: Backend allows requests only from the frontend origin (`http://localhost:FRONTEND_PUBLIC_PORT` in development). This prevents third-party origins from driving calls that would consume the key's quota.
- **Rate Limiting**: AI-calling endpoints are protected by `BACKEND_RATE_LIMIT_LIB` to limit abuse and unexpected cost.
- **Input Validation**: All incoming requests are validated by `BACKEND_VALIDATION_LIB` (board length, position range, cell content values) so untrusted input cannot reach the AI call path in an unexpected shape.
- **Transport Security**: Calls from backend to `LLM_MODEL` use HTTPS via `LLM_SDK`; in production the frontend ↔ backend channel is served over HTTPS as well.
- **No User Data Stored**: The application is stateless; no personal or medical data is processed.

---

## 10. Agent Commands

### `Command: run`

When the user writes **`Command: run`**, the agent must:

1. Implement the full game **in memory** following this analysis document (Phases 1–5) using the exact technologies defined in the **PLACEHOLDERS** section.
2. Create all backend and frontend source files, tests, and Docker artifacts.
3. **Run the full test suite inside Tests folder based on the current stack. All tests MUST pass before proceeding.** The game is not considered ready to use until every test passes successfully.
4. Build and run both the backend (via `BACKEND_RUNTIME_SERVER` on `BACKEND_PORT`) and the frontend (via `FRONTEND_DEV_SERVER` on `FRONTEND_DEV_PORT`).
5. Output **only the artifacts and results** — no code snippets in chat, only confirmation of running services.

### `Command: stop`

When the user writes **`Command: stop`**, the agent must:

1. Stop any running backend and frontend processes.
2. **Delete all folders** created during the `run` command (`backend/`, `frontend/`, and any root-level generated files such as `docker-compose.yml`, `secrets.json`, `secrets.example.json`, `.gitignore`, `.dockerignore`, `nginx.conf`).
3. **NEVER delete the `Tests/` folder.** Preserve this `ANALYSIS.md` file and the `Tests/` folder.
