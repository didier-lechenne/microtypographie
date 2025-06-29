const fs = require('fs');
const { readFileSync, writeFileSync } = fs;

const manifestFile = "manifest.json";
const versionsFile = "versions.json";
const packageFile = "package.json";

// Récupérer la version cible depuis les arguments
// Gérer le cas où npm passe des arguments supplémentaires
const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
let targetVersion = args[0];

// Lire les fichiers
let manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
let packageJson = JSON.parse(readFileSync(packageFile, "utf8"));

const currentVersion = manifest.version;

// Si aucune version fournie, auto-incrémenter le patch
if (!targetVersion) {
    const versionParts = currentVersion.split('.');
    const major = parseInt(versionParts[0]);
    const minor = parseInt(versionParts[1]);
    const patch = parseInt(versionParts[2]) + 1; // Incrémenter le patch
    
    targetVersion = `${major}.${minor}.${patch}`;
    console.log(`Auto-incrementing version from ${currentVersion} to ${targetVersion}`);
}

// Valider le format de version
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(targetVersion)) {
    console.error(`Invalid version format: ${targetVersion}. Expected format: x.y.z`);
    process.exit(1);
}

// Mettre à jour manifest.json
manifest.version = targetVersion;
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

// Mettre à jour package.json
packageJson.version = targetVersion;
writeFileSync(packageFile, JSON.stringify(packageJson, null, 2));

// Mettre à jour versions.json
let versions = {};
try {
    versions = JSON.parse(readFileSync(versionsFile, "utf8"));
} catch (e) {
    console.log("Could not find versions.json, creating a new one");
}

versions[targetVersion] = manifest.minAppVersion;
writeFileSync(versionsFile, JSON.stringify(versions, null, 2));

console.log(`✅ Updated to version ${targetVersion}`);
console.log(`📁 Files updated: ${manifestFile}, ${packageFile}, ${versionsFile}`);