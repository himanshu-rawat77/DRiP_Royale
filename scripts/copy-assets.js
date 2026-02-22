const fs = require("fs");
const path = require("path");

const src = path.join(process.cwd(), "assets");
const dest = path.join(process.cwd(), "public", "assets");

if (!fs.existsSync(src)) {
  console.warn("Assets folder not found, skipping copy");
  process.exit(0);
}

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(src, dest);
console.log("Assets copied to public/assets");
