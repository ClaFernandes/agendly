import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

// Criação do contexto
const AuthContext = createContext();

// Hook personalizado para consumir contexto
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegistering = useRef(false);

  //Busca role do utilizador à tabela profiles através do id
  async function fetchRole(userId, retries = 5, delay = 500) {
    await new Promise((res) => setTimeout(res, 500));

    // Tenta buscar o role várias vezes, com um timeout para cada tentativa
    for (let i = 0; i < retries; i++) {
      console.log(`fetchRole tentativa ${i + 1} para userId:`, userId);

      // Promise para buscar o role, com timeout de 2 segundos
      const { data, error } = await Promise.race([
        supabase.from("profiles").select("role").eq("id", userId).single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 2000),
        ),
      ]).catch((err) => ({ data: null, error: err }));

      console.log(`fetchRole resultado ${i + 1}:`, data, error?.message);

      // Se encontrou o role, retorna
      if (data?.role) return data.role;

      // Se deu timeout ou outro erro, espera um pouco antes de tentar novamente
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    console.error("Erro ao buscar role após várias tentativas.");
    return null;
  }

  // Verifica a sessão atual e verifica mudanças de autenticação
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const role = await fetchRole(session.user.id);
        setUser(session.user);
        setUserRole(role);
      }
      setLoading(false);
    });

    // Verifica mudanças na autenticação (login/logout) e atualiza estado
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "onAuthStateChange disparou — event:",
        event,
        "user:",
        session?.user?.id,
      );

      if (isRegistering.current) return;

      if (session?.user) {
        let role = await fetchRole(session.user.id);

        // Primeiro login com Google — o perfil ainda não existe, então cria um novo com role "provider"
        if (!role) {
          console.log("Role null — a inserir perfil...");
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({ id: session.user.id, role: "provider" });
          console.log("Insert resultado:", insertError?.message);
          role = "provider";
        }

        setUser(session.user);
        setUserRole(role);
        console.log("AuthContext pronto — role:", role);
        setLoading(false);
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  //Login com email
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  //Registo de novo prestador
  // Função de registo
  async function register(email, password, fullName) {
    isRegistering.current = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (loginError) throw loginError;

      // Usa os dados do signInWithPassword diretamente para garantir o usuário logado
      const sessionUser = loginData?.user;
      console.log("register — sessionUser:", sessionUser?.id);

      if (sessionUser) {
        setUser(sessionUser);
        setUserRole("provider");
        setLoading(false);
      }

      return data;
    } finally {
      isRegistering.current = false;
    }
  }

  //Logout
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  //Recuperação de password
  async function recoverPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/agendly/update-password`,
    });
    if (error) throw error;
  }

  // Login/registo com Google
  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/agendly/dashboard`,
      },
    });
    if (error) throw error;
  }

  const value = {
    user,
    userRole,
    loading,
    login,
    register,
    logout,
    recoverPassword,
    loginWithGoogle,
  };

  // Renderiza o provedor de contexto
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
