"""
main.py - API del Sistema de Préstamos EPCC (UNSA)

Arquitectura plana: FastAPI + sqlite3 (SQL puro), sin ORM ni capas extra.
Ejecutar con:   uvicorn main:app --reload
Documentación:  http://localhost:8000/docs
"""

import sqlite3
from contextlib import contextmanager
from datetime import date, datetime
from typing import Literal, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import crear_tablas, get_connection
from security import (
    create_access_token,
    get_usuario_actual,
    requerir_roles,
    verify_password,
)

app = FastAPI(title="Sistema de Préstamos EPCC - UNSA")

crear_tablas()  # crea las tablas que falten (incluye solicitudes_prestamo)

# ---------------------------------------------------------------------------
# CORS: permite que el frontend React (Vite: 5173 / CRA: 3000) consuma la API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Atajo para endpoints exclusivos del administrador (RN-03)
SOLO_ADMIN = Depends(requerir_roles("ADMINISTRADOR_SISTEMA"))

# Estudiantes y docentes. exigir_activa=False: el endpoint valida el estado de la
# cuenta por su cuenta para poder responder 400 (en vez del 403 genérico).
SOLO_SOLICITANTE = Depends(requerir_roles("ESTUDIANTE", "DOCENTE", exigir_activa=False))

FORMATO_FECHA = "%Y-%m-%d %H:%M:%S"  # formato único con el que se guardan las fechas en SQLite


# ===========================================================================
# Utilidades
# ===========================================================================
@contextmanager
def conexion():
    """
    Abre una conexión por petición. Si todo sale bien hace COMMIT; si ocurre
    cualquier error (incluido un HTTPException) hace ROLLBACK. Siempre cierra.
    """
    db = get_connection()
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def normalizar_fecha(fecha: datetime) -> str:
    """Convierte un datetime a texto 'YYYY-MM-DD HH:MM:SS' (sin zona horaria)."""
    return fecha.replace(tzinfo=None).strftime(FORMATO_FECHA)


def obtener_item_o_404(db, item_id: int) -> sqlite3.Row:
    # SQL: SELECT * FROM items_inventario WHERE id = ?
    fila = db.execute("SELECT * FROM items_inventario WHERE id = ?", (item_id,)).fetchone()
    if fila is None:
        raise HTTPException(404, "Ítem no encontrado")
    return fila


def obtener_prestamo_o_404(db, prestamo_id: int) -> sqlite3.Row:
    # SQL: SELECT * FROM prestamos WHERE id = ?
    fila = db.execute("SELECT * FROM prestamos WHERE id = ?", (prestamo_id,)).fetchone()
    if fila is None:
        raise HTTPException(404, "Préstamo no encontrado")
    return fila


def hay_solapamiento(db, item_id: int, inicio: str, fin: str, excluir_reserva_id: Optional[int] = None) -> bool:
    """
    RN-01 (Sin Solapamiento).
    Dos franjas se solapan cuando: inicio_existente < fin_nuevo  Y  fin_existente > inicio_nuevo.
    Se revisan las reservas vigentes y los préstamos vigentes del mismo ítem.
    """
    # SQL 1: reservas PENDIENTE/CONFIRMADA del ítem que choquen con la franja pedida
    reserva = db.execute(
        """SELECT id FROM reservas
           WHERE item_id = ?
             AND estado IN ('PENDIENTE', 'CONFIRMADA')
             AND fecha_inicio < ? AND fecha_fin > ?
             AND id != ?""",
        (item_id, fin, inicio, excluir_reserva_id or -1),
    ).fetchone()
    if reserva:
        return True

    # SQL 2: préstamos SOLICITADO/AUTORIZADO/EN_CURSO del ítem que choquen con la franja
    prestamo = db.execute(
        """SELECT id FROM prestamos
           WHERE item_id = ?
             AND estado IN ('SOLICITADO', 'AUTORIZADO', 'EN_CURSO')
             AND fecha_inicio < ? AND fecha_fin > ?""",
        (item_id, fin, inicio),
    ).fetchone()
    return prestamo is not None


