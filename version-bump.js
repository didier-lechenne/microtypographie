const fs = require('fs');
const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = fs;

const manifestFile = "manifest.json";
const versionsFile = "versions.json";
const packageFile = "package.json";

// Récupérer la version cible depuis les arguments
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
    const patch = parseInt(versionParts[2]) + 1;
    
    targetVersion = `${major}.${minor}.${patch}`;
    console.log(`Auto-incrementing version from ${currentVersion} to ${targetVersion}`);
}

// Valider le format de version
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(targetVersion)) {
    console.error(`Invalid version format: ${targetVersion}. Expected format: x.y.z`);
    process.exit(1);
}

console.log(`🔄 Updating version to ${targetVersion}...`);

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

console.log(`✅ Files updated: ${manifestFile}, ${packageFile}, ${versionsFile}`);

// Construire le projet pour s'assurer que main.js est à jour
console.log(`🔨 Building project...`);
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`✅ Build completed`);
} catch (error) {
    console.error(`❌ Build failed:`, error.message);
    process.exit(1);
}

// Vérifier que les fichiers nécessaires existent
const requiredFiles = ['manifest.json', 'main.js'];
const optionalFiles = ['styles.css', 'style.css'];

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Required file missing: ${file}`);
        process.exit(1);
    }
}

// Trouver le fichier de style (peut être styles.css ou style.css)
let styleFile = null;
for (const file of optionalFiles) {
    if (fs.existsSync(file)) {
        styleFile = file;
        break;
    }
}

// Ajouter les fichiers à Git
console.log(`📝 Committing changes...`);
try {
    execSync('git add manifest.json package.json versions.json main.js', { stdio: 'inherit' });
    if (styleFile) {
        execSync(`git add ${styleFile}`, { stdio: 'inherit' });
    }
    
    execSync(`git commit -m "Release v${targetVersion}"`, { stdio: 'inherit' });
    console.log(`✅ Changes committed`);
} catch (error) {
    console.error(`❌ Git commit failed:`, error.message);
    process.exit(1);
}

// Créer et pousser le tag
console.log(`🏷️  Creating tag v${targetVersion}...`);
try {
    execSync(`git tag v${targetVersion}`, { stdio: 'inherit' });
    execSync(`git push origin main`, { stdio: 'inherit' });
    execSync(`git push origin v${targetVersion}`, { stdio: 'inherit' });
    console.log(`✅ Tag created and pushed`);
} catch (error) {
    console.error(`❌ Git tag/push failed:`, error.message);
    process.exit(1);
}

// Créer la release GitHub avec les fichiers
console.log(`🚀 Creating GitHub release...`);
try {
    // Construire la commande de release
    let releaseCommand = `gh release create v${targetVersion} manifest.json main.js`;
    
    if (styleFile) {
        releaseCommand += ` ${styleFile}`;
    }
    
    releaseCommand += ` --title "Release v${targetVersion}" --notes "Release v${targetVersion}

## Installation
1. Download \`manifest.json\`, \`main.js\`${styleFile ? `, and \`${styleFile}\`` : ''} from this release
2. Create folder \`microtypographie\` in your vault's \`.obsidian/plugins/\` folder  
3. Place the downloaded files in that folder
4. Reload Obsidian and enable the plugin in settings

## Changes
- Version bump to ${targetVersion}
${currentVersion !== targetVersion ? `- Updated from v${currentVersion}` : ''}
"`;

    execSync(releaseCommand, { stdio: 'inherit' });
    console.log(`✅ GitHub release created successfully!`);
    
} catch (error) {
    console.error(`❌ GitHub release creation failed:`, error.message);
    console.error(`You can create the release manually at: https://github.com/dlechenne/microtypographie/releases/new`);
    process.exit(1);
}

console.log(`🎉 Release v${targetVersion} completed successfully!`);
console.log(`📦 Files included: manifest.json, main.js${styleFile ? `, ${styleFile}` : ''}`);
console.log(`🌐 Check your release at: https://github.com/dlechenne/microtypographie/releases`);
