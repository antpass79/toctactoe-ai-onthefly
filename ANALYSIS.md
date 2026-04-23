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

### End-to-End (Playwright)

Every placeholder in this subsection is stack-specific and exists so the
Playwright suite under `Tests/E2E/Playwright/` stays stack-agnostic: the
config and specs reference **only** these tokens (via environment variables
at test time — see §4.4) and never hard-code a framework-specific command or
selector.

| Placeholder | Value |
|-------------|-------|
| `BACKEND_DIR` | Repo-relative backend directory for the active stack (e.g. `backend/AspNetCore`, `backend/Python`) |
| `BACKEND_START_COMMAND` | Shell command that boots the backend on `BACKEND_PORT` from `BACKEND_DIR` (e.g. `dotnet run --urls http://127.0.0.1:BACKEND_PORT --no-launch-profile`, or `<venv python> -m uvicorn app.main:app --host 127.0.0.1 --port BACKEND_PORT`) |
| `BACKEND_HEALTH_URL` | `http://127.0.0.1:BACKEND_PORT/health` |
| `FRONTEND_DIR` | Repo-relative frontend directory for the active stack (e.g. `frontend/React`, `frontend/Angular`) |
| `FRONTEND_START_COMMAND` | Shell command that boots `FRONTEND_DEV_SERVER` on `FRONTEND_DEV_PORT` from `FRONTEND_DIR` (e.g. `npm run dev`, `npx --no-install ng serve --host 127.0.0.1 --port FRONTEND_DEV_PORT`) |
| `FRONTEND_URL` | `http://127.0.0.1:FRONTEND_DEV_PORT` |
| `E2E_ROOT_SELECTOR` | Selector for the app root element (e.g. `#root` for React, `app-root` for Angular) |
| `E2E_CELL_SELECTOR` | Selector that matches the 9 clickable cell buttons (e.g. `[data-testid="cell"]`, `app-cell button`) |
| `E2E_HEADING_PATTERN` | Regex used to locate the main page heading (e.g. `/tic tac toe vs ai/i`) |
| `BACKEND_AI_MOVE_FIELD` | JSON field name the backend uses in `MoveResponse` for the AI's chosen position. Must match on both sides of the contract (e.g. `aiMove` for `BACKEND_FRAMEWORK = AspNet Core`, `ai_move` for `BACKEND_FRAMEWORK = FastAPI`). The frontend API client normalises this into its own camelCase field. |

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

#### 4.3.3 End-to-End Tests (Playwright) — Stack-Agnostic

The Playwright suite under `Tests/E2E/Playwright/` validates the **live**
stack (real browser against the running frontend talking to the running
backend). It must work for **any** combination of `BACKEND_FRAMEWORK` and
`UI_FRAMEWORK` without code changes — only placeholder values change.

**Abstraction contract.** The config and spec files reference only the
placeholders from the *End-to-End (Playwright)* subsection above; they are
resolved at test time from environment variables. Nothing inside the suite
names a specific framework, tag, dev server, or language runtime.

`playwright.config.ts` (abstract shape):

```ts
// Values sourced from env vars set by the agent from PLACEHOLDERS.
const backendDir       = process.env.BACKEND_DIR!;
const backendCommand   = process.env.BACKEND_START_COMMAND!;
const backendHealthUrl = process.env.BACKEND_HEALTH_URL!;
const frontendDir      = process.env.FRONTEND_DIR!;
const frontendCommand  = process.env.FRONTEND_START_COMMAND!;
const frontendUrl      = process.env.FRONTEND_URL!;

export default defineConfig({
  use: { baseURL: frontendUrl },
  webServer: [
    { command: backendCommand,  cwd: backendDir,  url: backendHealthUrl, reuseExistingServer: true },
    { command: frontendCommand, cwd: frontendDir, url: frontendUrl,      reuseExistingServer: true },
  ],
  // ...
});
```

`helpers.ts` (abstract shape):

