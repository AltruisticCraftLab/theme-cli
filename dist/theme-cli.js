#!/usr/bin/env bun
// @bun

// scripts/theme-cli.ts
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
var ensureDir = (dir) => {
  if (!existsSync(dir))
    mkdirSync(dir, { recursive: true });
};
var downloadFile = async (url, dest) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const content = await response.text();
    if (content.includes("404") && content.length < 1000) {
      throw new Error("File not found (404)");
    }
    await Bun.write(dest, content);
    console.log(`\u2705 Saved: ${dest}`);
  } catch (err) {
    console.error(`\u274C Failed to download from ${url}`);
    console.error(`   Error: ${err instanceof Error ? err.message : err}`);
    throw err;
  }
};
var repoBaseURL = "https://raw.githubusercontent.com/AltruisticCraftLab/starter-snippets/main/theme";
var targetDir = join(process.cwd(), "src/components/theme");
ensureDir(targetDir);
var files = [
  "moon-icon.tsx",
  "sun-icon.tsx",
  "system-icon.tsx",
  "theme-toggle.tsx"
];
console.log(`\u2B07\uFE0F Downloading ${files.length} React components...`);
var successCount = 0;
var failCount = 0;
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
console.log(`
\uD83D\uDCCA Summary:`);
console.log(`   \u2705 ${successCount} files downloaded successfully`);
if (failCount > 0) {
  console.log(`   \u274C ${failCount} files failed`);
  process.exit(1);
}
console.log("\uD83C\uDF89 Done! All files added successfully.");
