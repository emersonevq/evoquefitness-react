from __future__ import annotations
import os
from typing import Generator, Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from dotenv import load_dotenv

load_dotenv()

try:
    import env as _env  # type: ignore
except Exception:
    _env = None

DB_HOST = (_env.DB_HOST if _env and _env.DB_HOST else os.getenv("DB_HOST", "localhost"))
DB_USER = (_env.DB_USER if _env and _env.DB_USER else os.getenv("DB_USER", "root"))
DB_PASSWORD = (_env.DB_PASSWORD if _env and _env.DB_PASSWORD else os.getenv("DB_PASSWORD", ""))
DB_NAME = (_env.DB_NAME if _env and _env.DB_NAME else os.getenv("DB_NAME", "test"))
DB_PORT = int((_env.DB_PORT if _env and _env.DB_PORT else os.getenv("DB_PORT", "3306")))
DB_SSL_CA = (_env.DB_SSL_CA if _env and _env.DB_SSL_CA else os.getenv("DB_SSL_CA"))

MYSQL_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

connect_args: Dict[str, Any] = {}
if DB_SSL_CA:
    connect_args["ssl"] = {"ca": DB_SSL_CA}

engine = create_engine(
    MYSQL_URL,
    pool_pre_ping=True,
    connect_args=connect_args,  # type: ignore[arg-type]
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
