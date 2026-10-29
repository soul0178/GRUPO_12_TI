"""
security.py - Seguridad del Sistema de Préstamos EPCC (UNSA)

Contiene:
  1. Hash y verificación de contraseñas (bcrypt).
  2. Generación de JWT (clave SECRET_KEY leída del archivo .env).
  3. Dependencias get_usuario_sesion (token + SQL puro) y get_usuario_actual
     (lo anterior + exige cuenta ACTIVA).
  4. Dependencia requerir_roles(*roles): restringe endpoints por rol.

Requisitos:  pip install fastapi uvicorn bcrypt pyjwt python-dotenv
Archivo .env (en backend/):  SECRET_KEY=una_clave_larga_y_aleatoria
"""

import os
import sqlite3
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Función de database.py que devuelve una conexión sqlite3 a 'prestamos.db'.
# (Si en tu database.py se llama distinto, cambia solo esta línea.)
from database import get_connection

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
load_dotenv()  # Carga las variables del archivo .env

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("Falta SECRET_KEY en el archivo .env")

ALGORITMO = "HS256"
MINUTOS_EXPIRACION = 60

# Extrae el token de la cabecera HTTP:  Authorization: Bearer <token>
esquema_bearer = HTTPBearer()


# ---------------------------------------------------------------------------
# 1. Contraseñas
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Devuelve el hash bcrypt de la contraseña (se guarda en usuarios.password_hash)."""
    # bcrypt solo admite hasta 72 bytes
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Compara la contraseña ingresada con el hash guardado en la base de datos."""
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], password_hash.encode("utf-8"))
    except ValueError:  # hash mal formado en la BD
        return False


# ---------------------------------------------------------------------------
# 2. JWT
# ---------------------------------------------------------------------------
def create_access_token(datos: dict) -> str:
    """Crea un JWT firmado. `datos` debe incluir 'sub' (id del usuario como texto)."""
    payload = datos.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_EXPIRACION)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITMO)


# ---------------------------------------------------------------------------
# 3. Usuario autenticado
# ---------------------------------------------------------------------------
def get_usuario_sesion(
    credenciales: HTTPAuthorizationCredentials = Depends(esquema_bearer),
) -> dict:
    """
    1) Extrae y valida el JWT de la cabecera Authorization.
    2) Consulta al usuario en la BD (SQL puro).
    NO verifica estado_cuenta: eso lo hace get_usuario_actual, o el propio endpoint
    cuando necesita responder con un código distinto (ej. 400 en solicitar préstamo).
    Devuelve un diccionario con los datos del usuario (sin password_hash).
    """
    error_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # --- Decodificar el token ---
    try:
        payload = jwt.decode(credenciales.credentials, SECRET_KEY, algorithms=[ALGORITMO])
        usuario_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise error_credenciales

    # --- Consultar al usuario ---
    db = get_connection()
    db.row_factory = sqlite3.Row  # permite acceder por nombre de columna
    try:
        # SQL: SELECT id, email, nombre, rol, estado_cuenta FROM usuarios WHERE id = ?
        fila = db.execute(
            "SELECT id, email, nombre, rol, estado_cuenta FROM usuarios WHERE id = ?",
            (usuario_id,),
        ).fetchone()
    finally:
        db.close()

    if fila is None:
        raise error_credenciales

    return dict(fila)


def get_usuario_actual(usuario: dict = Depends(get_usuario_sesion)) -> dict:
    """Igual que get_usuario_sesion, pero exige estado_cuenta = 'ACTIVA' (si no, 403)."""
    if usuario["estado_cuenta"] != "ACTIVA":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta {usuario['estado_cuenta']}: no puede operar en el sistema",
        )
    return usuario


# ---------------------------------------------------------------------------
# 4. Control de roles
# ---------------------------------------------------------------------------
def requerir_roles(*roles_permitidos: str, exigir_activa: bool = True):
    """
    Fábrica de dependencias. Ejemplo de uso:
        usuario = Depends(requerir_roles("ADMINISTRADOR_SISTEMA"))
    Responde 403 si el rol del usuario no está en la lista.

    exigir_activa=True  (por defecto): además exige cuenta ACTIVA (403 si no).
    exigir_activa=False: solo valida el rol; el endpoint decide qué hacer con
                         el estado de la cuenta.
    """
    base = get_usuario_actual if exigir_activa else get_usuario_sesion

    def verificar_rol(usuario: dict = Depends(base)) -> dict:
        if usuario["rol"] not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene privilegios para esta operación",
            )
        return usuario

    return verificar_rol
