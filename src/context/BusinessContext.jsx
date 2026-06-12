// src/context/BusinessContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
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
    async function fetchBusiness() {
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

    fetchBusiness();
  }, [user, userRole]);

  function updateBusiness(updatedFields) {
    setBusiness((prev) => ({ ...prev, ...updatedFields }));
  }

  const value = {
    business,
    loading,
    error,
    updateBusiness,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}
