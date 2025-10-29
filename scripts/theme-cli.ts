#!/usr/bin/env bun

import { $ } from "bun";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

// === Utilities ===
const ensureDir = (dir: string) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const downloadFile = async (url: string, dest: string, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        if (attempt < retries) {
          const waitTime = attempt * 2000; // Progressive backoff: 2s, 4s, 6s
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
const moduleName = process.argv[2];

if (!moduleName) {
  console.log("❗ Usage: mycli <module-name>");
  process.exit(1);
}

console.log(`🚀 Fetching files for module: ${moduleName}`);

const repoBaseURL = `https://raw.githubusercontent.com/AltruisticCraftLab/starter-snippets/main/${moduleName}`;

const targetDir = join(process.cwd(), "src/components", moduleName);
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

// Download all files with delay between requests
for (const [index, file] of files.entries()) {
  const fileUrl = `${repoBaseURL}/${file}`;
  const targetPath = join(targetDir, file);

  try {
    await downloadFile(fileUrl, targetPath);
    successCount++;

    // Add delay between downloads (except after the last one)
    if (index < files.length - 1) {
      await sleep(1000); // 1 second delay between downloads
    }
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
