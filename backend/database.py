import sqlite3

DB_NAME = "prestamos.db"

def obtener_conexion():
    conexion = sqlite3.connect(DB_NAME)
    conexion.row_factory = sqlite3.Row
    return conexion

# Alias de compatibilidad para main.py
get_connection = obtener_conexion

def crear_tablas():
    conn = obtener_conexion()
    cursor = conn.cursor()

    # Tabla Usuarios (Informe v2)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT CHECK (rol IN ('ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'ADMINISTRADOR_SISTEMA')) NOT NULL,
        estado_cuenta TEXT CHECK (estado_cuenta IN ('ACTIVA', 'SUSPENDIDA', 'INACTIVA')) DEFAULT 'ACTIVA'
    );
    """)

    # Tabla Items Inventario
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS items_inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_patrimonial TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        tipo_item TEXT CHECK (tipo_item IN ('LIBRO', 'EQUIPO', 'OBJETO')) NOT NULL,
        estado_fisico TEXT CHECK (estado_fisico IN ('BUENO', 'REGULAR', 'DANADO')) DEFAULT 'BUENO',
        disponibilidad TEXT CHECK (disponibilidad IN ('DISPONIBLE', 'PRESTADO', 'EN_MANTENIMIENTO', 'DADO_DE_BAJA')) DEFAULT 'DISPONIBLE'
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    crear_tablas()
