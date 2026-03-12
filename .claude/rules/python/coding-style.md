# Python Rules (extends common/)

## Style
- Use type hints on ALL functions (parameters and return)
- Use dataclasses or Pydantic models for structured data
- Use `async/await` for I/O operations
- Format with `ruff format`, lint with `ruff check`
- Follow PEP 8 naming: snake_case for functions/variables, PascalCase for classes

## Imports
- Group: stdlib → third-party → local
- Use absolute imports, not relative
- Use `from __future__ import annotations` for forward references

## Error Handling
- Use specific exception types, not bare `except:`
- Create custom exceptions for domain errors
- Use `logging` module, not `print()` for debugging
- Use context managers for resource cleanup

## Async
- Use `httpx` for HTTP (not requests — it's sync-only)
- Use `asyncio.gather()` for parallel operations
- Always set timeouts on network calls
- Use `tenacity` for retry logic

## Dependencies
- Use `pyproject.toml` for dependencies (not requirements.txt)
- Pin major versions: `httpx>=0.27,<1.0`
- Use `uv` for fast package management
