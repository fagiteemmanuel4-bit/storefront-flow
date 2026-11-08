import { readdirSync } from "node:fs";
import { basename, resolve } from "node:path";

const migrationDirectory = resolve("supabase/migrations");
const files = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const seen = new Map();
for (const file of files) {
  const version = basename(file).split("_", 1)[0];
  if (!/^\d{14}$/.test(version)) {
    throw new Error(`Invalid migration version in ${file}: expected a 14-digit timestamp.`);
  }
  const previous = seen.get(version);
  if (previous) {
    throw new Error(`Duplicate migration timestamp ${version}: ${previous} and ${file}`);
  }
  seen.set(version, file);
}

console.log(`Validated ${files.length} active Supabase migrations; all timestamps are unique.`);
