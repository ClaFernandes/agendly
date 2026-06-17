// src/hooks/useAdmin.js

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useAdmin() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    topProvider: null,
  });

  const [businesses, setBusinesses] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [recentBusinesses, setRecentBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [businessRes, appointmentRes, serviceRes, adminRes, pendingRes] =
        await Promise.all([
          supabase.rpc("get_business_with_email"),
          supabase.from("appointments").select("id, business_id, status, service_id"),
          supabase.from("services").select("id, business_id, price"),
          supabase.rpc("get_admin_list"),
          supabase.rpc("get_pending_admins"),
        ]);

      if (businessRes.error) throw businessRes.error;
      const allBusinesses = businessRes.data || [];

      if (appointmentRes.error) throw appointmentRes.error;
      const allAppointments = appointmentRes.data || [];

      const allServices = serviceRes.data || [];

      // Mapa de preço por service_id
      const priceMap = {};
      allServices.forEach((s) => { priceMap[s.id] = Number(s.price ?? 0); });

      // Métricas por negócio
      const apptCountMap = {};
      const revenueMap = {};
      allAppointments.forEach((a) => {
        const bid = a.business_id;
        apptCountMap[bid] = (apptCountMap[bid] ?? 0) + 1;
        if (a.status === "concluido") {
          revenueMap[bid] = (revenueMap[bid] ?? 0) + (priceMap[a.service_id] ?? 0);
        }
      });

      // Junta métricas nos negócios
      const enriched = allBusinesses.map((b) => ({
        ...b,
        appointment_count: apptCountMap[b.id] ?? 0,
        revenue: revenueMap[b.id] ?? 0,
      }));

      setBusinesses(enriched);
      setRecentBusinesses(enriched.slice(0, 5));

      // Stats globais
      const totalRevenue = Object.values(revenueMap).reduce((s, v) => s + v, 0);
      const topProvider = enriched
        .filter((b) => b.is_active)
        .sort((a, b) => b.appointment_count - a.appointment_count)[0] ?? null;

      setStats({
        totalBusinesses: enriched.length,
        activeBusinesses: enriched.filter((b) => b.is_active).length,
        totalAppointments: allAppointments.length,
        totalRevenue,
        topProvider,
      });

      if (adminRes.error) { console.warn("get_admin_list:", adminRes.error.message); setAdmins([]); }
      else setAdmins(adminRes.data || []);

      if (pendingRes.error) { console.warn("get_pending_admins:", pendingRes.error.message); setPendingAdmins([]); }
      else setPendingAdmins(pendingRes.data || []);

    } catch (err) {
      setError(err.message || "Erro ao carregar dados do painel.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleBusinessActive(id, currentValue) {
    setSaving(true);
    const applyToggle = (list) =>
      list.map((b) => (b.id === id ? { ...b, is_active: !currentValue } : b));
    setBusinesses((prev) => applyToggle(prev));
    setRecentBusinesses((prev) => applyToggle(prev));

    const { error } = await supabase
      .from("business").update({ is_active: !currentValue }).eq("id", id);

    if (error) {
      const revert = (list) =>
        list.map((b) => (b.id === id ? { ...b, is_active: currentValue } : b));
      setBusinesses((prev) => revert(prev));
      setRecentBusinesses((prev) => revert(prev));
      setError(error.message); setSaving(false);
      return { success: false, error: error.message };
    }

    await supabase.from("profiles")
      .update({ status: currentValue ? "suspended" : "active" }).eq("id", id);

    setStats((prev) => ({
      ...prev,
      activeBusinesses: prev.activeBusinesses + (currentValue ? -1 : 1),
    }));
    setSaving(false);
    return { success: true };
  }

  async function updateBusiness(id, fields) {
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("business").update({
      name: fields.name, slug: fields.slug,
      phone: fields.phone || null, description: fields.description || null,
    }).eq("id", id);

    if (error) { setError(error.message); setSaving(false); return { success: false, error: error.message }; }

    setBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, ...fields } : b));
    setRecentBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, ...fields } : b));
    setSaving(false);
    return { success: true };
  }

  async function sendPasswordReset(email) {
    if (!email) return { success: false, error: "Email não encontrado." };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async function deleteBusiness(id) {
    setSaving(true); setError(null);
    try {
      await supabase.from("client_favorites").delete().eq("business_id", id);
      await supabase.from("appointments").delete().eq("business_id", id);
      await supabase.from("working_hours").delete().eq("business_id", id);
      await supabase.from("services").delete().eq("business_id", id);
      await supabase.from("business").delete().eq("id", id);
      await supabase.from("profiles").delete().eq("id", id);
      const { error: rpcError } = await supabase.rpc("delete_user_by_id", { user_id: id });
      if (rpcError) throw rpcError;

      setBusinesses((prev) => prev.filter((b) => b.id !== id));
      setRecentBusinesses((prev) => prev.filter((b) => b.id !== id));
      setStats((prev) => ({
        ...prev,
        totalBusinesses: prev.totalBusinesses - 1,
        activeBusinesses: prev.activeBusinesses - 1,
      }));
      setSaving(false);
      return { success: true };
    } catch (err) {
      setError(err.message); setSaving(false);
      return { success: false, error: err.message };
    }
  }

  async function removeAdmin(userId) {
    setSaving(true);
    await supabase.from("profiles").delete().eq("id", userId);
    const { error } = await supabase.rpc("delete_user_by_id", { user_id: userId });
    if (error) { setError(error.message); setSaving(false); return { success: false }; }
    setAdmins((prev) => prev.filter((a) => a.id !== userId));
    setSaving(false); return { success: true };
  }

  async function approveAdmin(userId) {
    setSaving(true);
    const { error } = await supabase.rpc("approve_admin", { user_id: userId });
    if (error) { setError(error.message); setSaving(false); return { success: false }; }
    setPendingAdmins((prev) => prev.filter((a) => a.id !== userId));
    const { data } = await supabase.rpc("get_admin_list");
    if (data) setAdmins(data);
    setSaving(false); return { success: true };
  }

  async function rejectAdmin(userId) {
    setSaving(true);
    await supabase.from("profiles").delete().eq("id", userId);
    const { error } = await supabase.rpc("delete_user_by_id", { user_id: userId });
    if (error) { setError(error.message); setSaving(false); return { success: false }; }
    setPendingAdmins((prev) => prev.filter((a) => a.id !== userId));
    setSaving(false); return { success: true };
  }

  return {
    stats, businesses, recentBusinesses, admins, pendingAdmins,
    loading, error, saving,
    toggleBusinessActive, updateBusiness, deleteBusiness,
    sendPasswordReset, removeAdmin, approveAdmin, rejectAdmin,
    refetch: load,
  };
}
