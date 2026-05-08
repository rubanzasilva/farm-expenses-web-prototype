from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import asc

from backend.database import get_db
from backend.models import CashAccount
from backend.schemas import CashAccountIn, CashAccountOut
from backend.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/cash", tags=["cash"])


@router.get("", response_model=list[CashAccountOut])
def list_cash_accounts(
    _user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    return db.query(CashAccount).order_by(asc(CashAccount.id)).all()


@router.post("", response_model=CashAccountOut, status_code=201)
def create_cash_account(
    data: CashAccountIn,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = CashAccount(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{account_id}", response_model=CashAccountOut)
def update_cash_account(
    account_id: int,
    data: CashAccountIn,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = db.query(CashAccount).filter(CashAccount.id == account_id).first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    for key, val in data.model_dump().items():
        setattr(row, key, val)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{account_id}", status_code=204)
def delete_cash_account(
    account_id: int,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    row = db.query(CashAccount).filter(CashAccount.id == account_id).first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()
