"""Routers de reservas. Contrato: informe 7.5 (POST /reservas · DELETE /reservas/{id})."""
from datetime import datetime

from fastapi import APIRouter, Depends

from app.circulacion.application.dtos import FranjaOcupadaDTO, ReservaDTO, ReservaRespuestaDTO
from app.circulacion.application.reserva_app_service import ReservaAppService
from app.circulacion.presentation.dependencias import get_reserva_service
from app.iam_usuarios.application.dtos import UsuarioDTO
from app.iam_usuarios.domain.value_objects import Rol
from app.iam_usuarios.presentation.dependencias import get_usuario_actual, requerir_roles

reservas_router = APIRouter(prefix="/reservas", tags=["reservas"])
disponibilidad_router = APIRouter(prefix="/items", tags=["reservas"])
admin_reservas_router = APIRouter(prefix="/admin/reservas", tags=["admin-reservas"])


@reservas_router.post("", response_model=ReservaRespuestaDTO, status_code=201)
def reservar(
    dto: ReservaDTO,
    actual: UsuarioDTO = Depends(get_usuario_actual),
    servicio: ReservaAppService = Depends(get_reserva_service),
):
    return servicio.procesar_reserva(actual.usuario_id, dto)


@reservas_router.get("/mias", response_model=list[ReservaRespuestaDTO])
def mis_reservas(
    actual: UsuarioDTO = Depends(get_usuario_actual),
    servicio: ReservaAppService = Depends(get_reserva_service),
):
    return servicio.mis_reservas(actual.usuario_id)


@reservas_router.delete("/{reserva_id}", response_model=ReservaRespuestaDTO)
def cancelar_reserva(
    reserva_id: str,
    actual: UsuarioDTO = Depends(get_usuario_actual),
    servicio: ReservaAppService = Depends(get_reserva_service),
):
    """Cancela (no borra la fila: queda en estado CANCELADA para el historial)."""
    return servicio.cancelar(
        reserva_id, actual.usuario_id, es_admin=actual.rol == Rol.ADMINISTRADOR_SISTEMA
    )


@disponibilidad_router.get("/{item_id}/disponibilidad", response_model=list[FranjaOcupadaDTO])
def disponibilidad_item(
    item_id: str,
    desde: datetime | None = None,
    hasta: datetime | None = None,
    _: UsuarioDTO = Depends(get_usuario_actual),
    servicio: ReservaAppService = Depends(get_reserva_service),
):
    return servicio.disponibilidad(item_id, desde, hasta)


@admin_reservas_router.get("", response_model=list[ReservaRespuestaDTO])
def todas_las_reservas(
    _: UsuarioDTO = Depends(requerir_roles(Rol.ADMINISTRADOR_SISTEMA)),
    servicio: ReservaAppService = Depends(get_reserva_service),
):
    return servicio.todas()
