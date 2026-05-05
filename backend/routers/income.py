from typing import Annotated, Optional
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc

from backend.database import get_db
from backend.models import Income
from backend.schemas import IncomeIn, IncomeOut
from backend.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/income", tags=["income"])


@router.get("", response_model=list[IncomeOut])
def list_income(
    _user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    source: Optional[str] = None,
    q: Optional[str] = None,
):
    query = db.query(Income)
    if from_date:
        query = query.filter(Income.entry_date >= from_date)
    if to_date:
        query = query.filter(Income.entry_date <= to_date)
    if source:
        sources = source.split("|")
        query = query.filter(Income.source.in_(sources))
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            Income.description.ilike(pattern) | Income.notes.ilike(pattern)
        )
    return query.order_by(asc(Income.entry_date), asc(Income.id)).all()


@router.post("", response_model=IncomeOut, status_code=201)
def create_income(
    data: IncomeIn,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = Income(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{income_id}", response_model=IncomeOut)
def update_income(
    income_id: int,
    data: IncomeIn,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = db.query(Income).filter(Income.id == income_id).first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    for key, val in data.model_dump().items():
        setattr(row, key, val)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{income_id}", status_code=204)
def delete_income(
    income_id: int,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = db.query(Income).filter(Income.id == income_id).first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()
