// src/hooks/useRealtime.js

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

/**
 * @param {string} businessId - ID do negócio a monitorizar
 * @param {Function} onUpdate - callback chamado quando há alterações
 *
 * Uso:
 *   useRealtime(business?.id, () => refetch());
 */

export function useRealtime(businessId, onUpdate) {
  // Ref para guardar o canal e poder cancelar a subscrição no cleanup
  const channelRef = useRef(null);

  useEffect(() => {
    // Não cria subscrição se não houver negócio
    if (!businessId) return;

    // Cria um canal único por negócio para evitar subscrições duplicadas
    const channel = supabase
      .channel(`appointments:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "appointments",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          // Chama o callback com o evento e o registo alterado
          // O componente pai decide o que fazer (ex: refetch, update local)
          if (typeof onUpdate === "function") {
            onUpdate(payload);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Cancela a subscrição quando o componente desmonta ou o businessId muda
    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, onUpdate]);
}
