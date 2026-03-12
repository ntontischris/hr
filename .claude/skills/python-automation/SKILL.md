---
name: python-automation
description: Python automation patterns for API integrations, data processing, web scraping, file handling, and background tasks. Use when user mentions Python scripts, automation, data processing, API integration, web scraping, cron jobs, or batch processing.
---

# Python Automation Patterns

## Project Structure
```
automation/
├── pyproject.toml        # Dependencies (use uv or poetry)
├── .env                  # Secrets (never commit)
├── src/
│   ├── __init__.py
│   ├── main.py           # Entry point
│   ├── config.py          # Environment & settings
│   ├── clients/           # API client wrappers
│   │   ├── supabase.py
│   │   ├── stripe.py
│   │   └── openai.py
│   ├── workflows/         # Business logic
│   │   ├── sync_users.py
│   │   └── process_payments.py
│   └── utils/
│       ├── retry.py
│       └── logging.py
└── tests/
```

## Config Pattern
```python
# src/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    stripe_secret_key: str
    openai_api_key: str
    debug: bool = False
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Async HTTP Client Pattern
```python
import httpx
from contextlib import asynccontextmanager

@asynccontextmanager
async def api_client(base_url: str, headers: dict = {}):
    async with httpx.AsyncClient(
        base_url=base_url,
        headers=headers,
        timeout=30,
    ) as client:
        yield client

# Usage
async with api_client("https://api.example.com", 
    headers={"Authorization": f"Bearer {token}"}
) as client:
    response = await client.get("/users")
    data = response.json()
```

## Batch Processing
```python
import asyncio
from itertools import batched  # Python 3.12+

async def process_in_batches(items: list, batch_size: int = 10):
    """Process items in parallel batches."""
    results = []
    for batch in batched(items, batch_size):
        batch_results = await asyncio.gather(
            *[process_item(item) for item in batch],
            return_exceptions=True
        )
        for result in batch_results:
            if isinstance(result, Exception):
                logger.error(f"Item failed: {result}")
            else:
                results.append(result)
        
        await asyncio.sleep(0.5)  # Rate limiting between batches
    
    return results
```

## Retry Pattern
```python
import asyncio
import logging

logger = logging.getLogger(__name__)

async def with_retry(
    func, *args, 
    max_retries: int = 3, 
    base_delay: float = 1.0,
    **kwargs
):
    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt)
            logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s")
            await asyncio.sleep(delay)
```

## File Processing
```python
import csv
import json
from pathlib import Path

def process_csv(input_path: str, output_path: str):
    """Read CSV, transform, write results."""
    input_file = Path(input_path)
    results = []
    
    with input_file.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            transformed = transform_row(row)
            if transformed:
                results.append(transformed)
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    return len(results)
```

## Logging Setup
```python
import logging
import sys

def setup_logging(level: str = "INFO"):
    logging.basicConfig(
        level=getattr(logging, level),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("automation.log"),
        ]
    )
```

## Dependencies (pyproject.toml)
```toml
[project]
name = "automation"
requires-python = ">=3.12"
dependencies = [
    "httpx>=0.27",
    "pydantic-settings>=2.0",
    "python-dotenv>=1.0",
]

[project.optional-dependencies]
dev = ["pytest", "pytest-asyncio", "ruff"]
```

## Running
```bash
# With uv (recommended)
uv run python -m src.main

# With standard pip
pip install -e .
python -m src.main
```
