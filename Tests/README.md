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
