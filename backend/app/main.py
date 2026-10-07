"""Punto de entrada de la API."""
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db_init import crear_tablas
from app.iam_usuarios.presentation.routers import admin_router, auth_router, usuarios_router
from app.shared.config import get_settings
from app.shared.database import get_db
from app.shared.manejo_errores import registrar_manejadores

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    crear_tablas()  # idempotente: solo crea lo que falta
    yield


app = FastAPI(title=settings.app_name, version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
registrar_manejadores(app)

app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(admin_router)


@app.get("/health", tags=["sistema"])
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    """Comprueba que la API corre y que se conecta a la BD."""
    db.execute(text("SELECT 1"))
    return {"estado": "ok", "base_de_datos": "conectada"}
