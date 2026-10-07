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
            <Link to="/perfil">Mi perfil</Link>
            {usuario.rol === "ADMINISTRADOR_SISTEMA" && <Link to="/admin">Panel admin</Link>}
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
