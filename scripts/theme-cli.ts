#!/usr/bin/env bun

import { $ } from "bun";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

// === Utilities ===
const ensureDir = (dir: string) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

const downloadFile = async (url: string, dest: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();

    // Check if content is actually a 404 page
    if (content.includes("404") && content.length < 1000) {
      throw new Error("File not found (404)");
    }

    await Bun.write(dest, content);
    console.log(`✅ Saved: ${dest}`);
  } catch (err) {
    console.error(`❌ Failed to download from ${url}`);
    console.error(`   Error: ${err instanceof Error ? err.message : err}`);
    throw err; // Re-throw to handle in main
  }
};

// === Main ===

const repoBaseURL =
  "https://raw.githubusercontent.com/AltruisticCraftLab/starter-snippets/main/theme";

const targetDir = join(process.cwd(), "src/components/theme");
ensureDir(targetDir);

// Define all files to download
const files = [
  "moon-icon.tsx",
  "sun-icon.tsx",
  "system-icon.tsx",
  "theme-toggle.tsx",
];

console.log(`⬇️ Downloading ${files.length} React components...`);

let successCount = 0;
let failCount = 0;

// Download all files
for (const file of files) {
  const fileUrl = `${repoBaseURL}/${file}`;
  const targetPath = join(targetDir, file);

  try {
    await downloadFile(fileUrl, targetPath);
    successCount++;
  } catch (err) {
    failCount++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ ${successCount} files downloaded successfully`);
if (failCount > 0) {
  console.log(`   ❌ ${failCount} files failed`);
  process.exit(1);
}

console.log("🎉 Done! All files added successfully.");
