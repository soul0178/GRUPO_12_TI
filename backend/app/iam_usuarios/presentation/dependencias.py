"""Dependencias de FastAPI: servicio, usuario autenticado y permisos por rol (RBAC)."""
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.iam_usuarios.application.dtos import UsuarioDTO
from app.iam_usuarios.application.usuario_app_service import UsuarioAppService
from app.iam_usuarios.domain.value_objects import EstadoCuenta, Rol
from app.iam_usuarios.infrastructure.sql_usuario_repository import SqlUsuarioRepository
from app.shared import seguridad
from app.shared.database import get_db
from app.shared.errores import ErrorNoAutenticado, ErrorPermisoDenegado

_esquema = HTTPBearer(auto_error=False)  # auto_error=False: devolvemos nuestro propio 401


def get_usuario_service(db: Session = Depends(get_db)) -> UsuarioAppService:
    return UsuarioAppService(SqlUsuarioRepository(db))


def get_usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_esquema),
    servicio: UsuarioAppService = Depends(get_usuario_service),
) -> UsuarioDTO:
    if credenciales is None:
        raise ErrorNoAutenticado("Falta el token de autenticación")
    datos = seguridad.decodificar_token(credenciales.credentials)
    # Se relee el usuario en cada petición: un cambio de rol o una baja
    # surte efecto de inmediato, sin esperar a que expire el token.
    usuario = servicio.obtener(datos["sub"])
    if usuario.estado_cuenta == EstadoCuenta.INACTIVA:
        raise ErrorNoAutenticado("La cuenta está inactiva")
    return usuario


def requerir_roles(*roles: Rol):
    """Uso: Depends(requerir_roles(Rol.ADMINISTRADOR_SISTEMA)). Responde 403 si no coincide."""
    def _verificar(usuario: UsuarioDTO = Depends(get_usuario_actual)) -> UsuarioDTO:
        if usuario.rol not in roles:
            raise ErrorPermisoDenegado("No tienes permiso para esta operación")
        return usuario
    return _verificar
