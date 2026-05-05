from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.database import engine, Base
from backend.models import Expense, Income  # noqa: F401 - registers models
from backend.schemas import LoginRequest, TokenResponse
from backend.auth import authenticate, create_token
from backend.classifier import classify_expense, classify_income
from backend.categories import EXPENSE_CATEGORIES, INCOME_SOURCES
from backend.routers import expenses, income, summary

app = FastAPI(title="Kisongi Farm Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expenses.router)
app.include_router(income.router)
app.include_router(summary.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Expense).count() == 0:
            from backend.seed import SEED_EXPENSES, SEED_INCOME
            for row in SEED_EXPENSES:
                db.add(Expense(**row))
            for row in SEED_INCOME:
                db.add(Income(**row))
            db.commit()
    finally:
        db.close()


@app.post("/api/auth/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = authenticate(body.username, body.password)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["username"], user["role"])
    return {"token": token, "role": user["role"], "username": user["username"]}


@app.get("/api/categories")
def get_categories():
    return {"categories": EXPENSE_CATEGORIES, "sources": INCOME_SOURCES}


@app.post("/api/classify")
def classify(body: dict):
    text = body.get("text", "")
    kind = body.get("kind", "expense")
    if kind == "income":
        return {"suggestion": classify_income(text)}
    return {"suggestion": classify_expense(text)}


app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
