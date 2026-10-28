import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DB_NAME = "prestamos.db"

def poblar_datos():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Limpiar tablas
    cursor.execute("DELETE FROM usuarios")
    cursor.execute("DELETE FROM items_inventario")

    # Generar hash real y válido para la contraseña "password123"
    hash_password = pwd_context.hash("password123")

    # Insertar Usuarios (con la columna estado_cuenta)
    usuarios = [
        ("admin@unsa.edu.pe", hash_password, "Admin Principal", "ADMINISTRADOR_SISTEMA", "ACTIVA"),
        ("marmendarizp@unsa.edu.pe", hash_password, "Marco Armendáriz", "ESTUDIANTE", "ACTIVA"),
        ("docente@unsa.edu.pe", hash_password, "Profesor Docente", "DOCENTE", "ACTIVA"),
    ]

    cursor.executemany("""
        INSERT INTO usuarios (email, password_hash, nombre, rol, estado_cuenta)
        VALUES (?, ?, ?, ?, ?)
    """, usuarios)

    # Insertar Ítems
    items = [
        ("PAT-001", "Proyector Epson EB-X05", "Proyector HDMI 3300 lúmenes", "EQUIPO", "BUENO", "DISPONIBLE"),
        ("PAT-002", "Laptop Dell Latitude 3420", "Intel i5 16GB RAM", "EQUIPO", "BUENO", "DISPONIBLE"),
        ("LIB-001", "Clean Code - Robert C. Martin", "Buenas prácticas de programación", "LIBRO", "BUENO", "DISPONIBLE"),
    ]

    cursor.executemany("""
        INSERT INTO items_inventario (codigo_patrimonial, nombre, descripcion, tipo_item, estado_fisico, disponibilidad)
        VALUES (?, ?, ?, ?, ?, ?)
    """, items)

    conn.commit()
    conn.close()
    print("¡Base de datos poblada exitosamente! Todas las contraseñas son: 'password123'")

if __name__ == "__main__":
    poblar_datos()
