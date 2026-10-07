"""Fixtures: BD SQLite en memoria, aislada por prueba."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.iam_usuarios.application.dtos import RegistroDTO
from app.iam_usuarios.application.usuario_app_service import UsuarioAppService
from app.iam_usuarios.domain.value_objects import Rol
from app.iam_usuarios.infrastructure import modelos  # noqa: F401  (registra tablas)
from app.iam_usuarios.infrastructure.sql_usuario_repository import SqlUsuarioRepository
from app.main import app
from app.shared.database import Base, get_db


@pytest.fixture()
def session_factory():
    # StaticPool: todas las conexiones comparten la misma BD en memoria
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autoflush=False, autocommit=False)
    engine.dispose()


@pytest.fixture()
def db(session_factory):
    with session_factory() as s:
        yield s


@pytest.fixture()
def client(session_factory):
    def _get_db():
        with session_factory() as s:
            yield s

    app.dependency_overrides[get_db] = _get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def servicio(db):
    return UsuarioAppService(SqlUsuarioRepository(db))


def datos_registro(correo="ana@unsa.edu.pe", **extra) -> dict:
    """Diccionario crudo (permite probar valores inválidos que el DTO rechazaría)."""
    datos = dict(correo_institucional=correo, password="Clave12345", nombres="Ana", apellidos="Pérez")
    datos.update(extra)
    return datos


def registro(correo="ana@unsa.edu.pe", **extra) -> RegistroDTO:
    return RegistroDTO(**datos_registro(correo, **extra))


@pytest.fixture()
def token_de(client):
    """Registra (si hace falta) y devuelve un token Bearer para el correo dado."""
    def _token(correo="ana@unsa.edu.pe"):
        client.post("/auth/register", json=registro(correo).model_dump())
        r = client.post("/auth/login", json={"correo_institucional": correo, "password": "Clave12345"})
        return {"Authorization": f"Bearer {r.json()['access_token']}"}
    return _token


@pytest.fixture()
def admin_headers(client, servicio):
    """Crea un administrador (vía servicio, como el script semilla) y devuelve su cabecera."""
    servicio.registrar(registro("admin@unsa.edu.pe"), rol=Rol.ADMINISTRADOR_SISTEMA)
    r = client.post("/auth/login", json={"correo_institucional": "admin@unsa.edu.pe", "password": "Clave12345"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
