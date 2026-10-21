"""API del catálogo de extremo a extremo (criterios de la Fase 2 – 35 %)."""
ITEM = {"codigo": "LAP-001", "nombre": "Laptop Dell", "tipo": "EQUIPO"}


def test_admin_da_de_alta_un_item(client, admin_headers):
    r = client.post("/admin/items", json=ITEM, headers=admin_headers)
    assert r.status_code == 201
    c = r.json()
    assert c["codigo"] == "LAP-001" and c["disponibilidad"] == "DISPONIBLE"
    assert c["estado_fisico_actual"] == "BUENO"


def test_alta_sin_sesion_da_401_y_estudiante_da_403(client, token_de):  # RNF-01
    assert client.post("/admin/items", json=ITEM).status_code == 401
    assert client.post("/admin/items", json=ITEM, headers=token_de()).status_code == 403


def test_alta_con_codigo_duplicado_da_409(client, admin_headers, crear_item):
    crear_item("LAP-001")
    assert client.post("/admin/items", json=ITEM | {"codigo": "lap-001"}, headers=admin_headers).status_code == 409


def test_alta_valida_datos_422(client, admin_headers):
    assert client.post("/admin/items", json=ITEM | {"nombre": ""}, headers=admin_headers).status_code == 422
    assert client.post("/admin/items", json=ITEM | {"tipo": "COCHE"}, headers=admin_headers).status_code == 422
    # solo espacios: el DTO lo deja pasar, lo rechaza el dominio
    assert client.post("/admin/items", json=ITEM | {"nombre": "   "}, headers=admin_headers).status_code == 422


def test_estudiante_consulta_el_catalogo_y_filtra_por_tipo(client, token_de, crear_item):
    crear_item("LAP-001", "Laptop", "EQUIPO")
    crear_item("LIB-001", "Cálculo I", "LIBRO")
    h = token_de()
    todos = client.get("/items", headers=h)
    assert todos.status_code == 200 and len(todos.json()) == 2
    libros = client.get("/items?tipo=LIBRO", headers=h).json()
    assert [i["codigo"] for i in libros] == ["LIB-001"]


def test_catalogo_exige_sesion(client):
    assert client.get("/items").status_code == 401


def test_obtener_item_y_404(client, token_de, crear_item):
    item = crear_item()
    h = token_de()
    assert client.get(f"/items/{item['item_id']}", headers=h).json()["codigo"] == "LAP-001"
    assert client.get("/items/no-existe", headers=h).status_code == 404


def test_admin_modifica_item_y_persiste(client, admin_headers, crear_item):
    item = crear_item()
    r = client.put(f"/admin/items/{item['item_id']}", headers=admin_headers,
                   json={"nombre": "Laptop HP", "tipo": "EQUIPO", "descripcion": "i7, 16 GB"})
    assert r.status_code == 200 and r.json()["nombre"] == "Laptop HP"
    assert client.get(f"/items/{item['item_id']}", headers=admin_headers).json()["descripcion"] == "i7, 16 GB"


def test_estudiante_no_puede_modificar_ni_dar_de_baja(client, token_de, crear_item):
    item = crear_item()
    h = token_de()
    assert client.put(f"/admin/items/{item['item_id']}", headers=h,
                      json={"nombre": "X", "tipo": "EQUIPO"}).status_code == 403
    assert client.delete(f"/admin/items/{item['item_id']}", headers=h).status_code == 403


def test_estado_fisico_danado_pasa_a_mantenimiento(client, admin_headers, crear_item):  # RF-07
    item = crear_item()
    r = client.put(f"/admin/items/{item['item_id']}/estado-fisico", headers=admin_headers,
                   json={"estado_fisico": "DANADO"})
    assert r.status_code == 200
    assert r.json()["disponibilidad"] == "EN_MANTENIMIENTO"


def test_baja_es_logica_y_el_item_deja_de_aparecer_al_usuario(client, admin_headers, token_de, crear_item):
    item = crear_item()
    r = client.delete(f"/admin/items/{item['item_id']}", headers=admin_headers)
    assert r.status_code == 200 and r.json()["disponibilidad"] == "DADO_DE_BAJA"
    assert client.get("/items", headers=token_de()).json() == []
    # el administrador sí lo ve (historial) y no admite más cambios
    assert len(client.get("/admin/items", headers=admin_headers).json()) == 1
    assert client.put(f"/admin/items/{item['item_id']}", headers=admin_headers,
                      json={"nombre": "X", "tipo": "EQUIPO"}).status_code == 409


def test_operar_item_inexistente_da_404(client, admin_headers):
    assert client.delete("/admin/items/no-existe", headers=admin_headers).status_code == 404
    assert client.put("/admin/items/no-existe", headers=admin_headers,
                      json={"nombre": "X", "tipo": "EQUIPO"}).status_code == 404
