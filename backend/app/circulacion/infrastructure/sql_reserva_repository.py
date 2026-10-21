"""Adaptador SQLAlchemy del puerto IReservaRepository."""
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

from app.circulacion.domain.errores import ConflictoConcurrenciaReserva, FranjaOcupada
from app.circulacion.domain.repositorio import IReservaRepository
from app.circulacion.domain.reserva import Reserva
from app.circulacion.domain.value_objects import (
    ESTADOS_QUE_BLOQUEAN, EstadoReserva, FranjaHoraria,
)
from app.circulacion.infrastructure.modelos import ReservaModel

_BLOQUEAN = [e.value for e in ESTADOS_QUE_BLOQUEAN]


def _a_dominio(m: ReservaModel) -> Reserva:
    return Reserva(
        m.reserva_id, m.solicitante_id, m.item_id, FranjaHoraria(m.inicio, m.fin),
        EstadoReserva(m.estado), m.creada_en, m.prestamo_id, version=m.version,
    )


class SqlReservaRepository(IReservaRepository):
    def __init__(self, db: Session) -> None:
        self._db = db

    def guardar(self, reserva: Reserva) -> None:
        m = self._db.get(ReservaModel, reserva.reserva_id)
        if m is None:
            m = ReservaModel(reserva_id=reserva.reserva_id)
            self._db.add(m)
        elif m.version != reserva.version:
            raise ConflictoConcurrenciaReserva("La reserva fue modificada por otra operación")

        # Segunda defensa (RNF-02): se revalida justo antes de escribir, en la misma sesión.
        # En PostgreSQL la restricción EXCLUDE de la BD cierra por completo la carrera.
        if reserva.bloquea_horario() and self.buscar_solapadas(
            reserva.item_id, reserva.franja, excluir_id=reserva.reserva_id
        ):
            self._db.rollback()
            raise FranjaOcupada("El ítem ya está reservado en ese horario")

        m.solicitante_id = reserva.solicitante_id
        m.item_id = reserva.item_id
        m.inicio, m.fin = reserva.franja.inicio, reserva.franja.fin
        m.estado = reserva.estado.value
        m.creada_en = reserva.creada_en
        m.prestamo_id = reserva.prestamo_id

        try:
            self._db.commit()
        except IntegrityError as exc:  # restricción EXCLUDE (PostgreSQL) o FK
            self._db.rollback()
            raise FranjaOcupada("El ítem ya está reservado en ese horario") from exc
        except StaleDataError as exc:
            self._db.rollback()
            raise ConflictoConcurrenciaReserva("La reserva fue modificada por otra operación") from exc
        reserva.version = m.version

    def buscar_por_id(self, reserva_id: str) -> Reserva | None:
        m = self._db.get(ReservaModel, reserva_id)
        return _a_dominio(m) if m else None

    def buscar_solapadas(
        self, item_id: str, franja: FranjaHoraria, excluir_id: str | None = None
    ) -> list[Reserva]:
        # Solapamiento de intervalos semiabiertos: a.inicio < b.fin AND b.inicio < a.fin
        consulta = select(ReservaModel).where(
            ReservaModel.item_id == item_id,
            ReservaModel.estado.in_(_BLOQUEAN),
            ReservaModel.inicio < franja.fin,
            ReservaModel.fin > franja.inicio,
        )
        if excluir_id:
            consulta = consulta.where(ReservaModel.reserva_id != excluir_id)
        return [_a_dominio(m) for m in self._db.scalars(consulta)]

    def listar_por_usuario(self, usuario_id: str) -> list[Reserva]:
        consulta = (
            select(ReservaModel)
            .where(ReservaModel.solicitante_id == usuario_id)
            .order_by(ReservaModel.inicio.desc())
        )
        return [_a_dominio(m) for m in self._db.scalars(consulta)]

    def listar_por_item(self, item_id: str, desde: datetime, hasta: datetime) -> list[Reserva]:
        consulta = (
            select(ReservaModel)
            .where(
                ReservaModel.item_id == item_id,
                ReservaModel.estado.in_(_BLOQUEAN),
                ReservaModel.inicio < hasta,
                ReservaModel.fin > desde,
            )
            .order_by(ReservaModel.inicio)
        )
        return [_a_dominio(m) for m in self._db.scalars(consulta)]

    def listar_todas(self) -> list[Reserva]:
        consulta = select(ReservaModel).order_by(ReservaModel.inicio.desc())
        return [_a_dominio(m) for m in self._db.scalars(consulta)]

    def listar_vencidas(self, ahora: datetime) -> list[Reserva]:
        consulta = select(ReservaModel).where(
            ReservaModel.estado.in_(_BLOQUEAN), ReservaModel.fin <= ahora
        )
        return [_a_dominio(m) for m in self._db.scalars(consulta)]
