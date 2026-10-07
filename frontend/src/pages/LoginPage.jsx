import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
  const { usuario, login } = useAuth();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (usuario) return <Navigate to="/perfil" replace />;

  async function enviar(e) {
    e.preventDefault();
    setError("");
    try {
      await login(correo, password);
      navegar("/perfil");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="tarjeta" onSubmit={enviar}>
      <h2>Iniciar sesión</h2>
      <label>Correo institucional<input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required /></label>
      <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Ingresar</button>
      <p>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    </form>
  );
}
