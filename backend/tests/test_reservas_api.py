"""API de reservas de extremo a extremo (criterios de la Fase 3 – 55 %)."""
from datetime import datetime, timedelta, timezone

from app.iam_usuarios.infrastructure.sql_usuario_repository import SqlUsuarioRepository


def futuro(dias=2, hora=10):
    base = datetime.now(timezone.utc).replace(hour=hora, minute=0, second=0, microsecond=0)
    return base + timedelta(days=dias)


def cuerpo(item_id, ini, horas=2):
    return {"item_id": item_id, "inicio": ini.isoformat(), "fin": (ini + timedelta(hours=horas)).isoformat()}


def test_reservar_devuelve_201_confirmada(client, token_de, crear_item):
    item = crear_item()
    r = client.post("/reservas", json=cuerpo(item["item_id"], futuro()), headers=token_de())
    assert r.status_code == 201
    assert r.json()["estado"] == "CONFIRMADA" and r.json()["item_id"] == item["item_id"]


def test_reservar_exige_sesion(client, crear_item):
    item = crear_item()
    assert client.post("/reservas", json=cuerpo(item["item_id"], futuro())).status_code == 401


def test_el_solicitante_sale_del_token_no_del_cuerpo(client, token_de, crear_item):
    item = crear_item()
    h = token_de()
    uid = client.get("/usuarios/me", headers=h).json()["usuario_id"]
    r = client.post("/reservas", json=cuerpo(item["item_id"], futuro()) | {"solicitante_id": "otro"}, headers=h)
    assert r.json()["solicitante_id"] == uid


def test_reserva_solapada_da_409_y_contigua_es_valida(client, token_de, crear_item):  # RNF-02
    item = crear_item()
    ini = futuro()
    assert client.post("/reservas", json=cuerpo(item["item_id"], ini), headers=token_de("ana@unsa.edu.pe")).status_code == 201
    solapada = client.post("/reservas", json=cuerpo(item["item_id"], ini + timedelta(hours=1)),
                           headers=token_de("beto@unsa.edu.pe"))
    assert solapada.status_code == 409
    contigua = client.post("/reservas", json=cuerpo(item["item_id"], ini + timedelta(hours=2)),
                           headers=token_de("beto@unsa.edu.pe"))
    assert contigua.status_code == 201


def test_mismo_horario_en_otro_item_es_valido(client, token_de, crear_item):
    a, b = crear_item("LAP-001"), crear_item("LAP-002", "Laptop HP")
    ini = futuro()
    h = token_de()
    assert client.post("/reservas", json=cuerpo(a["item_id"], ini), headers=h).status_code == 201
    assert client.post("/reservas", json=cuerpo(b["item_id"], ini), headers=h).status_code == 201


def test_reserva_en_el_pasado_da_422(client, token_de, crear_item):
    item = crear_item()
    r = client.post("/reservas", json=cuerpo(item["item_id"], futuro(dias=-1)), headers=token_de())
    assert r.status_code == 422


def test_fin_antes_de_inicio_da_422(client, token_de, crear_item):
    item = crear_item()
    ini = futuro()
    r = client.post("/reservas", json={"item_id": item["item_id"], "inicio": ini.isoformat(),
                                       "fin": (ini - timedelta(hours=1)).isoformat()}, headers=token_de())
    assert r.status_code == 422


def test_item_inexistente_da_404_y_item_de_baja_da_409(client, token_de, admin_headers, crear_item):
    h = token_de()
    assert client.post("/reservas", json=cuerpo("no-existe", futuro()), headers=h).status_code == 404
    item = crear_item()
    client.delete(f"/admin/items/{item['item_id']}", headers=admin_headers)
    assert client.post("/reservas", json=cuerpo(item["item_id"], futuro()), headers=h).status_code == 409


def test_item_en_mantenimiento_no_se_reserva(client, token_de, admin_headers, crear_item):
    item = crear_item()
    client.put(f"/admin/items/{item['item_id']}/estado-fisico", json={"estado_fisico": "DANADO"}, headers=admin_headers)
    assert client.post("/reservas", json=cuerpo(item["item_id"], futuro()), headers=token_de()).status_code == 409


def test_usuario_suspendido_recibe_403(client, db, token_de, crear_item):  # RN-02
    item = crear_item()
    h = token_de()
    repo = SqlUsuarioRepository(db)
    u = repo.buscar_por_correo("ana@unsa.edu.pe")
    u.suspender("sancion-1")
    repo.guardar(u)
    assert client.post("/reservas", json=cuerpo(item["item_id"], futuro()), headers=h).status_code == 403


def test_mis_reservas_solo_muestra_las_propias(client, token_de, crear_item):
    item = crear_item()
    ha, hb = token_de("ana@unsa.edu.pe"), token_de("beto@unsa.edu.pe")
    ini = futuro()
    client.post("/reservas", json=cuerpo(item["item_id"], ini), headers=ha)
    client.post("/reservas", json=cuerpo(item["item_id"], ini + timedelta(hours=3)), headers=hb)
    mias = client.get("/reservas/mias", headers=ha).json()
    assert len(mias) == 1
    assert mias[0]["solicitante_id"] == client.get("/usuarios/me", headers=ha).json()["usuario_id"]


def test_cancelar_libera_el_horario(client, token_de, crear_item):
    item = crear_item()
    ini = futuro()
    h = token_de()
    rid = client.post("/reservas", json=cuerpo(item["item_id"], ini), headers=h).json()["reserva_id"]
    r = client.delete(f"/reservas/{rid}", headers=h)
    assert r.status_code == 200 and r.json()["estado"] == "CANCELADA"
    assert client.post("/reservas", json=cuerpo(item["item_id"], ini), headers=token_de("beto@unsa.edu.pe")).status_code == 201


def test_no_se_cancela_dos_veces_ni_la_ajena(client, token_de, admin_headers, crear_item):
    item = crear_item()
    ha, hb = token_de("ana@unsa.edu.pe"), token_de("beto@unsa.edu.pe")
    rid = client.post("/reservas", json=cuerpo(item["item_id"], futuro()), headers=ha).json()["reserva_id"]
    assert client.delete(f"/reservas/{rid}", headers=hb).status_code == 403
    assert client.delete(f"/reservas/{rid}", headers=admin_headers).status_code == 200  # el admin sí puede
    assert client.delete(f"/reservas/{rid}", headers=ha).status_code == 409  # ya cancelada
    assert client.delete("/reservas/no-existe", headers=ha).status_code == 404


def test_disponibilidad_muestra_franjas_ocupadas_sin_datos_personales(client, token_de, crear_item):
    item = crear_item()
    ini = futuro()
    client.post("/reservas", json=cuerpo(item["item_id"], ini), headers=token_de("ana@unsa.edu.pe"))
    r = client.get(f"/items/{item['item_id']}/disponibilidad", headers=token_de("beto@unsa.edu.pe"))
    assert r.status_code == 200 and len(r.json()) == 1
    assert set(r.json()[0]) == {"inicio", "fin"}


def test_admin_lista_todas_y_estudiante_recibe_403(client, token_de, admin_headers, crear_item):
    item = crear_item()
    client.post("/reservas", json=cuerpo(item["item_id"], futuro()), headers=token_de())
    assert len(client.get("/admin/reservas", headers=admin_headers).json()) == 1
    assert client.get("/admin/reservas", headers=token_de()).status_code == 403
