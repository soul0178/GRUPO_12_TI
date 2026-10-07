import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import RutaProtegida from "./components/RutaProtegida";
import LoginPage from "./pages/LoginPage";
import PanelAdminPage from "./pages/PanelAdminPage";
import PerfilPage from "./pages/PerfilPage";
import RegistroPage from "./pages/RegistroPage";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/perfil" element={<RutaProtegida><PerfilPage /></RutaProtegida>} />
          {/* Ruta protegida por rol: un estudiante verá la pantalla 403 */}
          <Route path="/admin" element={<RutaProtegida roles={["ADMINISTRADOR_SISTEMA"]}><PanelAdminPage /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/perfil" replace />} />
        </Routes>
      </main>
    </>
  );
}
