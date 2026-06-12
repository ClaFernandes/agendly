// src/lib/supabase.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hashParams = new URLSearchParams(window.location.hash.substring(1));
export const recoveryParams = {
  accessToken: hashParams.get("access_token"),
  refreshToken: hashParams.get("refresh_token"),
  type: hashParams.get("type"),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
