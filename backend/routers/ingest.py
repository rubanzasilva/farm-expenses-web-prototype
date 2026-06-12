"""Chat ingest webhook — turn a freeform message into an expense.

A Discord (or Telegram) bot forwards the user's message here with the shared
INGEST_SECRET. We parse it (Claude via Bedrock, or keyword fallback), create the
expense, and return a confirmation string the bot can echo back to the user.

Auth is a shared secret (not JWT) since the caller is a bot, not a browser user.
"""
import hmac
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import INGEST_SECRET
from backend.database import get_db
from backend.models import Expense
from backend.parser import parse_expense

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


class IngestMessage(BaseModel):
    text: str
    source: Optional[str] = None  # e.g. "discord", "telegram" — for logging/future use


class IngestResult(BaseModel):
    ok: bool
    reply: str
    expense_id: Optional[int] = None


def _check_secret(x_ingest_secret: Optional[str]) -> None:
    if not INGEST_SECRET:
        raise HTTPException(status_code=503, detail="Ingest is not configured (INGEST_SECRET unset)")
    if not x_ingest_secret or not hmac.compare_digest(x_ingest_secret, INGEST_SECRET):
        raise HTTPException(status_code=401, detail="Invalid ingest secret")


def _fmt_amount(n: float) -> str:
    return f"{abs(n):,.0f}"


@router.post("/discord", response_model=IngestResult)
def ingest_discord(
    body: IngestMessage,
    db: Session = Depends(get_db),
    x_ingest_secret: Optional[str] = Header(default=None),
):
    _check_secret(x_ingest_secret)

    parsed = parse_expense(body.text)

    if parsed["amount"] <= 0:
        return IngestResult(
            ok=False,
            reply=(
                "I couldn't find an amount in that message. "
                "Try something like: `gumboots 20000` or `paid 20k for transport`."
            ),
        )

    row = Expense(
        entry_date=parsed["entry_date"],
        category=parsed["category"],
        description=parsed["description"],
        amount=parsed["amount"],
        notes="via discord",
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    date_part = f" on {parsed['entry_date']}" if parsed["entry_date"] else ""
    reply = (
        f"✅ Logged: *{parsed['category']}* — {parsed['description']} "
        f"= UGX {_fmt_amount(parsed['amount'])}{date_part} (#{row.id})"
    )
    return IngestResult(ok=True, reply=reply, expense_id=row.id)
