---
name: n8n-to-python
description: Convert n8n workflow JSON to Python code. Patterns for HTTP requests, data transformation, conditional logic, loops, error handling, scheduling, and API integrations. Use when user mentions n8n, workflow automation, JSON workflow, workflow conversion, or automating API sequences.
---

# n8n Workflow → Python Conversion

## Core Mapping: n8n Nodes → Python

| n8n Node           | Python Equivalent                        |
|--------------------|------------------------------------------|
| HTTP Request       | `httpx.post()` / `requests.post()`       |
| IF                 | `if condition:`                           |
| Switch             | `match value:` or `if/elif`              |
| Set                | `data["field"] = value`                  |
| Code               | Direct Python (already code)             |
| Merge              | `{**dict1, **dict2}` or list concat      |
| Loop Over Items    | `for item in items:`                     |
| Wait               | `asyncio.sleep(n)` or `time.sleep(n)`    |
| Webhook            | FastAPI/Flask endpoint                   |
| Cron/Schedule      | `schedule` lib or `APScheduler`          |
| Error Trigger      | `try/except` with notification           |
| Postgres           | `asyncpg` or `psycopg2`                 |
| Supabase           | `supabase-py` client                     |
| Send Email         | `resend` or `smtplib`                    |
| Slack              | `slack_sdk`                              |
| OpenAI             | `openai` client                          |

## Conversion Process

### Step 1: Read n8n JSON
```python
import json

def load_workflow(path: str) -> dict:
    with open(path) as f:
        workflow = json.load(f)
    return workflow

def extract_nodes(workflow: dict) -> list:
    """Extract nodes in execution order."""
    nodes = workflow.get("nodes", [])
    connections = workflow.get("connections", {})
    # Build execution order from connections
    return sorted(nodes, key=lambda n: n.get("position", [0, 0])[1])
```

### Step 2: Map Each Node Type
```python
import httpx
import asyncio
from typing import Any

async def execute_http_request(node: dict, context: dict) -> dict:
    """Convert n8n HTTP Request node."""
    params = node["parameters"]
    
    method = params.get("method", "GET").upper()
    url = resolve_expressions(params["url"], context)
    headers = {h["name"]: h["value"] for h in params.get("headerParameters", {}).get("parameters", [])}
    body = params.get("body", {})
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.request(
            method=method,
            url=url,
            headers=headers,
            json=body if method in ("POST", "PUT", "PATCH") else None,
            params=body if method == "GET" else None,
        )
        response.raise_for_status()
        return response.json()


def execute_if_node(node: dict, context: dict) -> str:
    """Convert n8n IF node — returns 'true' or 'false' branch."""
    conditions = node["parameters"].get("conditions", {})
    # Evaluate conditions against context
    for condition in conditions.get("string", []):
        value = resolve_expressions(condition["value1"], context)
        operation = condition["operation"]
        value2 = condition.get("value2", "")
        
        if operation == "equals" and value == value2:
            return "true"
        elif operation == "contains" and value2 in value:
            return "true"
        elif operation == "notEmpty" and value:
            return "true"
    return "false"


def execute_set_node(node: dict, context: dict) -> dict:
    """Convert n8n Set node — transforms data."""
    values = node["parameters"].get("values", {})
    result = {}
    for item in values.get("string", []):
        result[item["name"]] = resolve_expressions(item["value"], context)
    for item in values.get("number", []):
        result[item["name"]] = item["value"]
    for item in values.get("boolean", []):
        result[item["name"]] = item["value"]
    return result
```

### Step 3: Expression Resolution
```python
import re

def resolve_expressions(template: str, context: dict) -> str:
    """Convert n8n expressions {{ $json.field }} to Python values."""
    if not isinstance(template, str):
        return template
    
    def replacer(match):
        expr = match.group(1).strip()
        # $json.field → context["field"]
        if expr.startswith("$json."):
            path = expr[6:].split(".")
            value = context
            for key in path:
                value = value.get(key, "")
            return str(value)
        # $env.VAR → os.environ
        if expr.startswith("$env."):
            return os.environ.get(expr[5:], "")
        return match.group(0)
    
    return re.sub(r'\{\{\s*(.+?)\s*\}\}', replacer, template)
```

## Complete Workflow Template
```python
"""
Converted from n8n workflow: [workflow_name]
Original: [filename].json
"""
import asyncio
import httpx
import logging
from datetime import datetime
from typing import Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WorkflowRunner:
    def __init__(self):
        self.context: dict[str, Any] = {}
        self.client = httpx.AsyncClient(timeout=30)
    
    async def run(self, trigger_data: dict | None = None):
        """Main workflow execution."""
        self.context = trigger_data or {}
        logger.info(f"Workflow started at {datetime.now()}")
        
        try:
            # Step 1: [Node name from n8n]
            result = await self.step_1()
            
            # Step 2: [Node name]
            if self.should_continue(result):
                result = await self.step_2(result)
            
            # Step 3: [Node name]
            final = await self.step_3(result)
            
            logger.info("Workflow completed successfully")
            return final
            
        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            await self.handle_error(e)
            raise
        finally:
            await self.client.aclose()
    
    async def step_1(self) -> dict:
        """[Describe what this step does]"""
        response = await self.client.get("https://api.example.com/data")
        response.raise_for_status()
        return response.json()
    
    def should_continue(self, data: dict) -> bool:
        """[IF node condition]"""
        return bool(data.get("results"))
    
    async def step_2(self, data: dict) -> list:
        """[Loop/transform step]"""
        results = []
        for item in data["results"]:
            transformed = {
                "id": item["id"],
                "processed_at": datetime.now().isoformat(),
            }
            results.append(transformed)
        return results
    
    async def step_3(self, data: list) -> dict:
        """[Final step — save/notify]"""
        response = await self.client.post(
            "https://api.example.com/save",
            json={"items": data}
        )
        response.raise_for_status()
        return response.json()
    
    async def handle_error(self, error: Exception):
        """Error notification (replaces n8n Error Trigger)"""
        # Send to Slack, email, etc.
        logger.error(f"Sending error notification: {error}")


# Entry point
async def main():
    runner = WorkflowRunner()
    result = await runner.run()
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
```

## Scheduling (replaces n8n Cron Trigger)
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=9, minute=0)  # Daily at 9am
async def daily_workflow():
    runner = WorkflowRunner()
    await runner.run()

scheduler.start()
```

## Webhook Trigger (replaces n8n Webhook node)
```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/webhook/workflow-trigger")
async def webhook_trigger(request: Request):
    data = await request.json()
    runner = WorkflowRunner()
    result = await runner.run(trigger_data=data)
    return {"status": "ok", "result": result}
```

## Error Handling Patterns
```python
# Retry with backoff (replaces n8n retry settings)
import tenacity

@tenacity.retry(
    stop=tenacity.stop_after_attempt(3),
    wait=tenacity.wait_exponential(min=1, max=10),
    retry=tenacity.retry_if_exception_type(httpx.HTTPStatusError)
)
async def resilient_api_call(url: str, data: dict):
    response = await client.post(url, json=data)
    response.raise_for_status()
    return response.json()
```

## Common n8n → Python Gotchas
- n8n passes ALL items between nodes — in Python, explicitly pass data
- n8n expressions use `{{ }}` — replace with f-strings or .format()
- n8n binary data (files) → use bytes/io.BytesIO in Python
- n8n credentials → use environment variables or secret manager
- n8n error workflow → use try/except + notification
