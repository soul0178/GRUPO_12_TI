import { useEffect, useState } from "react";
import { api, hora } from "../api";

export default function MisReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [nombres, setNombres] = useState({});
  const [error, setError] = useState("");

  const cargar = () => api.misReservas().then(setReservas).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
    api.listarItems().then((l) => setNombres(Object.fromEntries(l.map((i) => [i.item_id, i.nombre])))).catch(() => {});
  }, []);

  async function cancelar(id) {
    setError("");
    try { await api.cancelarReserva(id); await cargar(); } catch (e) { setError(e.message); }
  }

  return (
    <div className="tarjeta ancha">
      <h2>Mis reservas</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>Ítem</th><th>Desde</th><th>Hasta</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {reservas.map((r) => (
            <tr key={r.reserva_id}>
              <td>{nombres[r.item_id] ?? r.item_id.slice(0, 8)}</td>
              <td>{hora(r.inicio)}</td><td>{hora(r.fin)}</td>
              <td><span className={`insignia ${r.estado}`}>{r.estado}</span></td>
              <td>{["PENDIENTE", "CONFIRMADA"].includes(r.estado) && <button className="peligro" onClick={() => cancelar(r.reserva_id)}>Cancelar</button>}</td>
            </tr>
          ))}
          {reservas.length === 0 && <tr><td colSpan="5" className="suave">Aún no tienes reservas.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
