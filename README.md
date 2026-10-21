# Sistema de Préstamos EPCC

Proyecto del Grupo 12 – Escuela Profesional de Ciencia de la Computación (UNSA).
Diseño guiado por el dominio (DDD) como monolito modular. Ver `docs/` para el informe.

## Requisitos
- Python 3.12+
- Git

## Levantar el backend
```bash
git clone <URL-DEL-REPOSITORIO>
cd ~/GRUPO_12_TI/backend
python -m venv .venv
# Windows: .venv\Scripts\activate    |   Linux/Mac: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # Windows: copy .env.example .env
uvicorn app.main:app --reload
```
Abrir http://127.0.0.1:8000/health y http://127.0.0.1:8000/docs

### Crear el Administrador del Sistema (el registro público solo crea ESTUDIANTE)
```bash
python -m scripts.crear_admin --correo admin@unsa.edu.pe --password "ClaveSegura123"
```

## Levantar el frontend
```bash
cd ~/GRUPO_12_TI/frontend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev                 # http://localhost:5173
```
Generar una `SECRET_KEY` real en `backend/.env`:
`python -c "import secrets; print(secrets.token_hex(32))"`

## Pruebas
```bash
cd backend
pytest -v
```

## Estructura
```
backend/app/<contexto>/{domain,application,infrastructure,presentation}
backend/app/shared/   (config, base de datos, bus de eventos)
frontend/             (React + Vite)
docs/                 (informe y diagramas .puml / .png)
```
Contextos: `iam_usuarios`, `catalogo_inventario`, `circulacion`, `politicas_sanciones`.

## Flujo de trabajo Git
Rama `main` estable, `develop` de integración, ramas `feature/<fase>-<tarea>` por persona; todo entra por Pull Request con CI en verde.

## API disponible
| Método y ruta | Quién | Descripción |
|---|---|---|
| `POST /auth/register`, `POST /auth/login` | público | Registro (siempre ESTUDIANTE) y login JWT |
| `GET /usuarios/me`, `PUT /usuarios/me/perfil` | autenticado | Perfil propio |
| `GET /admin/usuarios`, `PUT /admin/usuarios/{id}/rol` | administrador | Usuarios y roles |
| `GET /items?tipo=`, `GET /items/{id}` | autenticado | Catálogo (no muestra ítems dados de baja) |
| `POST /admin/items`, `PUT /admin/items/{id}` | administrador | Alta y modificación de ítems |
| `PUT /admin/items/{id}/estado-fisico`, `DELETE /admin/items/{id}` | administrador | Estado físico y baja lógica |
| `GET /items/{id}/disponibilidad` | autenticado | Franjas ya ocupadas del ítem |
| `POST /reservas`, `GET /reservas/mias`, `DELETE /reservas/{id}` | autenticado | Reservar, ver y cancelar (solo la propia; el admin cualquiera) |
| `GET /admin/reservas` | administrador | Todas las reservas |

Documentación interactiva en http://127.0.0.1:8000/docs. Todas las fechas viajan en UTC (ISO 8601); el frontend las muestra en hora local.

## Avance
- [x] Fase 0 – Cimientos (10 %)
- [x] Fase 1 – IAM_Usuarios (25 %)
- [x] Fase 2 – Catálogo (35 %)
- [x] Fase 3 – Reservas, núcleo (55 %)
- [ ] Fase 4 – Préstamos (75 %)

Detalle del 55 % en `docs/Avance_55.md`.


