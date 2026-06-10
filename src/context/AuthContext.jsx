import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegistering = useRef(false);

  async function fetchRole(userId, retries = 5, delay = 500) {
    await new Promise((res) => setTimeout(res, 500));

    for (let i = 0; i < retries; i++) {
      console.log(`fetchRole tentativa ${i + 1} para userId:`, userId);

      const { data, error } = await Promise.race([
        supabase.from("profiles").select("role").eq("id", userId).single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 2000),
        ),
      ]).catch((err) => ({ data: null, error: err }));

      console.log(`fetchRole resultado ${i + 1}:`, data, error?.message);

      if (data?.role) return data.role;

      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    console.error("Erro ao buscar role após várias tentativas.");
    return null;
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // 🔴 Durante recovery, não processar sessão —
      // o UpdatePassword.jsx gere isto diretamente
      if (window.location.pathname.includes("update-password")) {
        setLoading(false);
        return;
      }

      if (session?.user) {
        const role = await fetchRole(session.user.id);
        setUser(session.user);
        setUserRole(role);
      }
      setLoading(false);
    });

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

      // 🔴 Durante recovery, ignorar completamente —
      // o UpdatePassword.jsx gere a sessão diretamente
      if (
        event === "PASSWORD_RECOVERY" ||
        event === "USER_UPDATED" ||
        (event === "SIGNED_IN" &&
          window.location.pathname.includes("update-password"))
      )
        return;

      if (session?.user) {
        let role = await fetchRole(session.user.id);

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

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

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
        await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;

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

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function recoverPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/agendly/update-password`,
    });
    if (error) throw error;
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/agendly/register`,
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
