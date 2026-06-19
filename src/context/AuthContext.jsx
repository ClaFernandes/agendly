// src/context/AuthContext.jsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutos
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
const DEFAULT_PROFILE = { role: "provider", status: "active" };

const isUpdatePasswordRoute = () =>
  window.location.pathname.includes("update-password");

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Guards de fluxo de autenticação
  const isRegistering = useRef(false);
  const justSignedOut = useRef(false);
  const inactivityTimer = useRef(null);
  const isMounted = useRef(true);

  const APP_BASE = `${window.location.origin}/agendly`;

  // --- Helpers de estado ------------------------------------------------

  // Atualiza o estado apenas enquanto o componente está montado,
  // evitando avisos de "set state on unmounted component".
  const applyAuthState = useCallback((sessionUser, profile) => {
    if (!isMounted.current) return;
    setUser(sessionUser);
    setUserRole(profile?.role ?? DEFAULT_PROFILE.role);
    setUserStatus(profile?.status ?? DEFAULT_PROFILE.status);
  }, []);

  const clearAuthState = useCallback(() => {
    if (!isMounted.current) return;
    setUser(null);
    setUserRole(null);
    setUserStatus(null);
  }, []);

  // --- Perfil -----------------------------------------------------------

  const fetchProfile = useCallback(async (userId) => {
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
  }, []);

  const ensureProfile = useCallback(
    async (userId) => {
      const existing = await fetchProfile(userId);
      if (existing) return existing;

      const { data, error } = await supabase
        .from("profiles")
        .insert({ id: userId, ...DEFAULT_PROFILE })
        .select("role, status")
        .single();

      if (error) {
        console.error("ensureProfile:", error.message);
        return DEFAULT_PROFILE;
      }

      return data ?? DEFAULT_PROFILE;
    },
    [fetchProfile],
  );

  // Carrega o perfil da sessão e aplica-o ao estado.
  const loadSessionProfile = useCallback(
    async (sessionUser) => {
      if (!sessionUser) {
        clearAuthState();
        return;
      }
      const profile = await ensureProfile(sessionUser.id);
      applyAuthState(sessionUser, profile);
    },
    [ensureProfile, applyAuthState, clearAuthState],
  );

  // --- Inatividade ------------------------------------------------------

  const logoutDueToInactivity = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro no logout por inatividade:", error);
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(logoutDueToInactivity, INACTIVITY_TIMEOUT);
  }, [logoutDueToInactivity]);

  // Regista os listeners de atividade enquanto houver utilizador autenticado.
  useEffect(() => {
    if (!user) {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      return;
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer, { passive: true }),
    );
    resetInactivityTimer(); // arranca o timer ao autenticar

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer),
      );
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    };
  }, [user, resetInactivityTimer]);

  // --- Inicialização da sessão + listener do Supabase -------------------

  useEffect(() => {
    isMounted.current = true;

    const initSession = async () => {
      if (isUpdatePasswordRoute()) {
        if (isMounted.current) setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await loadSessionProfile(session?.user ?? null);
      } catch (error) {
        console.error("Erro ao inicializar sessão:", error);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    initSession();

    // O callback é mantido síncrono de propósito: o supabase-js detém um lock
    // interno enquanto este callback corre, por isso fazer await a queries à BD
    // aqui dentro (que precisam do token de sessão) provoca deadlock — a app fica
    // presa em "loading" ao recarregar a página. Adiamos o trabalho com setTimeout
    // para que o lock seja libertado antes de carregarmos o perfil.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignora eventos disparados durante o registo manual.
      if (isRegistering.current) return;

      if (event === "SIGNED_OUT") {
        justSignedOut.current = true;
        clearAuthState();
        if (isMounted.current) setLoading(false);
        return;
      }

      if (isUpdatePasswordRoute()) return;

      // Evita reprocessar o SIGNED_IN imediato após um logout.
      if (event === "SIGNED_IN" && justSignedOut.current) {
        justSignedOut.current = false;
        return;
      }
      justSignedOut.current = false;

      setTimeout(async () => {
        try {
          await loadSessionProfile(session?.user ?? null);
        } catch (error) {
          console.error("Erro no onAuthStateChange:", error);
        } finally {
          if (isMounted.current) setLoading(false);
        }
      }, 0);
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [loadSessionProfile, clearAuthState]);

  // --- Ações de autenticação --------------------------------------------

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const register = useCallback(
    async (email, password, fullName) => {
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

        if (loginData?.user) {
          await loadSessionProfile(loginData.user);
          if (isMounted.current) setLoading(false);
        }

        return data;
      } finally {
        isRegistering.current = false;
      }
    },
    [loadSessionProfile],
  );

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  }, []);

  const recoverPassword = useCallback(
    async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_BASE}/update-password`,
      });
      if (error) throw error;
    },
    [APP_BASE],
  );

  // --- Valor do contexto ------------------------------------------------

  const value = useMemo(
    () => ({
      user,
      userRole,
      userStatus,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      recoverPassword,
    }),
    [user, userRole, userStatus, loading, login, register, logout, recoverPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
