"""Crea las tablas. Importar aquí los modelos de cada contexto a medida que existan.

Más adelante se reemplazará por migraciones con Alembic (necesario al pasar a PostgreSQL).
"""
from app.iam_usuarios.infrastructure import modelos as _iam  # noqa: F401  (registra tablas)
from app.shared.database import Base, engine


def crear_tablas() -> None:
    Base.metadata.create_all(bind=engine)
