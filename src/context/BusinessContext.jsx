// src/context/BusinessContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const BusinessContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useBusiness() {
  return useContext(BusinessContext);
}

export function BusinessProvider({ children }) {
  const { user, userRole } = useAuth();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user || userRole !== "provider") {
        setBusiness(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("business")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") {
          setBusiness(null);
        } else {
          console.error("Erro ao carregar negócio:", error.message);
          setError(error.message);
        }
      } else {
        setBusiness(data);
      }

      setLoading(false);
    }

    load();
  }, [user, userRole]);

  const refresh = useCallback(async () => {
    if (!user || userRole !== "provider") return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("business")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        setBusiness(null);
      } else {
        setError(error.message);
      }
    } else {
      setBusiness(data);
    }

    setLoading(false);
  }, [user, userRole]);

  // Memorizar a função de update para não mudar a referência
  const updateBusiness = useCallback((updatedFields) => {
    setBusiness((prev) => ({ ...prev, ...updatedFields }));
  }, []);

  // Memorizar o objeto do valor do Contexto
  const contextValue = useMemo(() => ({
    business,
    loading,
    error,
    updateBusiness,
    refresh
  }), [business, loading, error, updateBusiness, refresh]);

  return (
    <BusinessContext.Provider
      value={{ business, loading, error, updateBusiness, refresh }}
    >
      {children}
    </BusinessContext.Provider>
  );
}
