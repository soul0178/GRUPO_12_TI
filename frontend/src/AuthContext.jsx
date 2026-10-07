import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(!!getToken()); // true si hay token por validar

  // Al abrir la app: si hay token guardado, se valida pidiendo /usuarios/me
  useEffect(() => {
    if (!getToken()) return;
    api.yo().then(setUsuario).catch(() => setToken(null)).finally(() => setCargando(false));
  }, []);

  async function login(correo, password) {
    const { access_token } = await api.login({ correo_institucional: correo, password });
    setToken(access_token);
    setUsuario(await api.yo());
  }

  function logout() {
    setToken(null);
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, setUsuario, cargando, login, logout }}>{children}</AuthContext.Provider>;
}
