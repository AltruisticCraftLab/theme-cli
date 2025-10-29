#!/usr/bin/env bun

import { $ } from "bun";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

// === Utilities ===
const ensureDir = (dir: string) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const downloadFile = async (url: string, dest: string, retries = 5) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        if (attempt < retries) {
          const waitTime = attempt * 10000; // Much longer: 10s, 20s, 30s, 40s, 50s
          console.log(
            `⏳ Rate limited. Waiting ${
              waitTime / 1000
            }s before retry ${attempt}/${retries}...`
          );
          await sleep(waitTime);
          continue;
        }
        throw new Error("Rate limit exceeded after retries");
      }

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
      return; // Success
    } catch (err) {
      if (attempt === retries) {
        console.error(`❌ Failed to download from ${url}`);
        console.error(`   Error: ${err instanceof Error ? err.message : err}`);
        throw err;
      }
    }
  }
};

// === Main ===

const repoBaseURL = `https://raw.githubusercontent.com/AltruisticCraftLab/starter-snippets/main/theme`;

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
let skippedCount = 0;

// Download all files with delay between requests
for (const [index, file] of files.entries()) {
  const fileUrl = `${repoBaseURL}/${file}`;
  const targetPath = join(targetDir, file);

  // Check if file already exists
  if (existsSync(targetPath)) {
    console.log(`⏭️  Skipped (already exists): ${file}`);
    skippedCount++;
    successCount++;
    continue;
  }

  try {
    await downloadFile(fileUrl, targetPath);
    successCount++;

    // Add delay between downloads (except after the last one)
    if (index < files.length - 1) {
      console.log(`⏸️  Waiting 3s before next download...`);
      await sleep(3000); // Increased to 3 seconds
    }
  } catch (err) {
    failCount++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ ${successCount} files downloaded successfully`);
if (skippedCount > 0) {
  console.log(`   ⏭️  ${skippedCount} files skipped (already existed)`);
}
if (failCount > 0) {
  console.log(`   ❌ ${failCount} files failed`);
  process.exit(1);
}

console.log("🎉 Done! All files added successfully.");
