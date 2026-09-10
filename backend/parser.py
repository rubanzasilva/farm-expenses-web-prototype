"""Parse a freeform expense message into structured fields.

Uses Claude Haiku via AWS Bedrock when AWS creds are present; otherwise (or on
any error) falls back to the keyword-based classifier in classifier.py so the
ingest path never hard-fails.

Example input:  "paid 20k for gumboots for the new worker"
Example output: {"amount": 20000, "category": "PPE/Equipment",
                 "description": "gumboots for the new worker", "entry_date": None}
"""
import json
import os
import re
from datetime import date

from backend.categories import EXPENSE_CATEGORIES
from backend.classifier import classify_expense

# Bedrock model id (note the anthropic. provider prefix on Bedrock).
BEDROCK_MODEL = os.environ.get("BEDROCK_MODEL", "anthropic.claude-haiku-4-5")


def _bedrock_available() -> bool:
    return bool(os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_SECRET_ACCESS_KEY"))


_SYSTEM = (
    "You extract a single farm expense from a short freeform message. "
    "Return ONLY the structured fields. Amounts may use shorthand like '20k' = 20000, "
    "'1.5m' = 1500000. The category MUST be exactly one of the allowed categories. "
    "If no date is mentioned, leave entry_date null (do not guess today). "
    "description is a concise human-readable summary of what was bought."
)

_SCHEMA = {
    "type": "object",
    "properties": {
        "amount": {"type": "number"},
        "category": {"type": "string", "enum": EXPENSE_CATEGORIES},
        "description": {"type": "string"},
        "entry_date": {"type": ["string", "null"], "description": "ISO date YYYY-MM-DD or null"},
    },
    "required": ["amount", "category", "description", "entry_date"],
    "additionalProperties": False,
}


def _parse_with_bedrock(text: str) -> dict:
    from anthropic import AnthropicBedrock

    client = AnthropicBedrock()  # reads AWS_ACCESS_KEY_ID/SECRET/REGION from env
    resp = client.messages.create(
        model=BEDROCK_MODEL,
        max_tokens=512,
        system=_SYSTEM,
        messages=[{"role": "user", "content": f"Allowed categories: {EXPENSE_CATEGORIES}\n\nMessage: {text}"}],
        output_config={"format": {"type": "json_schema", "schema": _SCHEMA}},
    )
    raw = next(b.text for b in resp.content if b.type == "text")
    return json.loads(raw)


# --- Regex fallback helpers ---

def _extract_amount(text: str) -> float:
    """Pull the most likely money value: the largest number in the text,
    honoring k/m shorthand. (The amount is almost always the biggest figure;
    counts like '100 suckers' are smaller than the price.)"""
    amounts = []
    for num_str, suffix in re.findall(r"(\d[\d,]*\.?\d*)\s*([km])?", text.lower()):
        num = float(num_str.replace(",", ""))
        if suffix == "k":
            num *= 1_000
        elif suffix == "m":
            num *= 1_000_000
        amounts.append(num)
    return max(amounts) if amounts else 0.0


def _parse_with_fallback(text: str) -> dict:
    return {
        "amount": _extract_amount(text),
        "category": classify_expense(text),
        "description": text.strip(),
        "entry_date": None,
    }


def _normalize(data: dict) -> dict:
    """Coerce/validate the parsed dict into the shape the API expects."""
    cat = data.get("category")
    if cat not in EXPENSE_CATEGORIES:
        cat = "Other"
    raw_date = data.get("entry_date")
    entry_date = None
    if raw_date:
        try:
            entry_date = date.fromisoformat(str(raw_date)[:10]).isoformat()
        except ValueError:
            entry_date = None
    return {
        "amount": float(data.get("amount") or 0),
        "category": cat,
        "description": (data.get("description") or "").strip(),
        "entry_date": entry_date,
    }


def parse_expense(text: str) -> dict:
    """Parse freeform text -> {amount, category, description, entry_date}.

    Tries Bedrock first when creds are present; on any failure falls back to
    the keyword classifier + regex amount extraction.
    """
    text = (text or "").strip()
    if not text:
        return {"amount": 0.0, "category": "Other", "description": "", "entry_date": None}

    if _bedrock_available():
        try:
            return _normalize(_parse_with_bedrock(text))
        except Exception:
            # Bedrock unreachable, model access not granted, bad JSON, etc.
            # Fall through to the deterministic fallback rather than 500.
            pass

    return _normalize(_parse_with_fallback(text))
