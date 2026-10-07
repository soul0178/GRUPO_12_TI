"""Configuración central. Los valores salen de variables de entorno o del archivo .env."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sistema de Préstamos EPCC"
    # SQLite en las primeras fases; PostgreSQL desde Reservas (solo cambia esta URL)
    database_url: str = "sqlite:///./prestamos.db"
    # Se usará en la fase IAM para firmar los JWT (cambiar en producción)
    secret_key: str = "cambiar-en-produccion-usar-clave-de-32-bytes-o-mas"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    # Orígenes permitidos para el frontend (Vite usa 5173 por defecto)
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    # lru_cache: se lee una sola vez por proceso
    return Settings()
