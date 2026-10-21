import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  return (
    <header className="navbar">
      <strong>Préstamos EPCC</strong>
      <nav>
        {usuario ? (
          <>
            <Link to="/catalogo">Catálogo</Link>
            <Link to="/reservar">Reservar</Link>
            <Link to="/reservas">Mis reservas</Link>
            <Link to="/perfil">Mi perfil</Link>
            {usuario.rol === "ADMINISTRADOR_SISTEMA" && <Link to="/admin">Usuarios</Link>}
            {usuario.rol === "ADMINISTRADOR_SISTEMA" && <Link to="/admin/inventario">Inventario</Link>}
            <span className="etiqueta">{usuario.rol}</span>
            <button className="secundario" onClick={logout}>Salir</button>
          </>
        ) : (
          <>
            <Link to="/login">Ingresar</Link>
            <Link to="/registro">Registrarse</Link>
          </>
        )}
      </nav>
    </header>
  );
}
