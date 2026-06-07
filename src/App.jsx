import { AuthProvider } from "./context/AuthContext";
import { BusinessProvider } from "./context/BusinessContext";
import AppRoutes from "./routes/AppRoutes";

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
