// Fix RLS policies for dozivetja and izdelki tables
// Uses a temporary SQL execution function approach
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nbopongqlewdlqxrfqsu.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ib3BvbmdxbGV3ZGxxeHJmcXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4NjQ0OCwiZXhwIjoyMDkxMjYyNDQ4fQ.iH3l1IxCh12l47iCKHUG7TN5iDgh75cukpse-ji__CU";

// Step 1: Create exec_sql function via REST
const createFnRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ sql: "SELECT 1" }),
});
console.log("exec_sql test:", createFnRes.status, await createFnRes.text());

// Step 2: Try pg_tle or another approach
// Actually let's create the function first via a different mechanism
const createFunctionSQL = `
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$BEGIN EXECUTE sql; END;$$;
`;

// Try creating function via direct pg connection using the DATABASE_URL approach
// First, let's try with the supabase postgres endpoint
const pgRes = await fetch(`${SUPABASE_URL}/pg/query`, {
  method: "POST",
  headers: {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "SELECT 1" }),
});
console.log("pg/query test:", pgRes.status, await pgRes.text());
