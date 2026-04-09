import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nbopongqlewdlqxrfqsu.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ib3BvbmdxbGV3ZGxxeHJmcXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4NjQ0OCwiZXhwIjoyMDkxMjYyNDQ4fQ.iH3l1IxCh12l47iCKHUG7TN5iDgh75cukpse-ji__CU";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const EMAIL = "admin@nakmetiji.si";
const PASSWORD = "Admin1234!";

// Preveri če že obstaja
const { data: existing } = await supabase.auth.admin.listUsers();
const found = existing?.users?.find(u => u.email === EMAIL);

let adminId;

if (found) {
  console.log("ℹ️  Admin že obstaja:", found.id);
  adminId = found.id;
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { ime: "Super Admin", vloga: "super_admin" },
  });
  if (error) { console.error("❌ Napaka:", error.message); process.exit(1); }
  adminId = data.user.id;
  console.log("✅ Admin ustvarjen:", adminId);
}

// Nastavi vloga = super_admin v profili
const { error: profErr } = await supabase.from("profili").upsert({
  id: adminId,
  email: EMAIL,
  ime: "Super Admin",
  vloga: "super_admin",
});

if (profErr) {
  console.error("❌ Napaka pri profilu:", profErr.message);
} else {
  console.log(`✅ Profil posodobljen: super_admin`);
  console.log(`\n📋 Admin kredenciali:`);
  console.log(`   Email:  ${EMAIL}`);
  console.log(`   Geslo:  ${PASSWORD}`);
}
