#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
let extra = {};
try {
  const parsed = JSON.parse(readFileSync(join(root, ".grok/app-env.json"), "utf8"));
  if (parsed && typeof parsed === "object") {
    for (const [k, v] of Object.entries(parsed)) if (k.startsWith("VITE_") && typeof v === "string") extra[k] = v;
  }
} catch {}
const [command, ...args] = process.argv.slice(2);
if (!command) process.exit(0);
const child = spawn(command, args, { stdio: "inherit", env: { ...extra, ...process.env } });
child.on("exit", (code) => process.exit(code ?? 1));
