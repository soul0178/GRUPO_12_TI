// Cliente HTTP mínimo. Centraliza la URL base, el token y el manejo de errores.
const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const CLAVE_TOKEN = "epcc_token";

export const getToken = () => localStorage.getItem(CLAVE_TOKEN);
export const setToken = (t) => (t ? localStorage.setItem(CLAVE_TOKEN, t) : localStorage.removeItem(CLAVE_TOKEN));

async function pedir(ruta, { metodo = "GET", cuerpo } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resp;
  try {
    resp = await fetch(`${BASE}${ruta}`, { method: metodo, headers, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }
  const datos = await resp.json().catch(() => null);
  if (!resp.ok) {
    // FastAPI devuelve {detail: "texto"} o {detail: [{msg: ...}]} (validación 422)
    const d = datos?.detail;
    const mensaje = Array.isArray(d) ? d.map((e) => e.msg).join(". ") : d || "Error inesperado";
    const error = new Error(mensaje);
    error.status = resp.status;
    throw error;
  }
  return datos;
}

export const api = {
  registrar: (d) => pedir("/auth/register", { metodo: "POST", cuerpo: d }),
  login: (d) => pedir("/auth/login", { metodo: "POST", cuerpo: d }),
  yo: () => pedir("/usuarios/me"),
  actualizarPerfil: (d) => pedir("/usuarios/me/perfil", { metodo: "PUT", cuerpo: d }),
  listarUsuarios: () => pedir("/admin/usuarios"),
  cambiarRol: (id, rol) => pedir(`/admin/usuarios/${id}/rol`, { metodo: "PUT", cuerpo: { rol } }),
};
