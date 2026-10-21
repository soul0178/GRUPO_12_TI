import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { aISO, api, hora } from "../api";

// RNF-03: reservar en un máximo de 3 pasos -> 1) ítem, 2) horario, 3) confirmar
export default function ReservaPage() {
  const { itemId } = useParams();
  const [paso, setPaso] = useState(itemId ? 2 : 1);
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(itemId || "");
  const [fecha, setFecha] = useState("");
  const [desde, setDesde] = useState("10:00");
  const [hasta, setHasta] = useState("12:00");
  const [ocupadas, setOcupadas] = useState([]);
  const [error, setError] = useState("");
  const [hecha, setHecha] = useState(null);

  useEffect(() => {
    api.listarItems().then((l) => setItems(l.filter((i) => ["DISPONIBLE", "PRESTADO"].includes(i.disponibilidad)))).catch((e) => setError(e.message));
  }, []);

  // Al elegir día se muestran los horarios ya ocupados de ese ítem (RF-05)
  useEffect(() => {
    if (!sel || !fecha) { setOcupadas([]); return; }
    const fin = new Date(`${fecha}T00:00`); fin.setDate(fin.getDate() + 1);
    api.disponibilidad(sel, aISO(fecha, "00:00"), fin.toISOString()).then(setOcupadas).catch(() => setOcupadas([]));
  }, [sel, fecha]);

  const item = items.find((i) => i.item_id === sel);
  const hoy = new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD en hora local
  const horarioValido = fecha && desde && hasta && hasta > desde;

  async function confirmar() {
    setError("");
    try {
      setHecha(await api.reservar({ item_id: sel, inicio: aISO(fecha, desde), fin: aISO(fecha, hasta) }));
    } catch (e) {
      setError(e.message);
      if (e.status === 409) setPaso(2); // horario ocupado: volver a elegir
    }
  }

  if (hecha) {
    return (
      <div className="tarjeta">
        <h2>¡Reserva confirmada!</h2>
        <p>{item?.nombre} · {hora(hecha.inicio)} → {hora(hecha.fin)}</p>
        <Link to="/reservas">Ver mis reservas</Link>
      </div>
    );
  }

  return (
    <div className="tarjeta">
      <h2>Reservar</h2>
      <p className="suave">Paso {paso} de 3</p>
      {error && <p className="error">{error}</p>}

      {paso === 1 && (
        <>
          <label>Ítem
            <select value={sel} onChange={(e) => setSel(e.target.value)}>
              <option value="">Selecciona…</option>
              {items.map((i) => <option key={i.item_id} value={i.item_id}>{i.codigo} · {i.nombre}</option>)}
            </select>
          </label>
          <button disabled={!sel} onClick={() => setPaso(2)}>Siguiente</button>
        </>
      )}

      {paso === 2 && (
        <>
          <p><strong>{item?.nombre ?? "Ítem"}</strong></p>
          <label>Fecha<input type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
          <div className="fila-form">
            <label>Desde<input type="time" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
            <label>Hasta<input type="time" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
          </div>
          {fecha && (
            <div>
              <p className="suave">Horarios ya ocupados ese día:</p>
              {ocupadas.length === 0 ? <p className="ok">Todo el día libre</p> : (
                <ul>{ocupadas.map((o, k) => <li key={k}>{hora(o.inicio)} → {hora(o.fin)}</li>)}</ul>
              )}
            </div>
          )}
          {!horarioValido && fecha && <p className="error">La hora de fin debe ser posterior a la de inicio.</p>}
          <div className="fila-form">
            {!itemId && <button className="neutro" onClick={() => setPaso(1)}>Atrás</button>}
            <button disabled={!horarioValido} onClick={() => setPaso(3)}>Siguiente</button>
          </div>
        </>
      )}

      {paso === 3 && (
        <>
          <p>Vas a reservar <strong>{item?.nombre}</strong></p>
          <p>{fecha} de {desde} a {hasta}</p>
          <div className="fila-form">
            <button className="neutro" onClick={() => setPaso(2)}>Atrás</button>
            <button onClick={confirmar}>Confirmar reserva</button>
          </div>
        </>
      )}
    </div>
  );
}
