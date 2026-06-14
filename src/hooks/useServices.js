// src/hooks/useServices.js
// CRUD de serviços

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useBusiness } from "../context/BusinessContext";

export function useServices() {
  const { business } = useBusiness();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Carrega os serviços sempre que o business.id mudar
  useEffect(() => {
    async function load() {
      // Sai se não houver negócio — garante que loading fica false
      if (!business?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", business.id)
        // Destaques primeiro, depois por ordem de criação
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setServices(data || []);
      }

      setLoading(false);
    }

    load();
  }, [business?.id]); // Só re-dispara se o ID do negócio mudar

  // Fetch manual
  async function fetchServices() {
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
  }

  // Cria um serviço novo e recarrega a lista
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

    // Recarrega a lista para incluir o novo serviço com o ID gerado pela DB
    await fetchServices();
    setSaving(false);
    return { success: true };
  }

  // Atualiza um serviço existente e aplica as mudanças localmente
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

    // Atualiza localmente sem re-fetch
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

  // Apaga um serviço e remove da lista local
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

    // Remove localmente sem recarregar toda a lista
    setServices((prev) => prev.filter((s) => s.id !== id));
    setSaving(false);
    return { success: true };
  }

  // Alterna destaque (is_featured)
  async function toggleFeatured(id, current) {
    setSaving(true);

    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_featured: !current } : s)),
    );

    const { error } = await supabase
      .from("services")
      .update({ is_featured: !current })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      // Reverte se a DB falhar
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

    // Optimistic: aplica antes de confirmar na DB
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !current } : s)),
    );

    const { error } = await supabase
      .from("services")
      .update({ active: !current })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      // Reverte se a DB falhar
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
    refetch: fetchServices,
  };
}
