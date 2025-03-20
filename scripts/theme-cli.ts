#!/usr/bin/env bun

import { $ } from "bun";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { unzipSync } from "fflate";

// === Utilities ===
const ensureDir = (dir: string) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

const downloadZip = async (url: string, dest: string) => {
  try {
    await $`curl -sSL ${url} -o ${dest}`;
  } catch (err) {
    console.error(`❌ Failed to download ZIP from ${url}`);
    process.exit(1);
  }
};

const extractAndWrite = (zipPath: string, targetDir: string) => {
  const zipBuffer = readFileSync(zipPath);
  const files = unzipSync(new Uint8Array(zipBuffer));

  for (const [filename, content] of Object.entries(files)) {
    const outputPath = join(targetDir, filename);
    writeFileSync(outputPath, content);
    console.log(`📄 Written: ${outputPath}`);
  }
};

// === Main ===
const moduleName = process.argv[2];

if (!moduleName) {
  console.log("❗ Usage: mycli <module-name>");
  process.exit(1);
}

const repoBaseURL =
  "https://raw.githubusercontent.com/AltruisticCraftLab/my-reusable-snippets/main/zips";
const zipUrl = `${repoBaseURL}/${moduleName}.zip`;

const tempDir = join(process.cwd(), ".mycli-temp");
const zipPath = join(tempDir, `${moduleName}.zip`);
const targetDir = join(process.cwd(), "src/components/theme");

ensureDir(tempDir);
ensureDir(targetDir);

console.log(`📥 Downloading ${moduleName}.zip...`);
await downloadZip(zipUrl, zipPath);

console.log(`📂 Extracting files to ${targetDir}...`);
extractAndWrite(zipPath, targetDir);

console.log("🧹 Cleaning up...");
await $`rm -rf ${tempDir}`;

console.log("✅ Done! Files added to ./src/components/theme");
