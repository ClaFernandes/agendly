import { createContext, useContext, useEffect, useState } from "react";
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

  //Busca role do utilizador à tabela profiles através do id
  async function fetchRole(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Erro ao buscar role:", error.message);
      return null;
    }
    return data.role;
  }

  // Verifica se há sessão ativa e remove loading depois de verificar
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
      if (session?.user) {
        let role = await fetchRole(session.user.id);

        // Primeiro login com Google — o perfil ainda não existe, então cria um novo com role "provider"
        if (!role) {
          await supabase
            .from("profiles")
            .insert({ id: session.user.id, role: "provider" });
          role = "provider";
        }

        setUser(session.user);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
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
  async function register(email, password, firstName, lastName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });
    if (error) throw error;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, role: "provider" });

    if (profileError) throw profileError;

    return data;
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
