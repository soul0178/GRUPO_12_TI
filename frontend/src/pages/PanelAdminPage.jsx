import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const ROLES = ["ESTUDIANTE", "DOCENTE", "ADMINISTRATIVO", "ADMINISTRADOR_SISTEMA"];

export default function PanelAdminPage() {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");

  const cargar = () => api.listarUsuarios().then(setUsuarios).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  async function cambiarRol(id, rol) {
    setError("");
    try {
      await api.cambiarRol(id, rol);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="tarjeta ancha">
      <h2>Panel de administración · Usuarios</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Estado</th><th>Rol</th></tr></thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.usuario_id}>
              <td>{u.perfil.nombres} {u.perfil.apellidos}</td>
              <td>{u.correo_institucional}</td>
              <td>{u.estado_cuenta}</td>
              <td>
                <select value={u.rol} disabled={u.usuario_id === yo.usuario_id} onChange={(e) => cambiarRol(u.usuario_id, e.target.value)}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
