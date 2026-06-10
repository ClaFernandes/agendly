import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { BusinessProvider } from "./context/BusinessContext";

function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <AppRoutes />
      </BusinessProvider>
    </AuthProvider>
  );
}

export default App;
