"""DTOs del catálogo: contratos de entrada/salida de los casos de uso."""
from pydantic import BaseModel, Field

from app.catalogo_inventario.domain.value_objects import (
    EstadoDisponibilidad,
    EstadoFisico,
    TipoItem,
)


class ItemDTO(BaseModel):
    """Entrada de alta (informe 2.2: ItemDTO)."""

    codigo: str = Field(min_length=1, max_length=30)
    nombre: str = Field(min_length=1, max_length=120)
    tipo: TipoItem
    estado_fisico: EstadoFisico = EstadoFisico.BUENO
    descripcion: str = Field(default="", max_length=300)


class ModificarItemDTO(BaseModel):
    """El código y el estado físico no se editan aquí (el estado tiene su propio caso de uso)."""

    nombre: str = Field(min_length=1, max_length=120)
    tipo: TipoItem
    descripcion: str = Field(default="", max_length=300)


class EstadoFisicoDTO(BaseModel):
    estado_fisico: EstadoFisico


class ItemRespuestaDTO(BaseModel):
    item_id: str
    codigo: str
    nombre: str
    tipo: TipoItem
    estado_fisico_actual: EstadoFisico
    disponibilidad: EstadoDisponibilidad
    descripcion: str
