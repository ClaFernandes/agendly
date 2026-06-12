// src/hooks/useServices.js
// Centraliza toda a lógica de CRUD de serviços

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useBusiness } from "../context/BusinessContext";

export function useServices() {
  const { business } = useBusiness();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Carrega todos os serviços do negócio ordenados por destaque e data de criação
  const fetchServices = useCallback(async () => {
    if (!business?.id) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setServices(data || []);
    }

    setLoading(false);
  }, [business?.id]);

  // Carrega quando o business estiver disponível
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Cria serviço novo
  async function createService(fields) {
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("services").insert({
      business_id: business.id,
      name: fields.name,
      description: fields.description || null,
      duration_min: Number(fields.duration_min),
      price: Number(fields.price),
      active: true,
      is_featured: false,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    await fetchServices();
    setSaving(false);
    return { success: true };
  }

  // Atualiza serviço existente
  async function updateService(id, fields) {
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("services")
      .update({
        name: fields.name,
        description: fields.description || null,
        duration_min: Number(fields.duration_min),
        price: Number(fields.price),
        active: fields.active,
      })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    // Atualiza localmente
    setServices((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...fields,
              duration_min: Number(fields.duration_min),
              price: Number(fields.price),
            }
          : s,
      ),
    );

    setSaving(false);
    return { success: true };
  }

  // Apagar serviço
  async function deleteService(id) {
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    // Remove localmente sem recarregar
    setServices((prev) => prev.filter((s) => s.id !== id));
    setSaving(false);
    return { success: true };
  }

  // Alternar destaque (is_featured) com optimistic update
  async function toggleFeatured(id, current) {
    setSaving(true);

    // Optimistic update
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_featured: !current } : s)),
    );

    const { error } = await supabase
      .from("services")
      .update({ is_featured: !current })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      // Reverte se falhar
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_featured: current } : s)),
      );
      setError(error.message);
    }

    setSaving(false);
  }

  // Alterna ativo/inativo com optimistic update
  async function toggleActive(id, current) {
    setSaving(true);

    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !current } : s)),
    );

    const { error } = await supabase
      .from("services")
      .update({ active: !current })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: current } : s)),
      );
      setError(error.message);
    }

    setSaving(false);
  }

  return {
    services,
    loading,
    error,
    saving,
    createService,
    updateService,
    deleteService,
    toggleFeatured,
    toggleActive,
  };
}