# ===========================================================================
# Modelos de entrada (validan el JSON que envía React)
# ===========================================================================
class LoginIn(BaseModel):
    email: str
    password: str


class ItemCrear(BaseModel):
    codigo_patrimonial: str
    nombre: str
    descripcion: str = ""
    tipo_item: Literal["LIBRO", "EQUIPO", "OBJETO"]
    estado_fisico: Literal["BUENO", "REGULAR", "DANADO"] = "BUENO"


class ItemActualizar(BaseModel):
    # Todos opcionales: solo se actualizan los campos enviados
    codigo_patrimonial: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo_item: Optional[Literal["LIBRO", "EQUIPO", "OBJETO"]] = None
    estado_fisico: Optional[Literal["BUENO", "REGULAR", "DANADO"]] = None
    # DADO_DE_BAJA solo vía DELETE; PRESTADO solo vía /entrega
    disponibilidad: Optional[Literal["DISPONIBLE", "EN_MANTENIMIENTO"]] = None


class DevolucionIn(BaseModel):
    estado_fisico_recibido: Literal["BUENO", "REGULAR", "DANADO"]


# ===========================================================================
# MÓDULO IAM
# ===========================================================================
@app.post("/api/v1/auth/login")
def login(datos: LoginIn):
    """Verifica credenciales con SQL y retorna un JWT."""
    with conexion() as db:
        # SQL: SELECT ... FROM usuarios WHERE email = ?
        usuario = db.execute(
            "SELECT id, email, password_hash, nombre, rol, estado_cuenta FROM usuarios WHERE email = ?",
            (datos.email,),
        ).fetchone()

    # Mismo mensaje para email inexistente o clave incorrecta (no revela cuál falló)
    if usuario is None or not verify_password(datos.password, usuario["password_hash"]):
        raise HTTPException(401, "Credenciales incorrectas")

    if usuario["estado_cuenta"] != "ACTIVA":
        raise HTTPException(403, f"Cuenta {usuario['estado_cuenta']}: no puede iniciar sesión")

    token = create_access_token({"sub": str(usuario["id"]), "rol": usuario["rol"]})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/v1/usuarios/me")
def usuario_me(usuario: dict = Depends(get_usuario_actual)):
    """Retorna los datos de la sesión (ya consultados por get_usuario_actual)."""
    return usuario


# ===========================================================================
# MÓDULO CATÁLOGO
# ===========================================================================
@app.get("/api/v1/items")
def listar_items(usuario: dict = Depends(get_usuario_actual)):
    """Lista los ítems activos (todos excepto los dados de baja)."""
    with conexion() as db:
        # SQL: SELECT * FROM items_inventario WHERE disponibilidad != 'DADO_DE_BAJA'
        filas = db.execute(
            "SELECT * FROM items_inventario WHERE disponibilidad != 'DADO_DE_BAJA' ORDER BY nombre"
        ).fetchall()
    return [dict(f) for f in filas]


