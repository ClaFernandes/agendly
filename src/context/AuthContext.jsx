// src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutos

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegistering = useRef(false);
  const justSignedOut = useRef(false);
  const inactivityTimer = useRef(null);

  const APP_BASE = `${window.location.origin}/agendly`;

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

  // Faz logout por inatividade 
  const logoutDueToInactivity = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Erro no logout por inatividade:", e);
    } finally {
      setUser(null);
      setUserRole(null);
      setUserStatus(null);
    }
  }, []);

  // Reinicia o timer a cada chamada
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(logoutDueToInactivity, INACTIVITY_TIMEOUT);
  }, [logoutDueToInactivity]);

  // Ativa/desativa os listeners de atividade 
  useEffect(() => {
    if (!user) {
      // Utilizador não autenticado — limpa timer e não regista eventos
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      return;
    }

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    events.forEach((e) => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer(); // arranca o timer ao fazer login

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [user, resetInactivityTimer]);

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
    } = supabase.auth.onAuthStateChange((event, session) => {
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

      // O supabase-js mantém um lock interno enquanto este callback corre.
      // Fazer await a queries à BD aqui dentro (que precisam do token de
      // sessão) provoca deadlock e a app fica presa em "A carregar..." ao
      // recarregar a página. Adiamos o trabalho com setTimeout para libertar
      // o lock antes de carregar o perfil.
      setTimeout(async () => {
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
      }, 0);
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, userRole, userStatus, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}