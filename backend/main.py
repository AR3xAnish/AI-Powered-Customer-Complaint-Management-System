import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routers import complaints, extraction, chat, seed
from models import Complaint


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed if empty
    db = SessionLocal()
    try:
        if db.query(Complaint).count() == 0:
            seed.seed_demo_complaints(db)
    except Exception as e:
        print(f"[Lifespan notice] DB seed check: {e}")
    finally:
        db.close()
    yield


app = FastAPI(
    title="Pharma AI Complaint Management System",
    description="Customer Complaint Management System for Pharmaceutical Manufacturing with LangGraph & Groq",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(complaints.router)
app.include_router(extraction.router)
app.include_router(chat.router)
app.include_router(seed.router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Pharma AI Complaint Management System",
        "models": {
            "primary_extraction": "gemma2-9b-it",
            "reasoning_capa": "llama-3.3-70b-versatile",
        },
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
