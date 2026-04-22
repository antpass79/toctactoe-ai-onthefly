"""Ensure the Python backend source tree is importable during tests.

Expected layout (mirrors Tests/ layout):

    backend/Python/app/...            <-- source under test
    Tests/Backend/Python/test_*.py    <-- this suite
"""

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
_BACKEND_SRC = _REPO_ROOT / "backend" / "Python"

if str(_BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(_BACKEND_SRC))
