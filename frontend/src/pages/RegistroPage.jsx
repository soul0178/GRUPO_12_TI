import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function RegistroPage() {
  const { login } = useAuth();
  const navegar = useNavigate();
  const [f, setF] = useState({ correo_institucional: "", password: "", nombres: "", apellidos: "", codigo_institucional: "" });
  const [error, setError] = useState("");
  const cambiar = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError("");
    try {
      await api.registrar({ ...f, codigo_institucional: f.codigo_institucional || null });
      await login(f.correo_institucional, f.password); // inicia sesión automáticamente
      navegar("/perfil");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="tarjeta" onSubmit={enviar}>
      <h2>Crear cuenta</h2>
      <label>Nombres<input value={f.nombres} onChange={cambiar("nombres")} required /></label>
      <label>Apellidos<input value={f.apellidos} onChange={cambiar("apellidos")} required /></label>
      <label>Código institucional (opcional)<input value={f.codigo_institucional} onChange={cambiar("codigo_institucional")} /></label>
      <label>Correo institucional<input type="email" value={f.correo_institucional} onChange={cambiar("correo_institucional")} required /></label>
      <label>Contraseña (mín. 8 caracteres)<input type="password" minLength={8} value={f.password} onChange={cambiar("password")} required /></label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Registrarme</button>
      <p>¿Ya tienes cuenta? <Link to="/login">Ingresa</Link></p>
    </form>
  );
}
