"""Data export helpers — serialize app data to CSV and JSON.

Shared core used by on-demand export endpoints, scheduled backups, and reports.
Keeping serialization here (not in routers) so every consumer produces identical output.
"""
import csv
import io
import json
from datetime import date, datetime
from typing import Any

from sqlalchemy.orm import Session

from backend.models import Expense, Income, CashAccount


EXPENSE_FIELDS = ["id", "entry_date", "category", "description", "amount", "notes", "created_at"]
INCOME_FIELDS = ["id", "entry_date", "source", "description", "amount", "notes", "created_at"]
CASH_FIELDS = ["id", "account_type", "account_name", "balance", "notes", "updated_at", "created_at"]


def _val(v: Any) -> Any:
    """Normalize a value for serialization (dates -> ISO strings)."""
    if isinstance(v, (date, datetime)):
        return v.isoformat()
    return v


def _row_to_dict(row, fields: list[str]) -> dict:
    return {f: _val(getattr(row, f, None)) for f in fields}


def expenses_data(db: Session) -> list[dict]:
    rows = db.query(Expense).order_by(Expense.id).all()
    return [_row_to_dict(r, EXPENSE_FIELDS) for r in rows]


def income_data(db: Session) -> list[dict]:
    rows = db.query(Income).order_by(Income.id).all()
    return [_row_to_dict(r, INCOME_FIELDS) for r in rows]


def cash_data(db: Session) -> list[dict]:
    rows = db.query(CashAccount).order_by(CashAccount.id).all()
    return [_row_to_dict(r, CASH_FIELDS) for r in rows]


def to_csv(rows: list[dict], fields: list[str]) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for r in rows:
        writer.writerow(r)
    return buf.getvalue()


def to_json(data: Any) -> str:
    return json.dumps(data, indent=2, default=_val)


# Mapping for generic endpoint dispatch: name -> (data_fn, fields)
DATASETS = {
    "expenses": (expenses_data, EXPENSE_FIELDS),
    "income": (income_data, INCOME_FIELDS),
    "cash": (cash_data, CASH_FIELDS),
}


def full_backup(db: Session) -> dict:
    """All data in one structure — used by scheduled backups."""
    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "expenses": expenses_data(db),
        "income": income_data(db),
        "cash_accounts": cash_data(db),
    }
