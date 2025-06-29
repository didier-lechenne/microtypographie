// Processeur de texte mis à jour pour la nouvelle structure

import { CompiledRules, applyRules } from './typographyRules';
import { MicrotypographieSettings } from '../settings/settings';

/**
 * Applique toutes les catégories de règles à un texte
 * @param text Texte d'entrée
 * @param rules Ensemble des règles compilées
 * @param settings Paramètres pour le traitement des guillemets
 * @returns Texte transformé
 */
export function applyAllRules(text: string, rules: CompiledRules, settings: MicrotypographieSettings): string {
    let result = text;
    
    // Tableau pour stocker les éléments à préserver
    const preservedElements: string[] = [];
    
    // Liste des patterns à préserver
    const patterns = [
        /\[\[.*?\]\]/g,           // Liens Obsidian [[lien]]
        /\[.*?\]\(.*?\)/g,        // Liens Markdown [texte](url)
        /!\[.*?\]\(.*?\)/g,       // Images ![alt](url)
        /`[^`]+`/g,               // Code inline `code`
        /```[\s\S]*?```/g,        // Blocs de code
        />\s.*$/gm,               // Callouts (lignes commençant par "> ")
        /<[^>]*>/g,               // Balises HTML
        /\$\$[^$]*\$\$/g,         // Équations mathématiques $$equation$$
        /\$[^$]*\$/g,             // Équations mathématiques inline $equation$
        /\{[^}]*\}/g,             // Contenu entre accolades {contenu}
        /https?:\/\/[^\s]+/g,     // URLs avec http: ou https:
        /[a-z]+:\/\/[^\s]+/g,     // Autres protocoles (ftp:, file:, etc.)
        /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, // Adresses email
    ];
    
    // Extraire et remplacer les éléments à préserver
    let tempText = result;
    let elementIndex = 0;
    
    // Pour chaque pattern
    for (const pattern of patterns) {
        let match;
        // Utiliser une chaîne temporaire pour éviter les problèmes de remplacement
        let searchText = tempText;
        let replacedText = tempText;
        
        while ((match = pattern.exec(searchText)) !== null) {
            const placeholder = `__PRESERVED_ELEMENT_${elementIndex}__`;
            preservedElements.push(match[0]);
            // Remplacer uniquement la première occurrence
            replacedText = replacedText.replace(match[0], placeholder);
            elementIndex++;
        }
        
        tempText = replacedText;
    }
    
    // console.log("🟦 AVANT règles françaises:", tempText);
    
    // Appliquer les règles typographiques françaises avec les paramètres
    tempText = applyRules(tempText, rules.frenchRules, settings);
    
    // console.log("🟨 APRÈS règles françaises:", tempText);
    
    // Appliquer les règles de tirets
    tempText = applyRules(tempText, rules.dashRules);
    
    // console.log("🟩 APRÈS règles tirets:", tempText);
    
    // Réintégrer les éléments préservés
    result = tempText;
    for (let i = 0; i < preservedElements.length; i++) {
        const placeholder = `__PRESERVED_ELEMENT_${i}__`;
        result = result.replace(placeholder, preservedElements[i]);
    }
    
    // console.log("🟪 RÉSULTAT FINAL:", result);
    
    return result;
}

/**
 * Traite un texte en respectant les blocs spéciaux (code, frontmatter)
 * @param text Texte à traiter
 * @param blocks Types de blocs pour chaque ligne
 * @param rules Règles compilées
 * @param settings Paramètres pour le traitement des guillemets
 * @returns Texte transformé
 */
export function processTextWithBlocks(text: string, blocks: string[], rules: CompiledRules, settings: MicrotypographieSettings): string {
    const lines = text.split('\n');
    const processedLines = [];
    
    // Regrouper les lignes normales consécutives pour un traitement plus efficace
    let normalTextBuffer = [];
    let lastBlockType = '';
    
    for (let i = 0; i < lines.length; i++) {
        const currentBlockType = blocks[i];
        const line = lines[i];
        
        if (currentBlockType === 'normal') {
            // Ajouter au buffer pour traitement groupé
            normalTextBuffer.push(line);
        } else {
            // Traiter le buffer accumulé si nécessaire
            if (normalTextBuffer.length > 0) {
                const processedBuffer = applyAllRules(normalTextBuffer.join('\n'), rules, settings);
                processedLines.push(...processedBuffer.split('\n'));
                normalTextBuffer = [];
            }
            
            // Ajouter la ligne spéciale sans modification
            processedLines.push(line);
        }
        
        lastBlockType = currentBlockType;
    }
    
    // Traiter tout texte normal restant dans le buffer
    if (normalTextBuffer.length > 0) {
        const processedBuffer = applyAllRules(normalTextBuffer.join('\n'), rules, settings);
        processedLines.push(...processedBuffer.split('\n'));
    }
    
    return processedLines.join('\n');
}

/**
 * Version optimisée pour le traitement asynchrone de grands documents
 * @param text Texte à traiter
 * @param blocks Types de blocs pour chaque ligne
 * @param rules Règles compilées
 * @param settings Paramètres pour le traitement des guillemets
 * @param callback Fonction de callback appelée avec le résultat
 * @param batchSize Taille des lots de lignes à traiter
 */
export async function processLargeDocument(
    text: string, 
    blocks: string[], 
    rules: CompiledRules,
    settings: MicrotypographieSettings,
    callback: (result: string) => void,
    batchSize: number = 500
): Promise<void> {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    
    // Traiter par lots pour éviter de bloquer l'interface
    for (let i = 0; i < Math.ceil(lines.length / batchSize); i++) {
        const startIdx = i * batchSize;
        const endIdx = Math.min((i + 1) * batchSize, lines.length);
        const batchLines = lines.slice(startIdx, endIdx);
        const batchBlocks = blocks.slice(startIdx, endIdx);
        
        // Traiter ce lot de lignes
        const batchText = batchLines.join('\n');
        const processedBatch = processTextWithBlocks(batchText, batchBlocks, rules, settings);
        processedLines.push(...processedBatch.split('\n'));
        
        // Laisser respirer l'interface utilisateur
        if (i < Math.ceil(lines.length / batchSize) - 1) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    // Appeler le callback avec le résultat
    callback(processedLines.join('\n'));
}