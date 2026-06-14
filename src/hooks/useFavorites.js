// src/hooks/useFavorites.js

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useBusiness } from "../context/BusinessContext";

export function useFavorites() {
  const { business } = useBusiness();

  // Set de emails favoritos
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carrega os favoritos quando o negócio estiver disponível
  useEffect(() => {
    async function load() {
      if (!business?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("client_favorites")
        .select("client_email")
        .eq("business_id", business.id);

      if (error) {
        setError(error.message);
      } else {
        setFavorites(new Set((data || []).map((f) => f.client_email)));
      }

      setLoading(false);
    }

    load();
  }, [business?.id]);

  async function fetchFavorites() {
    if (!business?.id) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("client_favorites")
      .select("client_email")
      .eq("business_id", business.id);

    if (error) {
      setError(error.message);
    } else {
      setFavorites(new Set((data || []).map((f) => f.client_email)));
    }

    setLoading(false);
  }

  // Verifica se um cliente é favorito
  function isFavorite(clientEmail) {
    return favorites.has(clientEmail);
  }

  // Alterna o estado de favorito — adiciona ou remove
  async function toggleFavorite(clientEmail) {
    if (!business?.id || !clientEmail) return;

    const alreadyFavorite = favorites.has(clientEmail);

    // Optimistic update — aplica antes de confirmar na DB
    setFavorites((prev) => {
      const next = new Set(prev);
      if (alreadyFavorite) {
        next.delete(clientEmail);
      } else {
        next.add(clientEmail);
      }
      return next;
    });

    if (alreadyFavorite) {
      // Remove o favorito
      const { error } = await supabase
        .from("client_favorites")
        .delete()
        .eq("business_id", business.id)
        .eq("client_email", clientEmail);

      if (error) {
        // Reverte se falhar
        setFavorites((prev) => {
          const next = new Set(prev);
          next.add(clientEmail);
          return next;
        });
        setError(error.message);
        return { success: false };
      }
    } else {
      // Adiciona o favorito
      const { error } = await supabase
        .from("client_favorites")
        .insert({ business_id: business.id, client_email: clientEmail });

      if (error) {
        // Reverte se falhar
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(clientEmail);
          return next;
        });
        setError(error.message);
        return { success: false };
      }
    }

    return { success: true };
  }

  return {
    favorites,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
}
