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
  const [loading, setLoading] = useState(true);
  const isRegistering = useRef(false);
  const justSignedOut = useRef(false);

  async function fetchRole(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("fetchRole:", error.message);
      return null;
    }

    return data?.role ?? null;
  }

  async function ensureProfileRole(userId) {
    const role = await fetchRole(userId);
    if (role) return role;

    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: userId, role: "provider" })
      .select("role")
      .single();

    if (error) {
      console.error("ensureProfileRole:", error.message);
      return "provider"; // Fallback seguro
    }

    return data?.role ?? "provider";
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Pode apagar os console depois
      console.log("HASH:", window.location.hash);
      console.log("SEARCH:", window.location.search);
      console.log("HREF:", window.location.href);

      if (window.location.pathname.includes("update-password")) {
        setLoading(false);
        return;
      }

      try {
        if (session?.user) {
          const role = await ensureProfileRole(session.user.id);
          setUser(session.user);
          setUserRole(role || "provider");
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
          const role = await ensureProfileRole(session.user.id);
          setUser(session.user);
          setUserRole(role || "provider");
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Erro no onAuthStateChange:", error);
      } finally {
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

      if (sessionUser) {
        const role = await ensureProfileRole(sessionUser.id);
        setUser(sessionUser);
        setUserRole(role ?? "provider");
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

  const value = useMemo(
    () => ({
      user,
      userRole,
      loading,
      login,
      register,
      logout,
      recoverPassword,
      loginWithGoogle,
    }),
    [user, userRole, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
