"""
database.py - Conexión y creación de tablas (SQLite nativo, SQL puro)

Rama: feature/m-arm
NOVEDAD: tabla `solicitudes_prestamo` (módulo de Solicitudes de Préstamo).

"""

import os
import sqlite3

# La base de datos se crea junto a este archivo, sin importar desde dónde se ejecute
RUTA_BD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prestamos.db")


def get_connection() -> sqlite3.Connection:
    """Devuelve una conexión nueva a 'prestamos.db'."""
    conexion = sqlite3.connect(RUTA_BD)
    conexion.row_factory = sqlite3.Row          # acceso a columnas por nombre
    conexion.execute("PRAGMA foreign_keys = ON")  # SQLite no valida FOREIGN KEY si no se activa
    return conexion


def crear_tablas() -> None:
    """Crea todas las tablas si no existen (es seguro llamarla varias veces)."""
    db = get_connection()
    try:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS usuarios (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                nombre        TEXT NOT NULL,
                rol           TEXT NOT NULL CHECK (rol IN
                              ('ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'ADMINISTRADOR_SISTEMA')),
                estado_cuenta TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado_cuenta IN
                              ('ACTIVA', 'SUSPENDIDA', 'INACTIVA'))
            );

            CREATE TABLE IF NOT EXISTS items_inventario (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_patrimonial TEXT NOT NULL UNIQUE,
                nombre             TEXT NOT NULL,
                descripcion        TEXT DEFAULT '',
                tipo_item          TEXT NOT NULL CHECK (tipo_item IN ('LIBRO', 'EQUIPO', 'OBJETO')),
                estado_fisico      TEXT NOT NULL DEFAULT 'BUENO' CHECK (estado_fisico IN
                                   ('BUENO', 'REGULAR', 'DANADO')),
                disponibilidad     TEXT NOT NULL DEFAULT 'DISPONIBLE' CHECK (disponibilidad IN
                                   ('DISPONIBLE', 'PRESTADO', 'EN_MANTENIMIENTO', 'DADO_DE_BAJA'))
            );

            CREATE TABLE IF NOT EXISTS reservas (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id   INTEGER NOT NULL REFERENCES usuarios(id),
                item_id      INTEGER NOT NULL REFERENCES items_inventario(id),
                fecha_inicio TEXT NOT NULL,
                fecha_fin    TEXT NOT NULL,
                estado       TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN
                             ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA', 'CONVERTIDA'))
            );

            CREATE TABLE IF NOT EXISTS prestamos (
                id                      INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id              INTEGER NOT NULL REFERENCES usuarios(id),
                item_id                 INTEGER NOT NULL REFERENCES items_inventario(id),
                reserva_id              INTEGER REFERENCES reservas(id),
                fecha_inicio            TEXT NOT NULL,
                fecha_fin               TEXT NOT NULL,
                garantia                TEXT DEFAULT '',
                estado                  TEXT NOT NULL DEFAULT 'SOLICITADO' CHECK (estado IN
                                        ('SOLICITADO', 'AUTORIZADO', 'EN_CURSO', 'DEVUELTO', 'RECHAZADO')),
                autorizado_por_admin_id INTEGER REFERENCES usuarios(id)
            );

            CREATE TABLE IF NOT EXISTS sanciones (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id   INTEGER NOT NULL REFERENCES usuarios(id),
                prestamo_id  INTEGER NOT NULL REFERENCES prestamos(id),
                infraccion   TEXT NOT NULL CHECK (infraccion IN ('RETRASO', 'DANO', 'PERDIDA')),
                penalizacion TEXT,
                estado       TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN
                             ('ACTIVA', 'CUMPLIDA', 'CONDONADA'))
            );

            -- ================= NUEVO: módulo de Solicitudes de Préstamo =================
            CREATE TABLE IF NOT EXISTS solicitudes_prestamo (
                id                    INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id            INTEGER NOT NULL REFERENCES usuarios(id),
                item_id               INTEGER NOT NULL REFERENCES items_inventario(id),
                fecha_solicitud       DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_inicio          DATE NOT NULL,
                fecha_fin_prevista    DATE NOT NULL,
                fecha_devolucion_real DATE NULL,
                estado                TEXT CHECK (estado IN
                                      ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'DEVUELTO', 'CANCELADO'))
                                      DEFAULT 'PENDIENTE',
                observaciones         TEXT
            );
            """
        )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    crear_tablas()
    print(f"Tablas creadas en {RUTA_BD}")