```ts
const ROOT_SELECTOR = process.env.E2E_ROOT_SELECTOR!;
const CELL_SELECTOR = process.env.E2E_CELL_SELECTOR!;

export async function gotoApp(page: Page) {
  await page.goto('/');
  await expect(page.locator(ROOT_SELECTOR)).toBeVisible();
  await expect(page.locator(CELL_SELECTOR)).toHaveCount(9);
}
export const cell = (page: Page, i: number) => page.locator(CELL_SELECTOR).nth(i);
```

**Selector contract for every `UI_FRAMEWORK`.** To keep `E2E_CELL_SELECTOR`
uniform across stacks, every frontend implementation MUST tag its nine cell
buttons with a stable, framework-neutral hook:

- Each cell button: `data-testid="cell"` (and `role="button"` with an
  accessible name including `X`, `O`, or "empty cell" — already required by
  the unit tests).
- Application root wrapper: `data-testid="app-root"` (or reuse the
  framework's natural root — `#root` for `UI_FRAMEWORK = React`, `app-root`
  for `UI_FRAMEWORK = Angular` — and set `E2E_ROOT_SELECTOR` accordingly).

With this contract, the **default** values `E2E_CELL_SELECTOR = [data-testid="cell"]`
and `E2E_ROOT_SELECTOR = [data-testid="app-root"]` work for any
`UI_FRAMEWORK` without editing the suite.

