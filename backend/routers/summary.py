from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import Expense, Income, CashAccount
from backend.auth import get_current_user
from backend.categories import EXPENSE_CATEGORIES, INCOME_SOURCES

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("")
def get_summary(
    _user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    exp_rows = (
        db.query(Expense.category, func.count().label("n"), func.coalesce(func.sum(Expense.amount), 0).label("total"))
        .group_by(Expense.category)
        .all()
    )
    inc_rows = (
        db.query(Income.source, func.count().label("n"), func.coalesce(func.sum(Income.amount), 0).label("total"))
        .group_by(Income.source)
        .all()
    )

    exp_map = {r[0]: (r[1], float(r[2])) for r in exp_rows}
    inc_map = {r[0]: (r[1], float(r[2])) for r in inc_rows}

    total_exp = sum(v[1] for v in exp_map.values())
    total_inc = sum(v[1] for v in inc_map.values())

    expenses_by_category = []
    for cat in EXPENSE_CATEGORIES:
        n, t = exp_map.get(cat, (0, 0.0))
        expenses_by_category.append({
            "category": cat,
            "n": n,
            "total": t,
            "pct": (t / total_exp) if total_exp else 0.0,
        })

    income_by_source = []
    for src in INCOME_SOURCES:
        n, t = inc_map.get(src, (0, 0.0))
        income_by_source.append({
            "source": src,
            "n": n,
            "total": t,
            "pct": (t / total_inc) if total_inc else 0.0,
        })

    # Get cash accounts
    cash_accounts = db.query(CashAccount).all()
    total_cash = sum(acc.balance for acc in cash_accounts)
    cash_by_type = {}
    for acc in cash_accounts:
        if acc.account_type not in cash_by_type:
            cash_by_type[acc.account_type] = []
        cash_by_type[acc.account_type].append({
            "id": acc.id,
            "name": acc.account_name,
            "balance": acc.balance,
        })

    return {
        "expenses_by_category": expenses_by_category,
        "income_by_source": income_by_source,
        "total_expenses": total_exp,
        "total_income": total_inc,
        "net": total_inc - total_exp,
        "total_cash": total_cash,
        "cash_by_type": cash_by_type,
        "cash_accounts": [{"id": acc.id, "account_type": acc.account_type, "account_name": acc.account_name, "balance": acc.balance} for acc in cash_accounts],
    }