@app.post("/api/v1/admin/items", status_code=201)
def crear_item(datos: ItemCrear, admin: dict = SOLO_ADMIN):
    """Alta de ítem (RN-03: solo ADMINISTRADOR_SISTEMA)."""
    with conexion() as db:
        # SQL: verificar que el código patrimonial no exista
        repetido = db.execute(
            "SELECT id FROM items_inventario WHERE codigo_patrimonial = ?",
            (datos.codigo_patrimonial,),
        ).fetchone()
        if repetido:
            raise HTTPException(409, "Ya existe un ítem con ese código patrimonial")

        # Regla de transición: un ítem que nace DANADO queda EN_MANTENIMIENTO
        disponibilidad = "EN_MANTENIMIENTO" if datos.estado_fisico == "DANADO" else "DISPONIBLE"

        # SQL: INSERT INTO items_inventario (...) VALUES (...)
        cursor = db.execute(
            """INSERT INTO items_inventario
               (codigo_patrimonial, nombre, descripcion, tipo_item, estado_fisico, disponibilidad)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                datos.codigo_patrimonial,
                datos.nombre,
                datos.descripcion,
                datos.tipo_item,
                datos.estado_fisico,
                disponibilidad,
            ),
        )
        nuevo_id = cursor.lastrowid

    return {"id": nuevo_id, "mensaje": "Ítem creado", "disponibilidad": disponibilidad}


@app.put("/api/v1/admin/items/{item_id}")
def modificar_item(item_id: int, datos: ItemActualizar, admin: dict = SOLO_ADMIN):
    """Modificación parcial de un ítem (RN-03)."""
    with conexion() as db:
        item = obtener_item_o_404(db, item_id)

        if item["disponibilidad"] == "DADO_DE_BAJA":
            raise HTTPException(409, "El ítem está dado de baja y no puede modificarse")

        # Solo los campos enviados por el cliente
        cambios = datos.model_dump(exclude_none=True)
        if not cambios:
            raise HTTPException(400, "No se envió ningún campo para modificar")

        # Un ítem prestado no puede cambiar su disponibilidad manualmente
        if item["disponibilidad"] == "PRESTADO" and "disponibilidad" in cambios:
            raise HTTPException(409, "El ítem está PRESTADO; su disponibilidad cambia con la devolución")

        # Código patrimonial único
        if "codigo_patrimonial" in cambios:
            repetido = db.execute(
                "SELECT id FROM items_inventario WHERE codigo_patrimonial = ? AND id != ?",
                (cambios["codigo_patrimonial"], item_id),
            ).fetchone()
            if repetido:
                raise HTTPException(409, "Ya existe otro ítem con ese código patrimonial")

        # Regla de transición: DANADO => EN_MANTENIMIENTO automáticamente
        # (si el ítem está PRESTADO, pasará a EN_MANTENIMIENTO al devolverse)
        if cambios.get("estado_fisico") == "DANADO" and item["disponibilidad"] != "PRESTADO":
            cambios["disponibilidad"] = "EN_MANTENIMIENTO"

        # SQL dinámico: los nombres de columna salen del modelo Pydantic (lista cerrada),
        # y los valores siempre van como parámetros "?" (sin riesgo de inyección SQL).
        asignaciones = ", ".join(f"{columna} = ?" for columna in cambios)
        valores = list(cambios.values()) + [item_id]
        # SQL: UPDATE items_inventario SET col1 = ?, col2 = ? WHERE id = ?
        db.execute(f"UPDATE items_inventario SET {asignaciones} WHERE id = ?", valores)

        actualizado = obtener_item_o_404(db, item_id)

    return dict(actualizado)


@app.delete("/api/v1/admin/items/{item_id}")
def baja_logica_item(item_id: int, admin: dict = SOLO_ADMIN):
    """Baja lógica: NO borra la fila, cambia disponibilidad a DADO_DE_BAJA."""
    with conexion() as db:
        obtener_item_o_404(db, item_id)

        # SQL: ¿tiene un préstamo EN_CURSO? Si sí, no se puede dar de baja
        activo = db.execute(
            "SELECT id FROM prestamos WHERE item_id = ? AND estado = 'EN_CURSO' LIMIT 1",
            (item_id,),
        ).fetchone()
        if activo:
            raise HTTPException(409, "No se puede dar de baja: el ítem tiene un préstamo EN_CURSO")

        # SQL: UPDATE items_inventario SET disponibilidad = 'DADO_DE_BAJA' WHERE id = ?
        db.execute(
            "UPDATE items_inventario SET disponibilidad = 'DADO_DE_BAJA' WHERE id = ?",
            (item_id,),
        )

    return {"mensaje": "Ítem dado de baja"}


# ===========================================================================
# MÓDULO PRÉSTAMOS - 
# ===========================================================================
@app.put("/api/v1/admin/prestamos/{prestamo_id}/autorizar")
def autorizar_prestamo(prestamo_id: int, admin: dict = SOLO_ADMIN):
    """SOLICITADO -> AUTORIZADO (RN-03)."""
    with conexion() as db:
        prestamo = obtener_prestamo_o_404(db, prestamo_id)
        if prestamo["estado"] != "SOLICITADO":
            raise HTTPException(409, f"Transición inválida: el préstamo está {prestamo['estado']}")

        # SQL: UPDATE prestamos SET estado = 'AUTORIZADO', autorizado_por_admin_id = ? WHERE id = ?
        db.execute(
            "UPDATE prestamos SET estado = 'AUTORIZADO', autorizado_por_admin_id = ? WHERE id = ?",
            (admin["id"], prestamo_id),
        )
    return {"id": prestamo_id, "estado": "AUTORIZADO"}


@app.put("/api/v1/admin/prestamos/{prestamo_id}/entrega")
def entregar_prestamo(prestamo_id: int, admin: dict = SOLO_ADMIN):
    """AUTORIZADO -> EN_CURSO y el ítem pasa a PRESTADO."""
    with conexion() as db:
        prestamo = obtener_prestamo_o_404(db, prestamo_id)
        if prestamo["estado"] != "AUTORIZADO":
            raise HTTPException(409, f"Transición inválida: el préstamo está {prestamo['estado']}")

        item = obtener_item_o_404(db, prestamo["item_id"])
        if item["disponibilidad"] != "DISPONIBLE":
            raise HTTPException(409, f"El ítem no puede entregarse: está {item['disponibilidad']}")

        # SQL: UPDATE prestamos SET estado = 'EN_CURSO' WHERE id = ?
        db.execute("UPDATE prestamos SET estado = 'EN_CURSO' WHERE id = ?", (prestamo_id,))
        # SQL: UPDATE items_inventario SET disponibilidad = 'PRESTADO' WHERE id = ?
        db.execute(
            "UPDATE items_inventario SET disponibilidad = 'PRESTADO' WHERE id = ?",
            (prestamo["item_id"],),
        )
    return {"id": prestamo_id, "estado": "EN_CURSO", "item_disponibilidad": "PRESTADO"}


@app.put("/api/v1/admin/prestamos/{prestamo_id}/devolucion")
def devolver_prestamo(prestamo_id: int, datos: DevolucionIn, admin: dict = SOLO_ADMIN):
    """
    EN_CURSO -> DEVUELTO. Libera el ítem y aplica RN-07 (sanción automática)
    si el ítem vuelve DANADO o si la devolución es posterior a fecha_fin.
    """
    with conexion() as db:
        prestamo = obtener_prestamo_o_404(db, prestamo_id)
        if prestamo["estado"] != "EN_CURSO":
            raise HTTPException(409, f"Transición inválida: el préstamo está {prestamo['estado']}")

        # SQL: UPDATE prestamos SET estado = 'DEVUELTO' WHERE id = ?
        db.execute("UPDATE prestamos SET estado = 'DEVUELTO' WHERE id = ?", (prestamo_id,))

        # El ítem vuelve con el estado físico recibido.
        # Regla de transición: DANADO => EN_MANTENIMIENTO; en otro caso => DISPONIBLE.
        nueva_disponibilidad = "EN_MANTENIMIENTO" if datos.estado_fisico_recibido == "DANADO" else "DISPONIBLE"
        # SQL: UPDATE items_inventario SET estado_fisico = ?, disponibilidad = ? WHERE id = ?
        db.execute(
            "UPDATE items_inventario SET estado_fisico = ?, disponibilidad = ? WHERE id = ?",
            (datos.estado_fisico_recibido, nueva_disponibilidad, prestamo["item_id"]),
        )

        # --- RN-07: detectar infracciones ---
        infracciones = []  # lista de (tipo_infraccion, penalizacion)

        if datos.estado_fisico_recibido == "DANADO":
            infracciones.append(("DANO", "Reposición o reparación del ítem dañado"))

        ahora = datetime.now()
        fin_prestamo = datetime.strptime(prestamo["fecha_fin"], FORMATO_FECHA)
        if ahora > fin_prestamo:
            dias = max(1, (ahora - fin_prestamo).days)
            infracciones.append(("RETRASO", f"Retraso de {dias} día(s)"))

        # Se inserta una sanción por cada infracción y se suspende la cuenta
        for tipo, penalizacion in infracciones:
            # SQL: INSERT INTO sanciones (...) VALUES (..., 'ACTIVA')
            db.execute(
                """INSERT INTO sanciones (usuario_id, prestamo_id, infraccion, penalizacion, estado)
                   VALUES (?, ?, ?, ?, 'ACTIVA')""",
                (prestamo["usuario_id"], prestamo_id, tipo, penalizacion),
            )

        if infracciones:
            # SQL: UPDATE usuarios SET estado_cuenta = 'SUSPENDIDA' WHERE id = ?
            db.execute(
                "UPDATE usuarios SET estado_cuenta = 'SUSPENDIDA' WHERE id = ?",
                (prestamo["usuario_id"],),
            )

    return {
        "id": prestamo_id,
        "estado": "DEVUELTO",
        "item_disponibilidad": nueva_disponibilidad,
        "sanciones_generadas": [{"infraccion": t, "penalizacion": p} for t, p in infracciones],
        "usuario_suspendido": len(infracciones) > 0,
    }


# ===========================================================================
# MÓDULO SOLICITUDES DE PRÉSTAMO (tabla `solicitudes_prestamo`)
# Estados: PENDIENTE -> APROBADO -> DEVUELTO | PENDIENTE -> RECHAZADO
# ===========================================================================
MAX_SOLICITUDES_ACTIVAS = 2  # 'PENDIENTE' o 'APROBADO' simultáneas por usuario


class SolicitudCrear(BaseModel):
    item_id: int
    fecha_inicio: date
    fecha_fin_prevista: date
    observaciones: Optional[str] = None


class ObservacionIn(BaseModel):
    """Cuerpo opcional para aprobar / rechazar / devolver."""
    observaciones: Optional[str] = None


def obtener_solicitud_o_404(db, solicitud_id: int) -> sqlite3.Row:
    # SQL: SELECT * FROM solicitudes_prestamo WHERE id = ?
    fila = db.execute("SELECT * FROM solicitudes_prestamo WHERE id = ?", (solicitud_id,)).fetchone()
    if fila is None:
        raise HTTPException(404, "Solicitud no encontrada")
    return fila


@app.post("/api/v1/prestamos/solicitar", status_code=201)
def solicitar_prestamo(datos: SolicitudCrear, usuario: dict = SOLO_SOLICITANTE):
    """(Estudiante/Docente) Crea una solicitud en estado PENDIENTE."""
    if datos.fecha_fin_prevista < datos.fecha_inicio:
        raise HTTPException(400, "fecha_fin_prevista no puede ser anterior a fecha_inicio")

    # Regla 1: la cuenta debe estar ACTIVA (estado leído de la BD en esta misma petición)
    if usuario["estado_cuenta"] != "ACTIVA":
        raise HTTPException(400, f"Cuenta {usuario['estado_cuenta']}: no puede solicitar préstamos")

    with conexion() as db:
        # Regla 2: el ítem debe estar DISPONIBLE
        item = obtener_item_o_404(db, datos.item_id)
        if item["disponibilidad"] != "DISPONIBLE":
            raise HTTPException(400, f"El ítem no está disponible ({item['disponibilidad']})")

        # Regla 3: máximo 2 solicitudes activas por usuario
        # SQL: SELECT COUNT(*) FROM solicitudes_prestamo WHERE usuario_id = ? AND estado IN (...)
        activas = db.execute(
            """SELECT COUNT(*) AS total FROM solicitudes_prestamo
               WHERE usuario_id = ? AND estado IN ('PENDIENTE', 'APROBADO')""",
            (usuario["id"],),
        ).fetchone()["total"]
        if activas >= MAX_SOLICITUDES_ACTIVAS:
            raise HTTPException(
                400, f"Ya tiene {MAX_SOLICITUDES_ACTIVAS} solicitudes activas (PENDIENTE o APROBADO)"
            )

        # SQL: INSERT INTO solicitudes_prestamo (...) VALUES (...)  -- estado queda en 'PENDIENTE'
        cursor = db.execute(
            """INSERT INTO solicitudes_prestamo
               (usuario_id, item_id, fecha_inicio, fecha_fin_prevista, observaciones)
               VALUES (?, ?, ?, ?, ?)""",
            (
                usuario["id"],
                datos.item_id,
                datos.fecha_inicio.isoformat(),
                datos.fecha_fin_prevista.isoformat(),
                datos.observaciones,
            ),
        )
        solicitud_id = cursor.lastrowid

    return {"id": solicitud_id, "estado": "PENDIENTE"}


@app.get("/api/v1/prestamos/mis-solicitudes")
def mis_solicitudes(usuario: dict = SOLO_SOLICITANTE):
    """(Estudiante/Docente) Historial propio, de la más reciente a la más antigua."""
    with conexion() as db:
        # SQL: solicitudes del usuario + datos del ítem (JOIN)
        filas = db.execute(
            """SELECT s.id, s.item_id, i.codigo_patrimonial, i.nombre AS item_nombre,
                      s.fecha_solicitud, s.fecha_inicio, s.fecha_fin_prevista,
                      s.fecha_devolucion_real, s.estado, s.observaciones
               FROM solicitudes_prestamo s
               JOIN items_inventario i ON i.id = s.item_id
               WHERE s.usuario_id = ?
               ORDER BY s.fecha_solicitud DESC, s.id DESC""",
            (usuario["id"],),
        ).fetchall()
    return [dict(f) for f in filas]


@app.get("/api/v1/admin/prestamos")
def listar_solicitudes_admin(
    estado: Optional[Literal["PENDIENTE", "APROBADO", "RECHAZADO", "DEVUELTO", "CANCELADO"]] = None,
    admin: dict = SOLO_ADMIN,
):
    """(Admin) Lista todas las solicitudes. Filtro opcional: ?estado=PENDIENTE"""
    # SQL: solicitudes + datos del usuario y del ítem (JOIN)
    consulta = """SELECT s.id, s.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
                         s.item_id, i.codigo_patrimonial, i.nombre AS item_nombre,
                         s.fecha_solicitud, s.fecha_inicio, s.fecha_fin_prevista,
                         s.fecha_devolucion_real, s.estado, s.observaciones
                  FROM solicitudes_prestamo s
                  JOIN usuarios u ON u.id = s.usuario_id
                  JOIN items_inventario i ON i.id = s.item_id"""
    parametros = []
    if estado:
        consulta += " WHERE s.estado = ?"
        parametros.append(estado)
    consulta += " ORDER BY s.fecha_solicitud DESC, s.id DESC"

    with conexion() as db:
        filas = db.execute(consulta, parametros).fetchall()
    return [dict(f) for f in filas]


@app.put("/api/v1/admin/prestamos/{solicitud_id}/aprobar")
def aprobar_solicitud(solicitud_id: int, datos: Optional[ObservacionIn] = None, admin: dict = SOLO_ADMIN):
    """(Admin) PENDIENTE -> APROBADO y el ítem pasa a PRESTADO."""
    observaciones = datos.observaciones if datos else None

    with conexion() as db:
        solicitud = obtener_solicitud_o_404(db, solicitud_id)
        if solicitud["estado"] != "PENDIENTE":
            raise HTTPException(409, f"Transición inválida: la solicitud está {solicitud['estado']}")

        # Dos usuarios pueden haber pedido el mismo ítem mientras estaba DISPONIBLE;
        # solo se puede aprobar la primera, así que se revisa de nuevo aquí.
        item = obtener_item_o_404(db, solicitud["item_id"])
        if item["disponibilidad"] != "DISPONIBLE":
            raise HTTPException(409, f"No se puede aprobar: el ítem está {item['disponibilidad']}")

        # SQL: UPDATE solicitudes_prestamo SET estado = 'APROBADO' ...
        db.execute(
            "UPDATE solicitudes_prestamo SET estado = 'APROBADO', observaciones = COALESCE(?, observaciones) WHERE id = ?",
            (observaciones, solicitud_id),
        )
        # SQL: UPDATE items_inventario SET disponibilidad = 'PRESTADO' WHERE id = ?
        db.execute(
            "UPDATE items_inventario SET disponibilidad = 'PRESTADO' WHERE id = ?",
            (solicitud["item_id"],),
        )

    return {"id": solicitud_id, "estado": "APROBADO", "item_disponibilidad": "PRESTADO"}


@app.put("/api/v1/admin/prestamos/{solicitud_id}/rechazar")
def rechazar_solicitud(solicitud_id: int, datos: Optional[ObservacionIn] = None, admin: dict = SOLO_ADMIN):
    """(Admin) PENDIENTE -> RECHAZADO. El ítem no cambia (sigue DISPONIBLE)."""
    observaciones = datos.observaciones if datos else None

    with conexion() as db:
        solicitud = obtener_solicitud_o_404(db, solicitud_id)
        if solicitud["estado"] != "PENDIENTE":
            raise HTTPException(409, f"Transición inválida: la solicitud está {solicitud['estado']}")

        # SQL: UPDATE solicitudes_prestamo SET estado = 'RECHAZADO' ...
        db.execute(
            "UPDATE solicitudes_prestamo SET estado = 'RECHAZADO', observaciones = COALESCE(?, observaciones) WHERE id = ?",
            (observaciones, solicitud_id),
        )

    return {"id": solicitud_id, "estado": "RECHAZADO"}


@app.put("/api/v1/admin/prestamos/{solicitud_id}/devolver")
def devolver_solicitud(solicitud_id: int, datos: Optional[ObservacionIn] = None, admin: dict = SOLO_ADMIN):
    """(Admin) APROBADO -> DEVUELTO, registra la fecha real y libera el ítem."""
    observaciones = datos.observaciones if datos else None

    with conexion() as db:
        solicitud = obtener_solicitud_o_404(db, solicitud_id)
        if solicitud["estado"] != "APROBADO":
            raise HTTPException(409, f"Transición inválida: la solicitud está {solicitud['estado']}")

        hoy = date.today().isoformat()

        # SQL: UPDATE solicitudes_prestamo SET estado = 'DEVUELTO', fecha_devolucion_real = ? ...
        db.execute(
            """UPDATE solicitudes_prestamo
               SET estado = 'DEVUELTO', fecha_devolucion_real = ?,
                   observaciones = COALESCE(?, observaciones)
               WHERE id = ?""",
            (hoy, observaciones, solicitud_id),
        )
        # SQL: UPDATE items_inventario SET disponibilidad = 'DISPONIBLE' WHERE id = ?
        db.execute(
            "UPDATE items_inventario SET disponibilidad = 'DISPONIBLE' WHERE id = ?",
            (solicitud["item_id"],),
        )

    return {
        "id": solicitud_id,
        "estado": "DEVUELTO",
        "fecha_devolucion_real": hoy,
        "item_disponibilidad": "DISPONIBLE",
    }
