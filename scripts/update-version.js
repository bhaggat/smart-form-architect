import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const manifestJsonPath = path.join(rootDir, 'public', 'manifest.json');

console.log("📈 Version Bumper");
console.log("================\n");

const updateVersion = (type) => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

  const currentVersion = packageJson.version;
  let [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'patch':
      patch++;
      break;
    default:
      if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(type)) {
        [major, minor, patch] = type.split('.').map(Number);
      } else {
        console.error('❌ Invalid version type. Use major, minor, patch or a specific version string (x.y.z).');
        process.exit(1);
      }
      break;
  }

  const newVersion = `${major}.${minor}.${patch}`;
  console.log(`Updating version from ${currentVersion} to ${newVersion}...`);

  packageJson.version = newVersion;
  manifestJson.version = newVersion;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');

  console.log('✅ Successfully updated package.json and public/manifest.json');
  console.log(`🎯 New version: ${newVersion}`);
  
  console.log("\nNext steps:");
  console.log("1. Run: npm run build");
  console.log("2. Run: npm run chrome:publish");
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Please specify version type (major, minor, patch) or a specific version string.');
  process.exit(1);
}

updateVersion(args[0]);
