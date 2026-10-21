import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import RutaProtegida from "./components/RutaProtegida";
import AdminItemsPage from "./pages/AdminItemsPage";
import CatalogoPage from "./pages/CatalogoPage";
import LoginPage from "./pages/LoginPage";
import MisReservasPage from "./pages/MisReservasPage";
import PanelAdminPage from "./pages/PanelAdminPage";
import PerfilPage from "./pages/PerfilPage";
import RegistroPage from "./pages/RegistroPage";
import ReservaPage from "./pages/ReservaPage";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/perfil" element={<RutaProtegida><PerfilPage /></RutaProtegida>} />
          <Route path="/catalogo" element={<RutaProtegida><CatalogoPage /></RutaProtegida>} />
          <Route path="/reservar" element={<RutaProtegida><ReservaPage /></RutaProtegida>} />
          <Route path="/reservar/:itemId" element={<RutaProtegida><ReservaPage /></RutaProtegida>} />
          <Route path="/reservas" element={<RutaProtegida><MisReservasPage /></RutaProtegida>} />
          {/* Ruta protegida por rol: un estudiante verá la pantalla 403 */}
          <Route path="/admin" element={<RutaProtegida roles={["ADMINISTRADOR_SISTEMA"]}><PanelAdminPage /></RutaProtegida>} />
          <Route path="/admin/inventario" element={<RutaProtegida roles={["ADMINISTRADOR_SISTEMA"]}><AdminItemsPage /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/perfil" replace />} />
        </Routes>
      </main>
    </>
  );
}
