# Tic Tac Toe AI — Deep Analysis & Implementation Plan

## 1. Project Overview

A web-based Tic Tac Toe game where a human player competes against an AI opponent powered by Azure OpenAI (GPT-4o). The solution is composed of:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript + MUI 5 | Game UI, board rendering, user interaction |
| Backend | ASP.NET Core 8 Web API | Game logic orchestration, AI integration, REST API |
| AI | Azure OpenAI GPT-4o | Opponent move generation |
| Testing | xUnit (backend) + Vitest (frontend) | Unit & integration tests |
| Infrastructure | Docker / Docker Compose | Containerized deployment (Rancher Desktop / Azure Container Apps) |

---

## 2. Architecture

```
┌─────────────────────────────┐
│       React Frontend        │
│  (MUI components, Vite)     │
│  http://localhost:5173       │
└──────────┬──────────────────┘
           │  REST API (JSON)
           ▼
┌─────────────────────────────┐
│   ASP.NET Core 8 Web API    │
│   http://localhost:5000      │
│                             │
│  ┌───────────┐ ┌──────────┐│
│  │ GameEngine│ │ AIService││
│  └───────────┘ └─────┬────┘│
└──────────────────────┼──────┘
                       │  HTTPS (Azure OpenAI SDK)
                       ▼
              ┌────────────────┐
              │ Azure OpenAI   │
              │ GPT-4o         │
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

### 4.1 Backend — ASP.NET Core 8 Web API

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

### 4.2 Frontend — React + TypeScript + MUI

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

#### 4.2.2 MUI Components Used

| Component | MUI Element | Notes |
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

#### 4.3.2 Frontend Tests (Vitest + React Testing Library)

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
| 3.1 | Scaffold React + Vite + TypeScript project | Project setup |
| 3.2 | Install and configure MUI, create custom theme | Themed app |
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
3. **Run the full test suite (backend and frontend). All tests MUST pass before proceeding.** The game is not considered ready to use until every test passes successfully.
4. Build and run both the backend (`dotnet run`) and the frontend (`npm run dev`).
5. Output **only the artifacts and results** — no code snippets in chat, only confirmation of running services.

### `Command: stop`

When the user writes **`Command: stop`**, the agent must:

1. Stop any running backend and frontend processes.
2. **Delete all folders** created during the `run` command (`backend/`, `frontend/`, and any root-level generated files such as `docker-compose.yml`, `.env`, `.gitignore`, `nginx.conf`).
3. **NEVER delete the `Tests/` folder.** Preserve this `ANALYSIS.md` file and the `Tests/` folder.
