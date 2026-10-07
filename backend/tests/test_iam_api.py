"""Pruebas de extremo a extremo de la API de IAM (criterios del 15 % y 25 %)."""
from tests.conftest import datos_registro, registro

LOGIN = "/auth/login"


def test_registro_crea_estudiante_y_no_devuelve_password(client):
    r = client.post("/auth/register", json=registro().model_dump())
    assert r.status_code == 201
    cuerpo = r.json()
    assert cuerpo["rol"] == "ESTUDIANTE" and cuerpo["estado_cuenta"] == "ACTIVA"
    assert "password" not in cuerpo and "password_hash" not in cuerpo


def test_registro_no_permite_elegir_rol_admin(client):
    datos = registro().model_dump() | {"rol": "ADMINISTRADOR_SISTEMA"}
    r = client.post("/auth/register", json=datos)
    assert r.status_code == 201
    assert r.json()["rol"] == "ESTUDIANTE"  # el campo extra se ignora


def test_registro_duplicado_da_409(client):
    client.post("/auth/register", json=registro().model_dump())
    assert client.post("/auth/register", json=registro().model_dump()).status_code == 409


def test_registro_valida_password_y_correo(client):
    assert client.post("/auth/register", json=datos_registro(password="corta")).status_code == 422
    assert client.post("/auth/register", json=datos_registro("sin-arroba")).status_code == 422


def test_login_correcto_devuelve_jwt(client):
    client.post("/auth/register", json=registro().model_dump())
    r = client.post(LOGIN, json={"correo_institucional": "ana@unsa.edu.pe", "password": "Clave12345"})
    assert r.status_code == 200 and r.json()["token_type"] == "bearer"


def test_login_incorrecto_da_401_con_mensaje_generico(client):
    client.post("/auth/register", json=registro().model_dump())
    mal_pass = client.post(LOGIN, json={"correo_institucional": "ana@unsa.edu.pe", "password": "xxxxxxxx"})
    no_existe = client.post(LOGIN, json={"correo_institucional": "nadie@unsa.edu.pe", "password": "xxxxxxxx"})
    assert mal_pass.status_code == no_existe.status_code == 401
    assert mal_pass.json() == no_existe.json()  # no revela si el correo existe


def test_me_sin_token_da_401_y_con_token_basura_da_401(client):
    assert client.get("/usuarios/me").status_code == 401
    assert client.get("/usuarios/me", headers={"Authorization": "Bearer basura"}).status_code == 401


def test_me_devuelve_usuario_y_perfil(client, token_de):
    r = client.get("/usuarios/me", headers=token_de())
    assert r.status_code == 200
    assert r.json()["correo_institucional"] == "ana@unsa.edu.pe"
    assert r.json()["perfil"]["nombres"] == "Ana"


def test_actualizar_perfil_propio(client, token_de):
    h = token_de()
    nuevo = {"nombres": "Ana María", "apellidos": "Pérez", "codigo_institucional": "20240001",
             "telefono": "999888777", "direccion": "Av. Siempre Viva 1", "correo_alterno": "ana@gmail.com"}
    r = client.put("/usuarios/me/perfil", json=nuevo, headers=h)
    assert r.status_code == 200
    assert client.get("/usuarios/me", headers=h).json()["perfil"] == nuevo  # persistió


def test_actualizar_perfil_invalido_da_422(client, token_de):
    r = client.put("/usuarios/me/perfil", json={"nombres": "Ana", "apellidos": "P", "correo_alterno": "mal"},
                   headers=token_de())
    assert r.status_code == 422


def test_estudiante_recibe_403_en_ruta_admin(client, token_de):  # criterio de la Fase 1
    assert client.get("/admin/usuarios", headers=token_de()).status_code == 403


def test_admin_accede_a_ruta_admin(client, token_de, admin_headers):
    token_de("ana@unsa.edu.pe")
    r = client.get("/admin/usuarios", headers=admin_headers)
    assert r.status_code == 200
    assert {u["correo_institucional"] for u in r.json()} == {"admin@unsa.edu.pe", "ana@unsa.edu.pe"}


def test_admin_cambia_rol_y_el_efecto_es_inmediato(client, token_de, admin_headers):
    h = token_de("ana@unsa.edu.pe")
    uid = client.get("/usuarios/me", headers=h).json()["usuario_id"]
    r = client.put(f"/admin/usuarios/{uid}/rol", json={"rol": "DOCENTE"}, headers=admin_headers)
    assert r.status_code == 200 and r.json()["rol"] == "DOCENTE"
    assert client.get("/usuarios/me", headers=h).json()["rol"] == "DOCENTE"  # mismo token


def test_estudiante_no_puede_cambiar_roles(client, token_de):
    h = token_de()
    uid = client.get("/usuarios/me", headers=h).json()["usuario_id"]
    assert client.put(f"/admin/usuarios/{uid}/rol", json={"rol": "ADMINISTRADOR_SISTEMA"}, headers=h).status_code == 403


def test_admin_no_puede_cambiar_su_propio_rol(client, admin_headers):
    uid = client.get("/usuarios/me", headers=admin_headers).json()["usuario_id"]
    assert client.put(f"/admin/usuarios/{uid}/rol", json={"rol": "ESTUDIANTE"}, headers=admin_headers).status_code == 403


def test_cambiar_rol_de_usuario_inexistente_da_404(client, admin_headers):
    assert client.put("/admin/usuarios/no-existe/rol", json={"rol": "DOCENTE"}, headers=admin_headers).status_code == 404
