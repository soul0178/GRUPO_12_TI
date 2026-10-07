"""Routers (controladores) de IAM. Contrato inicial: informe 7.5."""
from fastapi import APIRouter, Depends

from app.iam_usuarios.application.dtos import (
    CambiarRolDTO, LoginDTO, PerfilDTO, RegistroDTO, TokenDTO, UsuarioDTO,
)
from app.iam_usuarios.application.usuario_app_service import UsuarioAppService
from app.iam_usuarios.domain.value_objects import Rol
from app.iam_usuarios.presentation.dependencias import (
    get_usuario_actual, get_usuario_service, requerir_roles,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])
usuarios_router = APIRouter(prefix="/usuarios", tags=["usuarios"])
admin_router = APIRouter(prefix="/admin", tags=["admin"])


@auth_router.post("/register", response_model=UsuarioDTO, status_code=201)
def registrar(dto: RegistroDTO, servicio: UsuarioAppService = Depends(get_usuario_service)):
    return servicio.registrar(dto)  # público: siempre rol ESTUDIANTE


@auth_router.post("/login", response_model=TokenDTO)
def login(dto: LoginDTO, servicio: UsuarioAppService = Depends(get_usuario_service)):
    return servicio.login(dto)


@usuarios_router.get("/me", response_model=UsuarioDTO)
def mi_usuario(actual: UsuarioDTO = Depends(get_usuario_actual)):
    return actual


@usuarios_router.put("/me/perfil", response_model=UsuarioDTO)
def actualizar_mi_perfil(
    dto: PerfilDTO,
    actual: UsuarioDTO = Depends(get_usuario_actual),
    servicio: UsuarioAppService = Depends(get_usuario_service),
):
    return servicio.actualizar_perfil(actual.usuario_id, dto)


@admin_router.get("/usuarios", response_model=list[UsuarioDTO])
def listar_usuarios(
    _: UsuarioDTO = Depends(requerir_roles(Rol.ADMINISTRADOR_SISTEMA)),
    servicio: UsuarioAppService = Depends(get_usuario_service),
):
    return servicio.listar()


@admin_router.put("/usuarios/{usuario_id}/rol", response_model=UsuarioDTO)
def cambiar_rol(
    usuario_id: str,
    dto: CambiarRolDTO,
    admin: UsuarioDTO = Depends(requerir_roles(Rol.ADMINISTRADOR_SISTEMA)),
    servicio: UsuarioAppService = Depends(get_usuario_service),
):
    return servicio.cambiar_rol(admin.usuario_id, usuario_id, dto.rol)
