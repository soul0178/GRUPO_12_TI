import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

// Sin sesión -> /login. Con sesión pero rol no permitido -> pantalla 403.
// OJO: esto es solo UX; la seguridad real la aplica el backend (RBAC).
export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <p className="centro">Cargando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="tarjeta">
        <h2>403 · Acceso denegado</h2>
        <p>Tu rol ({usuario.rol}) no tiene permiso para ver esta página.</p>
      </div>
    );
  }
  return children;
}
