// src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // 'active' | 'pending' | 'rejected'
  const [loading, setLoading] = useState(true);
  const isRegistering = useRef(false);
  const justSignedOut = useRef(false);

  const APP_BASE = `${window.location.origin}/agendly`;

  // Vai buscar o role e o status do utilizador à tabela profiles
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("fetchProfile:", error.message);
      return null;
    }

    return data ?? null;
  }

  // Garante que o perfil existe — cria com role "provider" e status "active" se não existir
  async function ensureProfile(userId) {
    const profile = await fetchProfile(userId);
    if (profile) return profile;

    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: userId, role: "provider", status: "active" })
      .select("role, status")
      .single();

    if (error) {
      return { role: "provider", status: "active" };
    }

    return data ?? { role: "provider", status: "active" };
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (window.location.pathname.includes("update-password")) {
        setLoading(false);
        return;
      }

      try {
        if (session?.user) {
          const profile = await ensureProfile(session.user.id);
          setUser(session.user);
          setUserRole(profile?.role ?? "provider");
          setUserStatus(profile?.status ?? "active");
        }
      } catch (error) {
        console.error("Erro ao inicializar sessão:", error);
      } finally {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isRegistering.current) return;

      if (event === "SIGNED_OUT") {
        justSignedOut.current = true;
        setUser(null);
        setUserRole(null);
        setUserStatus(null);
        setLoading(false);
        return;
      }

      if (window.location.pathname.includes("update-password")) return;

      if (event === "SIGNED_IN" && justSignedOut.current) {
        justSignedOut.current = false;
        return;
      }

      justSignedOut.current = false;

      try {
        if (session?.user) {
          const profile = await ensureProfile(session.user.id);
          setUser(session.user);
          setUserRole(profile?.role ?? "provider");
          setUserStatus(profile?.status ?? "active");
        } else {
          setUser(null);
          setUserRole(null);
          setUserStatus(null);
        }
      } catch (error) {
        console.error("Erro no onAuthStateChange:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (sessionUser) {
        const profile = await ensureProfile(sessionUser.id);
        setUser(sessionUser);
        setUserRole(profile?.role ?? "provider");
        setUserStatus(profile?.status ?? "active");
        setLoading(false);
      }

      return data;
    } finally {
      isRegistering.current = false;
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  }

  async function recoverPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_BASE}/update-password`,
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

  const value = useMemo(
    () => ({
      user,
      userRole,
      userStatus,
      loading,
      login,
      register,
      logout,
      recoverPassword,
      loginWithGoogle,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, userRole, userStatus, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
