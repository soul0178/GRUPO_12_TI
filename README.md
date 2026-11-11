# Sistema de Préstamos EPCC

Sistema de préstamo y reserva de equipos, libros y objetos de la EPCC (UNSA). Grupo 12.

| Carpeta | Contenido |
|---|---|
| `backend/` | API REST: Java 21, Spring Boot 3.5, PostgreSQL 16, Flyway, JWT |
| `frontend/` | Web: React 19 + TypeScript, Vite, Tailwind, TanStack Query |
| `docs/` | Informes (PDF) y diagramas UML (`.puml` + imagen) |
| `docker-compose.yml` | Base de datos PostgreSQL para desarrollo |

Avance: módulos M0–M5 (base, usuarios, inventario, sanciones, préstamos, reservas). Pendiente: M6 (historial y vencidos).

## Ejecutar en Ubuntu (22.04 / 24.04)

### 1. Requisitos
```bash
sudo apt update
sudo apt install -y git curl openjdk-21-jdk ca-certificates
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
# Docker + Compose
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER      # cerrar sesión y volver a entrar
```
Verifica: `java -version` (21), `node -v` (22), `docker compose version`.

### 2. Base de datos
```bash
docker compose up -d          # desde la raíz del proyecto
docker compose ps             # debe decir "healthy"
```
PostgreSQL queda en `localhost:5440`, base `loans`, usuario `loans`, clave `loans`.
**No hay que crear tablas a mano**: Flyway aplica las migraciones V1–V7 al arrancar el backend.

Acceso manual: `docker exec -it loans-db psql -U loans -d loans`
Reiniciar desde cero (borra datos): `docker compose down -v && docker compose up -d`

### 3. Backend (terminal 1)
```bash
cd backend
./mvnw spring-boot:run
```
- API: http://localhost:8080 · Swagger: http://localhost:8080/swagger-ui
- Admin de pruebas (solo perfil `dev`): `admin@epcc.unsa.edu.pe` / `Admin1234`
- Otro puerto: `SERVER_PORT=8095 ./mvnw spring-boot:run`

### 4. Frontend (terminal 2)
```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:8080/api
npm install
npm run dev
```
Abrir http://localhost:5173 e ingresar con el admin de pruebas.

### Pruebas
```bash
cd backend  && ./mvnw verify    # 206 pruebas; requiere Docker activo (Testcontainers)
cd frontend && npm test         # 102 pruebas
```

## Producción
Perfil `prod`, sin valores por defecto; son obligatorias estas variables:
`DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (mín. 32 caracteres), `CORS_ALLOWED_ORIGINS`.
```bash
cd backend && ./mvnw -DskipTests package
SPRING_PROFILES_ACTIVE=prod DB_URL=jdbc:postgresql://host:5432/loans DB_USER=... DB_PASSWORD=... \
JWT_SECRET=... CORS_ALLOWED_ORIGINS=https://tu-dominio java -jar target/loans-0.0.1-SNAPSHOT.jar
cd frontend && VITE_API_URL=https://tu-dominio/api npm run build   # sirve dist/ con nginx
```

## Problemas frecuentes
- **`permission denied` con docker**: falta `sudo usermod -aG docker $USER` y reiniciar sesión.
- **Puerto 5440 u 8080 ocupado**: `sudo ss -ltnp | grep -E '5440|8080'`.
- **Frontend sin datos / error CORS**: el backend debe estar en `dev` (permite `http://localhost:5173`).
- **`./mvnw: Permission denied`**: `chmod +x backend/mvnw`.
