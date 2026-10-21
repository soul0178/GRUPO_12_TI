import { useEffect, useState } from "react";
import { api } from "../api";

const TIPOS = ["LIBRO", "EQUIPO", "OBJETO"];
const ESTADOS = ["BUENO", "REGULAR", "DANADO"];
const VACIO = { codigo: "", nombre: "", tipo: "EQUIPO", estado_fisico: "BUENO", descripcion: "" };

export default function AdminItemsPage() {
  const [items, setItems] = useState([]);
  const [f, setF] = useState(VACIO);
  const [editando, setEditando] = useState(null); // item_id en edición o null (alta)
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const cambiar = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  const cargar = () => api.listarItemsAdmin().then(setItems).catch((e) => setMensaje({ tipo: "error", texto: e.message }));
  useEffect(() => { cargar(); }, []);

  async function ejecutar(accion, textoOk) {
    setMensaje({ tipo: "", texto: "" });
    try {
      await accion();
      setMensaje({ tipo: "ok", texto: textoOk });
      await cargar();
    } catch (e) {
      setMensaje({ tipo: "error", texto: e.message });
    }
  }

  async function guardar(e) {
    e.preventDefault();
    const { codigo, nombre, tipo, estado_fisico, descripcion } = f;
    await ejecutar(
      () => (editando ? api.modificarItem(editando, { nombre, tipo, descripcion }) : api.altaItem({ codigo, nombre, tipo, estado_fisico, descripcion })),
      editando ? "Ítem actualizado" : "Ítem registrado"
    );
    setF(VACIO);
    setEditando(null);
  }

  function editar(i) {
    setEditando(i.item_id);
    setF({ codigo: i.codigo, nombre: i.nombre, tipo: i.tipo, estado_fisico: i.estado_fisico_actual, descripcion: i.descripcion });
  }

  const baja = (i) => window.confirm(`¿Dar de baja "${i.nombre}"? Esta acción no se puede deshacer.`) && ejecutar(() => api.bajaItem(i.item_id), "Ítem dado de baja");

  return (
    <div className="tarjeta ancha">
      <h2>Panel de administración · Inventario</h2>
      <form className="fila-form" onSubmit={guardar}>
        <label>Código<input value={f.codigo} onChange={cambiar("codigo")} disabled={!!editando} required /></label>
        <label>Nombre<input value={f.nombre} onChange={cambiar("nombre")} required /></label>
        <label>Tipo<select value={f.tipo} onChange={cambiar("tipo")}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></label>
        {!editando && <label>Estado físico<select value={f.estado_fisico} onChange={cambiar("estado_fisico")}>{ESTADOS.map((t) => <option key={t}>{t}</option>)}</select></label>}
        <label>Descripción<input value={f.descripcion} onChange={cambiar("descripcion")} /></label>
        <button type="submit">{editando ? "Guardar cambios" : "Agregar ítem"}</button>
        {editando && <button type="button" className="neutro" onClick={() => { setEditando(null); setF(VACIO); }}>Cancelar</button>}
      </form>
      {mensaje.texto && <p className={mensaje.tipo}>{mensaje.texto}</p>}
      <table>
        <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Estado físico</th><th>Disponibilidad</th><th>Acciones</th></tr></thead>
        <tbody>
          {items.map((i) => {
            const deBaja = i.disponibilidad === "DADO_DE_BAJA";
            return (
              <tr key={i.item_id} className={deBaja ? "apagada" : ""}>
                <td>{i.codigo}</td><td>{i.nombre}</td><td>{i.tipo}</td>
                <td>
                  <select value={i.estado_fisico_actual} disabled={deBaja}
                    onChange={(e) => ejecutar(() => api.estadoFisico(i.item_id, e.target.value), "Estado físico actualizado")}>
                    {ESTADOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td><span className={`insignia ${i.disponibilidad}`}>{i.disponibilidad}</span></td>
                <td className="acciones">
                  <button className="neutro" disabled={deBaja} onClick={() => editar(i)}>Editar</button>
                  <button className="peligro" disabled={deBaja} onClick={() => baja(i)}>Dar de baja</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
