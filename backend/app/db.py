from __future__ import annotations
import os
from typing import Generator, Optional, Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "test")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_SSL_CA = os.getenv("DB_SSL_CA")  # caminho opcional para CA

# Monta URL do MySQL usando PyMySQL
MYSQL_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

connect_args: Dict[str, Any] = {}
if DB_SSL_CA:
    # Azure MySQL geralmente exige SSL. Quando fornecido, usamos CA.
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
