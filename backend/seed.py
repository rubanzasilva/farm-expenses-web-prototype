"""Seed the database with the initial farm data."""

from datetime import date

from backend.database import engine, SessionLocal, Base
from backend.models import Expense, Income

SEED_EXPENSES = [
    {"entry_date": None, "category": "Transport", "description": "Transport", "amount": 32000, "notes": ""},
    {"entry_date": None, "category": "Transport", "description": "Transport", "amount": 40000, "notes": ""},
    {"entry_date": None, "category": "PPE/Equipment", "description": "Gumboots", "amount": 0, "notes": ""},
    {"entry_date": date(2026, 4, 20), "category": "Transport", "description": "Transport - 20th April", "amount": 10000, "notes": ""},
    {"entry_date": date(2026, 4, 20), "category": "Meals", "description": "Lunch", "amount": 10000, "notes": ""},
    {"entry_date": date(2026, 4, 20), "category": "Land Preparation", "description": "Initial land opening - tractor", "amount": 510000, "notes": ""},
    {"entry_date": date(2026, 4, 20), "category": "Land Preparation", "description": "Trees cutting", "amount": 40000, "notes": ""},
    {"entry_date": date(2026, 4, 20), "category": "Community/Admin", "description": "Chairman", "amount": 60000, "notes": ""},
    {"entry_date": date(2026, 4, 22), "category": "Transport", "description": "Transport - 22nd", "amount": 15000, "notes": ""},
    {"entry_date": date(2026, 4, 22), "category": "Meals", "description": "Lunch & breakfast", "amount": 30000, "notes": ""},
    {"entry_date": date(2026, 4, 23), "category": "Transport", "description": "Transport - 23rd", "amount": 15000, "notes": ""},
    {"entry_date": date(2026, 4, 23), "category": "Meals", "description": "Lunch & breakfast", "amount": 19000, "notes": ""},
    {"entry_date": None, "category": "Transport", "description": "Transport", "amount": 23000, "notes": ""},
    {"entry_date": date(2026, 4, 28), "category": "Transport", "description": "Transport to Naro, Kisongi, back home", "amount": 36000, "notes": ""},
    {"entry_date": date(2026, 4, 28), "category": "Meals", "description": "Lunch", "amount": 10000, "notes": ""},
    {"entry_date": date(2026, 4, 28), "category": "Supplies", "description": "3 padlocks, tape measure, string", "amount": 24200, "notes": ""},
    {"entry_date": date(2026, 4, 28), "category": "Goodwill", "description": "Goodwill payment - LC Chairman", "amount": 10000, "notes": ""},
    {"entry_date": date(2026, 4, 28), "category": "Seedlings", "description": "100 banana suckers @ 1,000/= each", "amount": 80000, "notes": "100 units"},
    {"entry_date": date(2026, 4, 30), "category": "Tools", "description": "2 garden hoes", "amount": 30000, "notes": ""},
    {"entry_date": date(2026, 4, 30), "category": "Tools", "description": "1 Panga", "amount": 7000, "notes": ""},
    {"entry_date": date(2026, 4, 30), "category": "Tools", "description": "Honing tools", "amount": 3000, "notes": ""},
    {"entry_date": date(2026, 4, 30), "category": "Transport", "description": "Transport to buy, hone tools", "amount": 5000, "notes": ""},
    {"entry_date": date(2026, 5, 1), "category": "Transport", "description": "Transport to Kisongi", "amount": 10000, "notes": ""},
    {"entry_date": date(2026, 5, 1), "category": "Transport", "description": "Agronomist transport to Kisongi", "amount": 10000, "notes": ""},
    {"entry_date": date(2026, 5, 1), "category": "Labor", "description": "Agronomist transport + consultancy fee", "amount": 100000, "notes": ""},
    {"entry_date": date(2026, 5, 1), "category": "Goodwill", "description": "Dan fuel", "amount": 5000, "notes": ""},
    {"entry_date": date(2026, 5, 1), "category": "Transport", "description": "Transport (evening)", "amount": 15000, "notes": ""},
    {"entry_date": date(2026, 5, 1), "category": "Supplies", "description": "Tape measure", "amount": 5000, "notes": ""},
    {"entry_date": date(2026, 5, 1), "category": "Meals", "description": "Lunch", "amount": 5000, "notes": ""},
    {"entry_date": date(2026, 5, 2), "category": "Land Preparation", "description": "Digging 18 holes", "amount": 16000, "notes": ""},
    {"entry_date": date(2026, 5, 3), "category": "Land Preparation", "description": "Digging 32 holes", "amount": 28000, "notes": "32 holes @ 800/= + mobile money charges"},
]

SEED_INCOME = [
    {"entry_date": date(2026, 4, 28), "source": "Tree Sales", "description": "Sale of trees cleared during land opening", "amount": 150000, "notes": ""},
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Expense).count() > 0:
            print("Database already has data. Use --force to reseed.")
            return

        for row in SEED_EXPENSES:
            db.add(Expense(**row))
        for row in SEED_INCOME:
            db.add(Income(**row))
        db.commit()
        print(f"Seeded {len(SEED_EXPENSES)} expenses and {len(SEED_INCOME)} income rows.")
    finally:
        db.close()


def seed_force():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(Expense).delete()
        db.query(Income).delete()
        db.commit()
        for row in SEED_EXPENSES:
            db.add(Expense(**row))
        for row in SEED_INCOME:
            db.add(Income(**row))
        db.commit()
        print(f"Reseeded {len(SEED_EXPENSES)} expenses and {len(SEED_INCOME)} income rows.")
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    if "--force" in sys.argv:
        seed_force()
    else:
        seed()
