"""Crea las tablas. Importar aquí los modelos de cada contexto a medida que existan.

Más adelante se reemplazará por migraciones con Alembic (necesario al pasar a PostgreSQL).
"""
from sqlalchemy import text

from app.catalogo_inventario.infrastructure import modelos as _catalogo  # noqa: F401
from app.circulacion.infrastructure import modelos as _circulacion  # noqa: F401
from app.iam_usuarios.infrastructure import modelos as _iam  # noqa: F401  (registra tablas)
from app.shared.database import Base, engine


def crear_tablas() -> None:
    Base.metadata.create_all(bind=engine)
    if engine.dialect.name == "postgresql":
        aplicar_restricciones_postgres()


def aplicar_restricciones_postgres() -> None:
    """Segunda defensa de RNF-02: la propia BD rechaza reservas solapadas del mismo ítem.

    Solo existe en PostgreSQL (SQLite no soporta EXCLUDE); en SQLite la defensa es
    ValidadorDisponibilidadService + la revalidación del repositorio. Es idempotente.
    """
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'reservas_sin_solapamiento'
                ) THEN
                    ALTER TABLE reservas ADD CONSTRAINT reservas_sin_solapamiento
                    EXCLUDE USING gist (item_id WITH =, tsrange(inicio, fin, '[)') WITH &&)
                    WHERE (estado IN ('PENDIENTE', 'CONFIRMADA'));
                END IF;
            END $$;
        """))
