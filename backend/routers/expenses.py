from typing import Annotated, Optional
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc

from backend.database import get_db
from backend.models import Expense
from backend.schemas import ExpenseIn, ExpenseOut
from backend.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    _user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    category: Optional[str] = None,
    q: Optional[str] = None,
):
    query = db.query(Expense)
    if from_date:
        query = query.filter(Expense.entry_date >= from_date)
    if to_date:
        query = query.filter(Expense.entry_date <= to_date)
    if category:
        cats = category.split("|")
        query = query.filter(Expense.category.in_(cats))
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            Expense.description.ilike(pattern) | Expense.notes.ilike(pattern)
        )
    return query.order_by(asc(Expense.entry_date), asc(Expense.id)).all()


@router.post("", response_model=ExpenseOut, status_code=201)
def create_expense(
    data: ExpenseIn,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = Expense(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    data: ExpenseIn,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = db.query(Expense).filter(Expense.id == expense_id).first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    for key, val in data.model_dump().items():
        setattr(row, key, val)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = db.query(Expense).filter(Expense.id == expense_id).first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()
