// src/hooks/useAdmin.js

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useAdmin() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalAppointments: 0,
  });

  const [businesses, setBusinesses] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [recentBusinesses, setRecentBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [businessRes, appointmentRes, adminRes, pendingRes] =
          await Promise.all([
            supabase
              .from("business")
              .select("id, name, slug, is_active, created_at")
              .order("created_at", { ascending: false }),
            supabase.from("appointments").select("id, starts_at, status"),
            supabase.rpc("get_admin_list"),
            supabase.rpc("get_pending_admins"),
          ]);

        if (businessRes.error) throw businessRes.error;
        const allBusinesses = businessRes.data || [];
        setBusinesses(allBusinesses);
        setRecentBusinesses(allBusinesses.slice(0, 5));

        if (appointmentRes.error) throw appointmentRes.error;
        setStats({
          totalBusinesses: allBusinesses.length,
          activeBusinesses: allBusinesses.filter((b) => b.is_active).length,
          totalAppointments: (appointmentRes.data || []).length,
        });

        if (adminRes.error) {
          console.warn("RPC get_admin_list não encontrada:", adminRes.error.message);
          setAdmins([]);
        } else {
          setAdmins(adminRes.data || []);
        }

        if (pendingRes.error) {
          console.warn("RPC get_pending_admins não encontrada:", pendingRes.error.message);
          setPendingAdmins([]);
        } else {
          setPendingAdmins(pendingRes.data || []);
        }
      } catch (err) {
        setError(err.message || "Erro ao carregar dados do painel.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function toggleBusinessActive(id, currentValue) {
    setSaving(true);

    const applyToggle = (list) =>
      list.map((b) => (b.id === id ? { ...b, is_active: !currentValue } : b));

    setBusinesses((prev) => applyToggle(prev));
    setRecentBusinesses((prev) => applyToggle(prev));

    const { error } = await supabase
      .from("business")
      .update({ is_active: !currentValue })
      .eq("id", id);

    if (error) {
      const revert = (list) =>
        list.map((b) => (b.id === id ? { ...b, is_active: currentValue } : b));
      setBusinesses((prev) => revert(prev));
      setRecentBusinesses((prev) => revert(prev));
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    // Atualiza activeBusinesses após toggle
    setStats((prev) => ({
      ...prev,
      activeBusinesses: prev.activeBusinesses + (currentValue ? -1 : 1),
    }));

    setSaving(false);
    return { success: true };
  }

  async function removeAdmin(userId) {
    setSaving(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.warn("Erro ao apagar profile:", profileError.message);
    }

    const { error: rpcError } = await supabase.rpc("delete_user_by_id", {
      user_id: userId,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSaving(false);
      return { success: false, error: rpcError.message };
    }

    setAdmins((prev) => prev.filter((a) => a.id !== userId));
    setSaving(false);
    return { success: true };
  }

  async function approveAdmin(userId) {
    setSaving(true);

    const { error } = await supabase.rpc("approve_admin", {
      user_id: userId,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    setPendingAdmins((prev) => prev.filter((a) => a.id !== userId));

    const { data: adminData } = await supabase.rpc("get_admin_list");
    if (adminData) setAdmins(adminData);

    setSaving(false);
    return { success: true };
  }

  async function rejectAdmin(userId) {
    setSaving(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.warn("Erro ao apagar profile:", profileError.message);
    }

    const { error: rpcError } = await supabase.rpc("delete_user_by_id", {
      user_id: userId,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSaving(false);
      return { success: false, error: rpcError.message };
    }

    setPendingAdmins((prev) => prev.filter((a) => a.id !== userId));
    setSaving(false);
    return { success: true };
  }

  return {
    stats,
    businesses,
    recentBusinesses,
    admins,
    pendingAdmins,
    loading,
    error,
    saving,
    toggleBusinessActive,
    removeAdmin,
    approveAdmin,
    rejectAdmin,
  };
}