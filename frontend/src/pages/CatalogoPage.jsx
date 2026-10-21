import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const TIPOS = ["", "LIBRO", "EQUIPO", "OBJETO"];

export default function CatalogoPage() {
  const [items, setItems] = useState([]);
  const [tipo, setTipo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.listarItems(tipo).then(setItems).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, [tipo]);

  return (
    <div className="tarjeta ancha">
      <h2>Catálogo</h2>
      <label>Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map((t) => <option key={t} value={t}>{t || "Todos"}</option>)}
        </select>
      </label>
      {error && <p className="error">{error}</p>}
      {cargando ? <p className="suave">Cargando…</p> : (
        <table>
          <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Estado físico</th><th>Disponibilidad</th><th></th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.item_id}>
                <td>{i.codigo}</td><td>{i.nombre}</td><td>{i.tipo}</td>
                <td>{i.estado_fisico_actual}</td>
                <td><span className={`insignia ${i.disponibilidad}`}>{i.disponibilidad}</span></td>
                <td>
                  {["DISPONIBLE", "PRESTADO"].includes(i.disponibilidad)
                    ? <Link to={`/reservar/${i.item_id}`}>Reservar</Link> : null}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="6" className="suave">No hay ítems en el catálogo.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
