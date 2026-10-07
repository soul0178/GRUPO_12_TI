import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function PerfilPage() {
  const { usuario, setUsuario } = useAuth();
  const [f, setF] = useState({ ...usuario.perfil, codigo_institucional: usuario.perfil.codigo_institucional ?? "" });
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const cambiar = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    try {
      const actualizado = await api.actualizarPerfil({ ...f, codigo_institucional: f.codigo_institucional || null });
      setUsuario(actualizado);
      setMensaje({ tipo: "ok", texto: "Perfil actualizado" });
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    }
  }

  return (
    <form className="tarjeta" onSubmit={guardar}>
      <h2>Mi perfil</h2>
      <p className="suave">{usuario.correo_institucional} · cuenta {usuario.estado_cuenta}</p>
      <label>Nombres<input value={f.nombres} onChange={cambiar("nombres")} required /></label>
      <label>Apellidos<input value={f.apellidos} onChange={cambiar("apellidos")} required /></label>
      <label>Código institucional<input value={f.codigo_institucional} onChange={cambiar("codigo_institucional")} /></label>
      <label>Teléfono<input value={f.telefono} onChange={cambiar("telefono")} /></label>
      <label>Dirección<input value={f.direccion} onChange={cambiar("direccion")} /></label>
      <label>Correo alterno<input type="email" value={f.correo_alterno} onChange={cambiar("correo_alterno")} /></label>
      {mensaje.texto && <p className={mensaje.tipo}>{mensaje.texto}</p>}
      <button type="submit">Guardar cambios</button>
    </form>
  );
}
