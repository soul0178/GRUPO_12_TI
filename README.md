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

## Avance
- [x] Fase 0 – Cimientos (10 %)
- [x] Fase 1 – IAM_Usuarios (25 %)
- [ ] Fase 2 – Catálogo (35 %)


