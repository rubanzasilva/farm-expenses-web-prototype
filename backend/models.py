from sqlalchemy import Column, Integer, String, Float, Date, DateTime, func

from backend.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(Date, nullable=True)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False, default="")
    amount = Column(Float, nullable=False, default=0)
    notes = Column(String, nullable=False, default="")
    created_at = Column(DateTime, server_default=func.now())


class Income(Base):
    __tablename__ = "income"

    id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(Date, nullable=True)
    source = Column(String, nullable=False)
    description = Column(String, nullable=False, default="")
    amount = Column(Float, nullable=False, default=0)
    notes = Column(String, nullable=False, default="")
    created_at = Column(DateTime, server_default=func.now())


class CashAccount(Base):
    __tablename__ = "cash_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_type = Column(String, nullable=False)  # Bank, Mobile Money, Cash
    account_name = Column(String, nullable=False)
    balance = Column(Float, nullable=False, default=0)
    notes = Column(String, nullable=False, default="")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now())
