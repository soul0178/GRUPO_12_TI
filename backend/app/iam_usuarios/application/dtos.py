"""DTOs: contratos de entrada/salida de los casos de uso (viven en Aplicación)."""
from pydantic import BaseModel, Field

from app.iam_usuarios.domain.value_objects import EstadoCuenta, Rol


class RegistroDTO(BaseModel):
    correo_institucional: str
    password: str = Field(min_length=8, max_length=72)  # 72 = límite de bcrypt
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    codigo_institucional: str | None = Field(default=None, max_length=30)


class LoginDTO(BaseModel):
    correo_institucional: str
    password: str


class TokenDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PerfilDTO(BaseModel):
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    codigo_institucional: str | None = Field(default=None, max_length=30)
    telefono: str = Field(default="", max_length=30)
    direccion: str = Field(default="", max_length=200)
    correo_alterno: str = Field(default="", max_length=120)


class UsuarioDTO(BaseModel):
    usuario_id: str
    correo_institucional: str
    rol: Rol
    estado_cuenta: EstadoCuenta
    perfil: PerfilDTO


class CambiarRolDTO(BaseModel):
    rol: Rol
