# Tests

**THIS FOLDER MUST NOT BE DELETED.** It contains all tests used to validate the generated program, across every supported backend and frontend stack.

**All tests MUST pass before the game is considered ready to use.** Every time the program is generated or modified, run the full test suite for the active stack. The game is not ready until every test in that stack passes successfully.

## Structure

```
Tests/
├── Backend/
│   ├── AspNetCore/      # xUnit tests for ASP.NET Core 9 / C# API
│   └── Python/          # pytest tests for Python / FastAPI API
├── Frontend/
│   ├── React/           # Vitest + React Testing Library tests
│   └── Angular/         # Vitest + Angular Testing Library tests
└── E2E/
    └── Playwright/      # Browser-driven integration tests against the live UI
```

Backend and frontend suites are **unit tests** — they mock HTTP, so a passing
suite only proves the individual layer works in isolation. The **E2E suite**
drives a real browser against the running stack and therefore catches
real-world issues such as CORS misconfiguration, wiring bugs, and broken
HTTP contracts between frontend and backend.

Every folder at the same level covers **the same test cases** against the same behavioural contract, so any backend can be paired with any frontend and validated independently.

### Coverage (identical across stacks)

| Layer | Subject | Cases |
|-------|---------|-------|
| Backend | `GameEngine` | move validation (incl. out-of-range & bad board length), apply-move immutability, win detection on all 8 lines, draw detection, status checks, available positions |
| Backend | `AiPlayerService` | returns a valid available position, handles single-slot boards, always stays within available positions over many runs, works with a mocked engine |
| Backend | Game router/controller | `new` returns empty board; `move` updates board & triggers AI move; player-wins skips AI; draw detection; rejects occupied cell / finished game / invalid board content; AI-win scenario |
| Frontend | Board | renders 9 cells / 3 rows, renders X & O, click emits cell index, disabled prop disables all cells, occupied cells stay disabled |
| Frontend | Cell | renders empty / X / O, click handler, disabled when occupied, disabled via prop, no click when disabled |
| Frontend | GameStatus | ongoing / win (player) / win (AI) / draw / loading / loading-wins-over-status |
| Frontend | NewGameButton | renders, click triggers reset |
| Frontend | ScoreBoard | renders initial zeros, renders updated scores |
| Frontend | Store / hook | initial state, `makeMove` calls API & updates board, score on player-win / AI-win / draw, `newGame` resets board, blocks moves when game over, handles API errors, preserves score across new games |

## Expected source layout

Tests reference source under sibling folders with matching names:

```
backend/
├── AspNetCore/          # TicTacToe.Api (C#)
└── Python/              # FastAPI app/ package
frontend/
├── React/               # React + Vite + Zustand + MUI
└── Angular/             # Angular + MUI + Zustand (vanilla) store
```

## Running Tests

### Backend — AspNetCore

```bash
cd Tests/Backend/AspNetCore
dotnet test --verbosity normal
```

### Backend — Python

```bash
cd Tests/Backend/Python
pip install -e .            # installs pytest, httpx, fastapi, pydantic*
pytest
```

### Frontend — React

```bash
cd Tests/Frontend/React
npm install
npm test
```

### E2E — Playwright (browser integration)

Runs real Chromium against the live backend + frontend. Auto-starts
`uvicorn` on :5000 and `ng serve` on :4200 if they aren't already running
(`reuseExistingServer: true`), and reuses them otherwise.

```bash
cd Tests/E2E/Playwright
npm install
npx playwright install chromium    # one-time browser download
npm test                           # headless run
npm run test:headed                # watch the browser
npm run test:ui                    # Playwright UI mode
```

Two suites are included:
- **`smoke.spec.ts`** — talks to the real backend. Proves CORS works and that
  a player move triggers a genuine AI response over HTTP.
- **`game-flow.spec.ts`** — mocks the backend via `page.route` to assert
  exact UI behaviour for player-win, AI-win, draw, new-game reset, loading
  state, and score updates.

### Frontend — Angular

```bash
cd Tests/Frontend/Angular
npm install
npm test
```

### Run everything (matching stacks only)

```bash
# Example: .NET backend + React frontend
cd Tests/Backend/AspNetCore && dotnet test && cd ../../Frontend/React && npm test

# Example: Python backend + Angular frontend
cd Tests/Backend/Python && pytest && cd ../../Frontend/Angular && npm test
```
# Tests

**THIS FOLDER MUST NOT BE DELETED.** It contains all tests used to validate the generated program.

**All tests MUST pass before the game is considered ready to use.** Every time the program is generated or modified, run the full test suite. The game is not ready until every backend and frontend test passes successfully.

## Structure

- `Backend/` — xUnit tests for the ASP.NET Core API (GameEngine, AiPlayerService, GameController)
- `Frontend/` — Vitest + React Testing Library tests for frontend components and hooks

## Running Tests

### Backend (42 tests)

```bash
cd backend
dotnet test --verbosity normal
```

### Frontend (32 tests)

```bash
cd Tests/Frontend
npm test
```

### Run All

```bash
# From workspace root:
cd backend && dotnet test && cd ../Tests/Frontend && npm test
```
