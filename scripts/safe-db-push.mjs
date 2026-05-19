import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
}

function hasDestructiveSql(sql) {
  const patterns = [
    /\bDROP\s+TABLE\b/i,
    /\bDROP\s+COLUMN\b/i,
    /\bTRUNCATE\b/i,
    /\bALTER\s+TABLE\b[\s\S]*\bDROP\b/i,
  ];
  return patterns.some((p) => p.test(sql));
}

function readDatabaseUrlFromEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return null;
    const raw = fs.readFileSync(envPath, "utf8");
    const line = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.startsWith("DATABASE_URL="));
    if (!line) return null;
    const value = line.slice("DATABASE_URL=".length).trim();
    if (!value) return null;
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  } catch {
    return null;
  }
}

try {
  const dbUrl = process.env.DATABASE_URL || readDatabaseUrlFromEnvFile();
  if (!dbUrl) {
    console.error("Abbruch: DATABASE_URL ist nicht gesetzt.");
    process.exit(2);
  }

  const diff = run(
    `npx prisma migrate diff --from-url "${dbUrl}" --to-schema-datamodel prisma/schema.prisma --script`,
  );

  if (hasDestructiveSql(diff)) {
    console.error("Abbruch: Destruktive Schema-Änderung erkannt (DROP/TRUNCATE).");
    console.error("Bitte zuerst Backup machen und Migration manuell prüfen.");
    process.exit(2);
  }

  execSync("npx prisma db push", { stdio: "inherit" });
} catch (error) {
  if (error?.stdout) process.stdout.write(String(error.stdout));
  if (error?.stderr) process.stderr.write(String(error.stderr));
  process.exit(1);
}
