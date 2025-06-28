/**
 * Interface pour les positions dans l'éditeur
 */
export interface EditorPosition {
    line: number;
    ch: number;
}

/**
 * Interface pour le résultat de l'analyse des blocs
 */
export interface BlockAnalysisResult {
    lineTypes: string[];
}

/**
 * Analyse la structure du document pour identifier les blocs spéciaux
 * @param documentText Texte complet du document
 * @param startLine Ligne de début de la sélection
 * @param endLine Ligne de fin de la sélection
 * @returns Résultat de l'analyse avec types de lignes
 */
export function analyzeDocumentStructure(documentText: string, startLine: number, endLine: number): BlockAnalysisResult {
    const lines = documentText.split('\n');
    const lineTypes = new Array(endLine - startLine + 1).fill('normal');
    
    let inFrontmatter = false;
    let inCodeBlock = false;
    
    // Une seule passe pour analyser tout le document
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.trim() === '---') {
            inFrontmatter = !inFrontmatter;
        } else if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
        }
        
        // Si nous sommes dans l'intervalle de sélection, enregistrer le type
        if (i >= startLine && i <= endLine) {
            const relativeIndex = i - startLine;
            
            if (line.trim() === '---' || line.trim().startsWith('```')) {
                lineTypes[relativeIndex] = 'delimiter';
            } else if (inFrontmatter) {
                lineTypes[relativeIndex] = 'frontmatter';
            } else if (inCodeBlock) {
                lineTypes[relativeIndex] = 'code';
            }
        }
        
        // Si nous avons dépassé l'intervalle, nous pouvons sortir
        if (i > endLine) break;
    }
    
    return { lineTypes };
}

/**
 * Vérifie si une ligne spécifique se trouve dans un bloc spécial
 * @param documentText Texte complet du document
 * @param lineNumber Numéro de ligne à vérifier
 * @returns true si la ligne est dans un bloc spécial
 */
export function isLineInSpecialBlock(documentText: string, lineNumber: number): boolean {
    const lines = documentText.split('\n');
    
    let inFrontmatter = false;
    let inCodeBlock = false;
    
    // Analyser le document jusqu'à la ligne spécifiée
    for (let i = 0; i <= lineNumber; i++) {
        const line = lines[i];
        
        if (line.trim() === '---') {
            inFrontmatter = !inFrontmatter;
        } else if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
        }
        
        // Si nous sommes à la ligne cible, retourner le résultat
        if (i === lineNumber) {
            return inFrontmatter || inCodeBlock;
        }
    }
    
    return false;
}

/**
 * Analyse rapide pour détecter le type de bloc d'une ligne
 * @param documentText Texte du document
 * @param lineNumber Numéro de ligne
 * @returns Type de bloc: 'normal', 'frontmatter', 'code', 'delimiter'
 */
export function getLineBlockType(documentText: string, lineNumber: number): string {
    const lines = documentText.split('\n');
    const line = lines[lineNumber];
    
    // Vérifier si c'est un délimiteur
    if (line.trim() === '---' || line.trim().startsWith('```')) {
        return 'delimiter';
    }
    
    // Vérifier si la ligne est dans un bloc spécial
    if (isLineInSpecialBlock(documentText, lineNumber)) {
        // Déterminer le type de bloc spécial
        const result = analyzeDocumentStructure(documentText, lineNumber, lineNumber);
        return result.lineTypes[0];
    }
    
    return 'normal';
}