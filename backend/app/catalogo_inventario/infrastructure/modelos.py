"""Modelo ORM del catálogo. Es detalle de infraestructura, no dominio."""
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database import Base


class ItemModel(Base):
    __tablename__ = "items"

    item_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    codigo: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120))
    tipo: Mapped[str] = mapped_column(String(20), index=True)
    estado_fisico_actual: Mapped[str] = mapped_column(String(20))
    disponibilidad: Mapped[str] = mapped_column(String(20), index=True)
    descripcion: Mapped[str] = mapped_column(String(300), default="")
    version: Mapped[int] = mapped_column(Integer, nullable=False)

    # Bloqueo optimista (RNF-02), igual que en Usuario
    __mapper_args__ = {"version_id_col": version}
