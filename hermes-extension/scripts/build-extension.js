#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🌟 Root directory for the extension goodies
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function bumpVersion() {
  // 🔢 Give the manifest a fresh patch version
  const manifestPath = path.join(rootDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const parts = manifest.version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  manifest.version = parts.join('.');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifest.version;
}

function runWebpack() {
  // 🛠️ Build the React/TS bundle via webpack
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

function copyAssets() {
  // 📦 Move static assets alongside the build output
  fs.mkdirSync(distDir, { recursive: true });
  const files = ['manifest.json', 'options.html', 'i18n.js'];
  files.forEach(file => {
    fs.copyFileSync(path.join(rootDir, file), path.join(distDir, file));
  });
  fs.cpSync(path.join(rootDir, 'configs'), path.join(distDir, 'configs'), { recursive: true });
}

function zipDist() {
  // 🎁 Zip everything up for easy installation
  execSync('zip -r hermes-extension.zip .', { cwd: distDir, stdio: 'inherit' });
}

function main() {
  const newVersion = bumpVersion();
  console.log(`Packaging Hermes extension v${newVersion}...`);
  runWebpack();
  copyAssets();
  zipDist();
  console.log('Done! Find your zip in dist/hermes-extension.zip');
}

main();
