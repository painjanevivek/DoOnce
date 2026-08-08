import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { URL } from "node:url";

const manifest = JSON.parse(await readFile(new URL("../contracts/manifest.json", import.meta.url), "utf8"));
for (const [filename, expected, label] of [["protocol.v1.schema.json", manifest.schemaSha256, "schema"], ["protocol.ts", manifest.typesSha256, "types"]]) {
  const actual = createHash("sha256").update(await readFile(new URL(`../contracts/${filename}`, import.meta.url))).digest("hex");
  if (actual !== expected) throw new Error(`Generated contract ${label} does not match the backend manifest.`);
}
process.stdout.write("Frontend contract snapshot matches manifest v1.\n");
