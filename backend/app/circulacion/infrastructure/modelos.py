"""Modelo ORM de reservas. Detalle de infraestructura, no dominio."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database import Base


class ReservaModel(Base):
    __tablename__ = "reservas"

    reserva_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    solicitante_id: Mapped[str] = mapped_column(ForeignKey("usuarios.usuario_id"), index=True)
    item_id: Mapped[str] = mapped_column(ForeignKey("items.item_id"))
    inicio: Mapped[datetime] = mapped_column(DateTime)  # UTC sin zona
    fin: Mapped[datetime] = mapped_column(DateTime)
    estado: Mapped[str] = mapped_column(String(20))
    creada_en: Mapped[datetime] = mapped_column(DateTime)
    prestamo_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)

    __mapper_args__ = {"version_id_col": version}
    # Acelera buscar_solapadas (se consulta en cada reserva)
    __table_args__ = (Index("ix_reservas_item_franja", "item_id", "inicio", "fin"),)
