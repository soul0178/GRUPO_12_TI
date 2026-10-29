import sys
import sqlite3
from datetime import date, timedelta
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DB_NAME = "prestamos.db"

def dia(dias_offset: int) -> str:
    """Calcula una fecha relativa a la fecha actual en formato YYYY-MM-DD."""
    return (date.today() + timedelta(days=dias_offset)).isoformat()

def poblar_base_datos(reset: bool = False):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    if reset:
        print("Limpiando tablas de la base de datos...")
        tablas = ["solicitudes_prestamo", "sanciones", "prestamos", "reservas", "items_inventario", "usuarios"]
        for tabla in tablas:
            cursor.execute(f"DELETE FROM {tabla};")
            cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{tabla}';")

    # Verificar si ya existen usuarios para evitar duplicados si no es reset
    cursor.execute("SELECT COUNT(*) FROM usuarios;")
    if cursor.fetchone()[0] > 0 and not reset:
        print("La base de datos ya contiene datos. Usa 'python seed.py --reset' para reiniciar.")
        conn.close()
        return

    # 1. Hashes de contraseñas
    hash_admin = pwd_context.hash("Admin123!")
    hash_clave = pwd_context.hash("Clave123!")

    # 2. Insertar Usuarios
    usuarios = [
        ("admin@epcc.unsa.pe",      hash_admin, "Administrador EPCC", "ADMINISTRADOR_SISTEMA", "ACTIVA"),
        ("estudiante1@unsa.edu.pe", hash_clave, "Ana Quispe",         "ESTUDIANTE",            "ACTIVA"),
        ("estudiante2@unsa.edu.pe", hash_clave, "Luis Mamani",        "ESTUDIANTE",            "ACTIVA"),
        ("docente1@unsa.edu.pe",    hash_clave, "Dra. Rosa Huamán",   "DOCENTE",               "ACTIVA"),
        ("suspendido@unsa.edu.pe",  hash_clave, "Pedro Condori",      "ESTUDIANTE",            "SUSPENDIDA"),
    ]
    cursor.executemany("""
        INSERT INTO usuarios (email, password_hash, nombre, rol, estado_cuenta)
        VALUES (?, ?, ?, ?, ?);
    """, usuarios)

    # 3. Insertar Items de Inventario
    items = [
        ("EQ-001", "Proyector Epson",        "Proyector HDMI 3500 lúmenes", "EQUIPO", "BUENO",   "PRESTADO"),
        ("EQ-002", "Laptop Dell Latitude",   "Laptop i5, 8 GB RAM",         "EQUIPO", "BUENO",   "DISPONIBLE"),
        ("EQ-003", "Cámara Canon",           "Cámara réflex con trípode",   "EQUIPO", "DANADO",  "EN_MANTENIMIENTO"),
        ("LB-001", "Estructuras de Datos",   "Libro de texto, 3.ª edición", "LIBRO",  "BUENO",   "DISPONIBLE"),
        ("LB-002", "Ingeniería de Software", "Sommerville, 10.ª edición",   "LIBRO",  "BUENO",   "DISPONIBLE"),
        ("LB-003", "Redes de Computadoras",  "Tanenbaum, 5.ª edición",      "LIBRO",  "REGULAR", "DISPONIBLE"),
        ("OB-001", "Calculadora científica", "Casio fx-570",                "OBJETO", "REGULAR", "DISPONIBLE"),
    ]
    cursor.executemany("""
        INSERT INTO items_inventario (codigo_patrimonial, nombre, descripcion, tipo_item, estado_fisico, disponibilidad)
        VALUES (?, ?, ?, ?, ?, ?);
    """, items)

    # 4. Insertar Solicitudes de Préstamo (Resolviendo IDs con subconsultas)
    solicitudes = [
        ("estudiante1@unsa.edu.pe", "EQ-001", dia(-2),  dia(5),   None,    "APROBADO",  "Para exposición de tesis"),
        ("estudiante1@unsa.edu.pe", "LB-001", dia(1),   dia(8),   None,    "PENDIENTE", None),
        ("docente1@unsa.edu.pe",    "EQ-002", dia(-10), dia(-3),  dia(-4), "DEVUELTO",  "Devuelta en buen estado"),
        ("docente1@unsa.edu.pe",    "LB-003", dia(2),   dia(9),   None,    "PENDIENTE", None),
        ("estudiante2@unsa.edu.pe", "LB-002", dia(-5),  dia(2),   None,    "RECHAZADO", "Libro reservado para el curso"),
        ("estudiante2@unsa.edu.pe", "OB-001", dia(3),   dia(6),   None,    "CANCELADO", "El estudiante canceló"),
    ]

    for email, codigo, f_inicio, f_fin, f_dev, estado, obs in solicitudes:
        cursor.execute("""
            INSERT INTO solicitudes_prestamo (usuario_id, item_id, fecha_inicio, fecha_fin_prevista, fecha_devolucion_real, estado, observaciones)
            VALUES (
                (SELECT id FROM usuarios WHERE email = ?),
                (SELECT id FROM items_inventario WHERE codigo_patrimonial = ?),
                ?, ?, ?, ?, ?
            );
        """, (email, codigo, f_inicio, f_fin, f_dev, estado, obs))

    conn.commit()
    conn.close()
    print("¡Base de datos poblada exitosamente!")

if __name__ == "__main__":
    should_reset = "--reset" in sys.argv
    poblar_base_datos(reset=should_reset)
