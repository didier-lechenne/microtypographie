const fs = require('fs');
const { readFileSync, writeFileSync } = fs;


const targetVersion = process.argv[2];
const manifestFile = "manifest.json";
const versionsFile = "versions.json";

// Read manifest
let manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const currentVersion = manifest.version;

// Update manifest version
if (targetVersion) {
    manifest.version = targetVersion;
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
} else {
    console.error("No target version provided");
    process.exit(1);
}

// Update versions.json
let versions = {};
try {
    versions = JSON.parse(readFileSync(versionsFile, "utf8"));
} catch (e) {
    console.log("Could not find versions.json, creating a new one");
}

versions[targetVersion] = manifest.minAppVersion;
writeFileSync(versionsFile, JSON.stringify(versions, null, 2));

console.log(`Updated ${manifestFile} and ${versionsFile} to version ${targetVersion}`);