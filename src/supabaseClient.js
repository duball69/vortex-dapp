// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Retrieve environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
}

// Create a single supabase client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
