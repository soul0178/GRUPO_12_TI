"""Routers del catálogo. Contrato: informe 7.5 (GET /items · /admin/items)."""
from fastapi import APIRouter, Depends, Query

from app.catalogo_inventario.application.dtos import (
    EstadoFisicoDTO, ItemDTO, ItemRespuestaDTO, ModificarItemDTO,
)
from app.catalogo_inventario.application.inventario_app_service import InventarioAppService
from app.catalogo_inventario.domain.value_objects import TipoItem
from app.catalogo_inventario.presentation.dependencias import get_inventario_service
from app.iam_usuarios.application.dtos import UsuarioDTO
from app.iam_usuarios.domain.value_objects import Rol
from app.iam_usuarios.presentation.dependencias import get_usuario_actual, requerir_roles

items_router = APIRouter(prefix="/items", tags=["catalogo"])
admin_items_router = APIRouter(prefix="/admin/items", tags=["admin-catalogo"])

_ADMIN = Rol.ADMINISTRADOR_SISTEMA  # RNF-01: solo el administrador gestiona el inventario


# ---- consulta: cualquier usuario autenticado ----------------------
@items_router.get("", response_model=list[ItemRespuestaDTO])
def listar_items(
    tipo: TipoItem | None = Query(default=None),
    _: UsuarioDTO = Depends(get_usuario_actual),
    servicio: InventarioAppService = Depends(get_inventario_service),
):
    return servicio.listar(tipo)


@items_router.get("/{item_id}", response_model=ItemRespuestaDTO)
def obtener_item(
    item_id: str,
    _: UsuarioDTO = Depends(get_usuario_actual),
    servicio: InventarioAppService = Depends(get_inventario_service),
):
    return servicio.obtener(item_id)


# ---- gestión: solo administrador ----------------------------------
@admin_items_router.get("", response_model=list[ItemRespuestaDTO])
def listar_todos(
    tipo: TipoItem | None = Query(default=None),
    _: UsuarioDTO = Depends(requerir_roles(_ADMIN)),
    servicio: InventarioAppService = Depends(get_inventario_service),
):
    return servicio.listar(tipo, incluir_bajas=True)


@admin_items_router.post("", response_model=ItemRespuestaDTO, status_code=201)
def alta_item(
    dto: ItemDTO,
    admin: UsuarioDTO = Depends(requerir_roles(_ADMIN)),
    servicio: InventarioAppService = Depends(get_inventario_service),
):
    return servicio.alta(admin.usuario_id, dto)


@admin_items_router.put("/{item_id}", response_model=ItemRespuestaDTO)
def modificar_item(
    item_id: str,
    dto: ModificarItemDTO,
    admin: UsuarioDTO = Depends(requerir_roles(_ADMIN)),
    servicio: InventarioAppService = Depends(get_inventario_service),
):
    return servicio.modificar(admin.usuario_id, item_id, dto)


@admin_items_router.put("/{item_id}/estado-fisico", response_model=ItemRespuestaDTO)
def cambiar_estado_fisico(
    item_id: str,
    dto: EstadoFisicoDTO,
    _: UsuarioDTO = Depends(requerir_roles(_ADMIN)),
    servicio: InventarioAppService = Depends(get_inventario_service),
):
    return servicio.actualizar_estado_fisico(item_id, dto.estado_fisico)


@admin_items_router.delete("/{item_id}", response_model=ItemRespuestaDTO)
def baja_item(
    item_id: str,
    admin: UsuarioDTO = Depends(requerir_roles(_ADMIN)),
    servicio: InventarioAppService = Depends(get_inventario_service),
):
    """Baja lógica: el ítem se conserva para el historial (RF-06)."""
    return servicio.baja(admin.usuario_id, item_id)
