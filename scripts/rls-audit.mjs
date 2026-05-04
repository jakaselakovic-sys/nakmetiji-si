import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src/db", "supabase/migrations"];
const privateTables = ["rezervacije", "profili", "subscriptions", "green_stamps", "oracle_logs", "napake_log"];
const dangerous = [
  /on\s+(?:public\.)?(rezervacije|profili|subscriptions|green_stamps|oracle_logs|napake_log)[\s\S]{0,240}for\s+select[\s\S]{0,240}using\s*\(\s*true\s*\)/i,
  /on\s+(?:public\.)?(rezervacije|profili|subscriptions|green_stamps|oracle_logs|napake_log)[\s\S]{0,240}for\s+all[\s\S]{0,240}using\s*\(\s*true\s*\)/i,
];

function sqlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) return sqlFiles(path);
    return path.endsWith(".sql") ? [path] : [];
  });
}

const files = roots.flatMap(sqlFiles);
const findings = [];

for (const file of files) {
  const sql = readFileSync(file, "utf8");
  for (const rx of dangerous) {
    const match = sql.match(rx);
    if (match) {
      findings.push({ file, table: match[1], excerpt: match[0].replace(/\s+/g, " ").slice(0, 220) });
    }
  }
}

if (findings.length > 0) {
  console.error("RLS audit failed: dangerous public/private policy found.\n");
  for (const f of findings) {
    console.error(`- ${f.file} (${f.table}): ${f.excerpt}`);
  }
  process.exit(1);
}

console.log(`RLS audit passed for private tables: ${privateTables.join(", ")}`);
