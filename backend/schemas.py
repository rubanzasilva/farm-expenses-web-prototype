from pydantic import BaseModel
from datetime import date
from typing import Optional


class ExpenseIn(BaseModel):
    entry_date: Optional[date] = None
    category: str
    description: str
    amount: float
    notes: str = ""


class ExpenseOut(BaseModel):
    id: int
    entry_date: Optional[date] = None
    category: str
    description: str
    amount: float
    notes: str

    model_config = {"from_attributes": True}


class IncomeIn(BaseModel):
    entry_date: Optional[date] = None
    source: str
    description: str
    amount: float
    notes: str = ""


class IncomeOut(BaseModel):
    id: int
    entry_date: Optional[date] = None
    source: str
    description: str
    amount: float
    notes: str

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    token: str
    role: str
    username: str


class CashAccountIn(BaseModel):
    account_type: str
    account_name: str
    balance: float
    notes: str = ""


class CashAccountOut(BaseModel):
    id: int
    account_type: str
    account_name: str
    balance: float
    notes: str

    model_config = {"from_attributes": True}
