"""Hash de contraseñas (bcrypt) y tokens JWT (RNF-01)."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.shared.config import get_settings
from app.shared.errores import ErrorNoAutenticado


def hashear_password(plano: str) -> str:
    # bcrypt incluye la sal dentro del hash resultante
    return bcrypt.hashpw(plano.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_password(plano: str, hash_guardado: str) -> bool:
    try:
        return bcrypt.checkpw(plano.encode("utf-8"), hash_guardado.encode("utf-8"))
    except ValueError:  # hash mal formado
        return False


# Hash de relleno: permite verificar aunque el correo no exista y así no
# revelar por tiempo de respuesta qué correos están registrados.
HASH_FALSO = hashear_password("relleno-no-usar")


def crear_token(usuario_id: str, rol: str) -> str:
    s = get_settings()
    expira = datetime.now(timezone.utc) + timedelta(minutes=s.access_token_expire_minutes)
    return jwt.encode(
        {"sub": usuario_id, "rol": rol, "exp": expira}, s.secret_key, algorithm=s.jwt_algorithm
    )


def decodificar_token(token: str) -> dict:
    s = get_settings()
    try:
        return jwt.decode(token, s.secret_key, algorithms=[s.jwt_algorithm])
    except jwt.PyJWTError as exc:  # expirado, firma inválida, mal formado...
        raise ErrorNoAutenticado("Token inválido o expirado") from exc
