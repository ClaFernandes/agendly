// src/App.jsx
import AppRoutes from "./routes/AppRoutes"; // ou o caminho correto do teu ficheiro
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;