**Backend JSON contract.** The backend may serialise its response field as
`aiMove` (C#/.NET defaults) or `ai_move` (Python/FastAPI defaults). Record
the actual wire name in `BACKEND_AI_MOVE_FIELD` and ensure:

- The mocked responses in `game-flow.spec.ts` use `BACKEND_AI_MOVE_FIELD` as
  the key.
- `FRONTEND_HTTP_CLIENT` / the frontend API client normalises both forms
  into a single camelCase field the UI consumes, so the UI code never
  depends on the wire name.

**Coverage (identical to the current `smoke` + `game-flow` specs):**

| Spec | What it asserts |
|------|------------------|
| `smoke.spec.ts` | Real stack: heading renders, `E2E_CELL_SELECTOR` matches 9 cells, clicking cell 0 triggers a real `POST /api/game/move` (200), an `O` appears, no CORS console errors. |
| `game-flow.spec.ts` | Backend route-mocked (`page.route`): player win / AI win / draw messaging, score updates, new-game reset, "AI is thinking..." loading state. Mock payloads use `BACKEND_AI_MOVE_FIELD`. |

**Phase 5 adds step 5.5:** wire the `Command: run` agent step to export the
Playwright placeholder values as environment variables before invoking the
suite, so switching stack = changing PLACEHOLDERS only.

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
| 5.4 | Tag cells/root with `data-testid` hooks matching `E2E_CELL_SELECTOR` / `E2E_ROOT_SELECTOR` | Stable E2E contract |
| 5.5 | Export Playwright placeholder values (`BACKEND_DIR`, `BACKEND_START_COMMAND`, `BACKEND_HEALTH_URL`, `FRONTEND_DIR`, `FRONTEND_START_COMMAND`, `FRONTEND_URL`, `E2E_ROOT_SELECTOR`, `E2E_CELL_SELECTOR`, `E2E_HEADING_PATTERN`, `BACKEND_AI_MOVE_FIELD`) as env vars before running `Tests/E2E/Playwright` | Stack-agnostic E2E run |
| 5.6 | Final end-to-end manual testing | Verified system |

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

### Immutable files and folders (applies to every command)

Regardless of which command is issued (`Command: run`, `Command: stop`, or
any future command), the agent MUST treat the following as **read-only**
and MUST NOT create, modify, move, rename, or delete them under any
circumstance:

- `ANALYSIS.md` — this specification document.
- `Tests/` — the entire tests tree (backend, frontend, E2E). Test code is
  the authoritative contract; the *implementation* must satisfy the tests,
  not the other way round.
- `.gitignore` — the repository's existing ignore rules.

If the agent believes a change to any of these is strictly required to
proceed, it MUST stop and ask the user explicitly before touching them.
In particular, generated artefacts (`backend/`, `frontend/`, Dockerfiles,
`secrets.json`, `secrets.example.json`, `.dockerignore`, `nginx.conf`,
`docker-compose.yml`, lockfiles, `node_modules/`, build outputs) MUST be
kept outside these protected paths — either by placing them elsewhere in
the repo or by ensuring the existing `.gitignore` already covers them.

### `Command: run`

When the user writes **`Command: run`** (optionally followed by `with <overrides>`), the agent must:

1. Implement the full game **in memory** following this analysis document (Phases 1–5) using the exact technologies defined in the **PLACEHOLDERS** section, **except** for any placeholder values overridden by the command (see *Inline overrides* below).
2. Create all backend and frontend source files, tests, and Docker artifacts. Tag the application root and each of the 9 cell buttons with stable `data-testid` hooks so they satisfy `E2E_ROOT_SELECTOR` and `E2E_CELL_SELECTOR` without per-stack changes to the Playwright suite.
3. **Run the full test suite inside `Tests/` based on the current stack. All tests MUST pass before proceeding.** This includes:
   - Backend unit tests under `Tests/Backend/<stack>/`.
   - Frontend unit tests under `Tests/Frontend/<stack>/`.
   - **Playwright E2E tests under `Tests/E2E/Playwright/`**, invoked after exporting the *End-to-End (Playwright)* placeholder values as environment variables (`BACKEND_DIR`, `BACKEND_START_COMMAND`, `BACKEND_HEALTH_URL`, `FRONTEND_DIR`, `FRONTEND_START_COMMAND`, `FRONTEND_URL`, `E2E_ROOT_SELECTOR`, `E2E_CELL_SELECTOR`, `E2E_HEADING_PATTERN`, `BACKEND_AI_MOVE_FIELD`). The suite itself MUST NOT be edited when the stack changes.
   The game is not considered ready to use until every test passes successfully.
4. Build and run both the backend (via `BACKEND_RUNTIME_SERVER` on `BACKEND_PORT`) and the frontend (via `FRONTEND_DEV_SERVER` on `FRONTEND_DEV_PORT`).
5. Output **only the artifacts and results** — no code snippets in chat, only confirmation of running services.

#### Inline overrides

The command MAY be followed by `with <tokens>` where `<tokens>` is a free-form,
case-insensitive, order-independent list separated by `+`, `,`, or whitespace.
Each token overrides a group of placeholders from §PLACEHOLDERS. **Everything
not overridden keeps the value defined in §PLACEHOLDERS.**

**Syntax examples** (all equivalent forms are valid):

```
Command: run with react+mui+aspnetcore
Command: run with react, mui, aspnetcore
Command: run with python gpt-4o-mini angular
Command: run with backend=python frontend=react llm=gpt-4o-mini
```

**Resolution rules:**

1. Parse each token into a `(category, value)` pair, using either `category=value`
   syntax or the inference table below when the category is omitted.
2. For each parsed pair, **overwrite** every placeholder listed in its row.
   If a token is ambiguous (e.g. a name mapped to more than one category), the
   agent MUST ask for clarification before proceeding.
3. Unknown tokens MUST cause the agent to stop and ask for clarification —
   never silently ignored.
4. Overrides apply to **frontend, backend, LLM and tests** uniformly: the
   E2E placeholders (`BACKEND_DIR`, `BACKEND_START_COMMAND`, `FRONTEND_DIR`,
   `FRONTEND_START_COMMAND`, `E2E_ROOT_SELECTOR`, `BACKEND_AI_MOVE_FIELD`, …)
   are re-derived from the new backend/frontend values automatically.
5. **Cascading scope.** A single token overrides *every* concrete choice
   that logically follows from it — not just the headline placeholder.
   Specifically, when a token is resolved, the agent MUST apply the change
   across **all** of the following dimensions:

   - **Source paths & directory layout** — `BACKEND_DIR` / `FRONTEND_DIR`
     become the stack-matching folders (e.g. `frontend/React`,
     `backend/AspNetCore`, `frontend/Angular`, `backend/Python`).
   - **Project/manifest files** — `BACKEND_MANIFEST_FILE`,
     `FRONTEND_MANIFEST_FILE`, `FRONTEND_BUILD_CONFIG_FILE`, lockfiles, and
     tool configs match the chosen framework.
   - **Components & app shell** — every component listed in §4.2.1 (board,
     cell, game-status, score-board, new-game-button, theme wrapper, API
     client, state store) is implemented in the chosen `UI_FRAMEWORK` +
     `UI_LANGUAGE` + `UI_LIBRARY` + `UI_STATE_MANAGER`.
   - **Backend modules** — `GameEngine`, `AiPlayerService`, controller /
     router, models, DI / settings wiring, CORS, rate limiting, and
     `LLM_SDK` integration are implemented in the chosen
     `BACKEND_LANGUAGE` / `BACKEND_FRAMEWORK`.
   - **Unit tests** — the agent runs the existing tests under
     `Tests/Backend/<stack>/` and `Tests/Frontend/<stack>/` that match the
     chosen stack (e.g. `Tests/Backend/AspNetCore/` + `Tests/Frontend/React/`
     for `react+aspnetcore`). The **test code itself MUST NOT be modified**
     to fit the implementation — the implementation must satisfy the
     existing test contract.
   - **E2E tests** — the single abstract Playwright suite in
     `Tests/E2E/Playwright/` runs unchanged, driven by the re-derived
     env-var values (selectors, start commands, URL, JSON field name).
   - **Docker & deployment** — `BACKEND_BASE_IMAGE`,
     `FRONTEND_BUILD_IMAGE`, `FRONTEND_WEB_SERVER_IMAGE`, Dockerfile `CMD`,
     compose service definitions, and health endpoints follow the chosen
     stack.
   - **LLM wiring** — if an `llm` / `llm-provider` token is given,
     `LLM_MODEL`, `LLM_SDK`, `ENV_LLM_ENDPOINT`, `ENV_LLM_KEY`,
     `ENV_LLM_MODEL`, and the shape of `secrets.json` are updated; prompt
     template in §4.1.3 stays identical (the prompt is model-agnostic).
   - **Infra** — `CONTAINER_RUNTIME`, `CONTAINER_ORCHESTRATOR_LOCAL`,
     `CONTAINER_ORCHESTRATOR_CLOUD`, `CONTAINER_REGISTRY` follow their own
     tokens.

   In short: a flag like `react` means "**everything React** — paths,
   components, unit tests, E2E selectors, build tool, dev server, manifest,
   config — coherently applied across the whole repo".
6. After resolution, the agent MUST print the final effective values for every
   placeholder it changed, so the user can verify the overrides before the
   build starts.

**Inference table** (token → category → placeholders overridden):

| Token family (examples) | Category | Placeholders overwritten |
|-------------------------|----------|--------------------------|
| `react`, `angular`, `vue`, `svelte` | `frontend` | `UI_FRAMEWORK`, `FRONTEND_BUILD_TOOL`, `FRONTEND_DEV_SERVER`, `FRONTEND_HTTP_CLIENT`, `FRONTEND_DIR`, `FRONTEND_START_COMMAND`, `FRONTEND_MANIFEST_FILE`, `FRONTEND_BUILD_CONFIG_FILE`, `E2E_ROOT_SELECTOR` |
| `mui`, `material`, `chakra`, `antd`, `tailwind`, `bootstrap` | `ui-library` | `UI_LIBRARY` |
| `zustand`, `redux`, `mobx`, `ngrx`, `pinia` | `ui-state` | `UI_STATE_MANAGER` |
| `typescript`, `javascript` | `ui-language` | `UI_LANGUAGE` |
| `aspnetcore`, `dotnet`, `csharp` | `backend` | `BACKEND_LANGUAGE`, `BACKEND_FRAMEWORK`, `BACKEND_RUNTIME_SERVER`, `BACKEND_VALIDATION_LIB`, `BACKEND_SETTINGS_LIB`, `BACKEND_RATE_LIMIT_LIB`, `BACKEND_PACKAGE_MANAGER`, `BACKEND_BASE_IMAGE`, `BACKEND_MANIFEST_FILE`, `BACKEND_DIR`, `BACKEND_START_COMMAND`, `BACKEND_AI_MOVE_FIELD` |
| `fastapi`, `python`, `flask`, `django` | `backend` | (same row as above, with Python-appropriate values) |
| `node`, `express`, `nest`, `nestjs` | `backend` | (same row as above, with Node-appropriate values) |
| `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `claude-3-5-sonnet`, `llama-3` | `llm` | `LLM_MODEL`, `LLM_SDK` (and `ENV_LLM_*` if the provider changes) |
| `azure-openai`, `openai`, `anthropic`, `bedrock` | `llm-provider` | `LLM_SDK`, `ENV_LLM_ENDPOINT`, `ENV_LLM_KEY`, `ENV_LLM_MODEL` |
| `docker`, `podman`, `rancher` | `runtime` | `CONTAINER_RUNTIME` |
| `compose`, `k8s`, `kubernetes` | `orchestrator-local` | `CONTAINER_ORCHESTRATOR_LOCAL` |
| `aca`, `container-apps`, `aks`, `ecs`, `cloud-run` | `orchestrator-cloud` | `CONTAINER_ORCHESTRATOR_CLOUD` |
| `port:backend=<n>`, `port:frontend=<n>` | `port` | `BACKEND_PORT` / `FRONTEND_DEV_PORT` (and dependent URLs) |

**Worked example.** `Command: run with react+mui+aspnetcore`

- `react` → frontend overrides: `UI_FRAMEWORK = React`, `FRONTEND_BUILD_TOOL = Vite`,
  `FRONTEND_DEV_SERVER = Vite dev server`, `FRONTEND_HTTP_CLIENT = fetch`,
  `FRONTEND_DIR = frontend/React`, `FRONTEND_START_COMMAND = npm run dev`,
  `FRONTEND_MANIFEST_FILE = package.json`, `FRONTEND_BUILD_CONFIG_FILE = vite.config.ts`,
  `E2E_ROOT_SELECTOR = #root`.
- `mui` → `UI_LIBRARY = MUI (Material UI)`.
- `aspnetcore` → backend overrides: `BACKEND_LANGUAGE = C#`, `BACKEND_FRAMEWORK = ASP.NET Core`,
  `BACKEND_RUNTIME_SERVER = Kestrel`, `BACKEND_VALIDATION_LIB = DataAnnotations`,
  `BACKEND_SETTINGS_LIB = Microsoft.Extensions.Configuration`,
  `BACKEND_RATE_LIMIT_LIB = Microsoft.AspNetCore.RateLimiting`,
  `BACKEND_PACKAGE_MANAGER = NuGet`, `BACKEND_BASE_IMAGE = mcr.microsoft.com/dotnet/aspnet:9.0`,
  `BACKEND_MANIFEST_FILE = *.csproj`, `BACKEND_DIR = backend/AspNetCore`,
  `BACKEND_START_COMMAND = dotnet run --urls http://127.0.0.1:BACKEND_PORT --no-launch-profile`,
  `BACKEND_AI_MOVE_FIELD = aiMove`.
- Everything else (LLM, ports, infra) keeps the values from §PLACEHOLDERS.

### `Command: stop`

When the user writes **`Command: stop`**, the agent must:

1. Stop any running backend and frontend processes.
2. **Delete all folders and files** created during the `run` command
   (typically `backend/`, `frontend/`, and any root-level generated files
   such as `docker-compose.yml`, `secrets.json`, `secrets.example.json`,
   `.dockerignore`, `nginx.conf`, plus build/install caches like
   `node_modules/`, `bin/`, `obj/`, `.venv/`, `dist/`, `build/`).
3. **NEVER create, modify, move, rename, or delete** `ANALYSIS.md`,
   `Tests/` (or any file/folder inside it), or `.gitignore`. These are
   protected per the *Immutable files and folders* rule above. If cleanup
   would require touching them, the agent MUST stop and ask the user.
