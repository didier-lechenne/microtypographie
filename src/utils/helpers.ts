import { Plugin, Editor } from "obsidian";
import { isLineInSpecialBlock } from "../core/blockAnalyzer";


/**
 * Vérifie si le curseur est dans un bloc spécial (frontmatter ou code)
 * @param editor Éditeur Obsidian
 * @returns true si le curseur est dans un bloc spécial
 */
export function isInSpecialBlock(editor: Editor): boolean {
    const cursor = editor.getCursor();
    const text = editor.getValue();
    
    return isLineInSpecialBlock(text, cursor.line);
}


/**
 * Vérifie si le curseur est dans un élément Markdown spécial à préserver
 * @param editor Éditeur Obsidian
 * @returns true si le curseur est dans un élément à préserver
 */
export function isInPreservedMarkdown(editor: Editor): boolean {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    
    // 1. Vérifier si on est dans un code inline (entre backticks)
    const codeInlinePattern = /`[^`]*`/g;
    const codeInlineMatches = [...line.matchAll(codeInlinePattern)];
    for (const match of codeInlineMatches) {
        const start = match.index || 0;
        const end = start + match[0].length;
        if (cursor.ch >= start && cursor.ch <= end) {
            return true;
        }
    }
    
    // 2. Vérifier si on est dans un lien interne Obsidian
    const obsidianLinkPattern = /\[\[[^\]]*\]\]/g;
    const obsidianLinkMatches = [...line.matchAll(obsidianLinkPattern)];
    for (const match of obsidianLinkMatches) {
        const start = match.index || 0;
        const end = start + match[0].length;
        if (cursor.ch >= start && cursor.ch <= end) {
            return true;
        }
    }
    
    // 3. Vérifier si on est dans une équation mathématique inline
    const mathInlinePattern = /\$[^$]*\$/g;
    const mathInlineMatches = [...line.matchAll(mathInlinePattern)];
    for (const match of mathInlineMatches) {
        const start = match.index || 0;
        const end = start + match[0].length;
        if (cursor.ch >= start && cursor.ch <= end) {
            return true;
        }
    }
    
    // 4. Vérifier si on est dans une équation mathématique bloc
    // On ne vérifie que le début et la fin car le bloc peut s'étendre sur plusieurs lignes
    if (line.includes("$$")) {
        const matches = [...line.matchAll(/\$\$/g)];
        for (const match of matches) {
            const start = match.index || 0;
            const end = start + 2;
            if (cursor.ch >= start && cursor.ch <= end) {
                return true;
            }
        }
    }
    
    // 5. Vérifier si on est dans un callout
    const calloutPattern = /^>\s+\[!.*\]/;
    if (calloutPattern.test(line) && cursor.ch <= line.length) {
        return true;
    }
    
    // 6. Vérifier si on est dans une URL directe
    const urlPattern = /(https?:\/\/|www\.)[^\s]+/g;
    const urlMatches = [...line.matchAll(urlPattern)];
    for (const match of urlMatches) {
        const start = match.index || 0;
        const end = start + match[0].length;
        if (cursor.ch >= start && cursor.ch <= end) {
            return true;
        }
    }
    
    // 7. Pour les images et liens, vérifier si le curseur est à l'intérieur
    const imagePattern = /!\[.*?\]\(.*?\)/g;
    const imageMatches = [...line.matchAll(imagePattern)];
    for (const match of imageMatches) {
        const start = match.index || 0;
        const end = start + match[0].length;
        if (cursor.ch >= start && cursor.ch <= end) {
            return true;
        }
    }
    
    // 8. Pour les liens Markdown
    const linkPattern = /\[.*?\]\(.*?\)/g;
    const linkMatches = [...line.matchAll(linkPattern)];
    for (const match of linkMatches) {
        const start = match.index || 0;
        const end = start + match[0].length;
        if (cursor.ch >= start && cursor.ch <= end) {
            return true;
        }
    }
    
    // 9. Pour les balises HTML
    const htmlTagPattern = /<[^>]*>/g;
    const htmlMatches = [...line.matchAll(htmlTagPattern)];
    for (const match of htmlMatches) {
        const start = match.index || 0;
        const end = start + match[0].length;
        if (cursor.ch >= start && cursor.ch <= end) {
            return true;
        }
    }
    
    // 10. Vérifier si on est dans un identifiant de tâche
    const taskPattern = /^\s*- \[[ x]\]/;
    if (taskPattern.test(line) && cursor.ch <= line.indexOf("]") + 1) {
        return true;
    }
    
    return false;
}


/**
 * Injecte un fichier CSS dans le document
 * @param plugin Instance du plugin
 * @param fileName Nom du fichier CSS (relatif au répertoire du plugin)
 * @returns Promesse résolue une fois le CSS injecté
 */
export async function injectCSSFromFile(plugin: Plugin, fileName: string): Promise<void> {
    try {
        const pluginDir = plugin.manifest.dir;
        const filePath = `${pluginDir}/${fileName}`;

        const cssContent = await plugin.app.vault.adapter.read(filePath);
        const styleEl = document.createElement('style');
        styleEl.textContent = cssContent;
        document.head.appendChild(styleEl);
    } catch (error) {
        console.error("Échec de chargement du fichier CSS:", error);
    }
}

/**
 * Vérifie si une chaîne de caractères est vide ou ne contient que des espaces
 * @param str Chaîne à vérifier
 * @returns true si la chaîne est vide ou ne contient que des espaces
 */
export function isEmptyOrWhitespace(str: string): boolean {
    return str === null || str.trim() === '';
}

/**
 * Obtient la position du texte dans un document
 * @param text Texte complet
 * @param searchText Texte à rechercher
 * @param startIndex Index de départ pour la recherche (optionnel)
 * @returns Objet avec les propriétés fromLine, fromCh, toLine, toCh ou null si non trouvé
 */
export function getTextPosition(text: string, searchText: string, startIndex = 0): {
    fromLine: number, 
    fromCh: number, 
    toLine: number, 
    toCh: number
} | null {
    const index = text.indexOf(searchText, startIndex);
    if (index === -1) {
        return null;
    }
    
    const textBefore = text.substring(0, index);
    const lines = textBefore.split('\n');
    const fromLine = lines.length - 1;
    const fromCh = lines[fromLine].length;
    
    const searchLines = searchText.split('\n');
    const toLine = fromLine + searchLines.length - 1;
    const toCh = toLine === fromLine ? 
        fromCh + searchText.length : 
        searchLines[searchLines.length - 1].length;
    
    return { fromLine, fromCh, toLine, toCh };
}

/**
 * Mesure le temps d'exécution d'une fonction
 * @param fn Fonction à mesurer
 * @param args Arguments à passer à la fonction
 * @returns Le résultat de la fonction et le temps d'exécution en ms
 */
export async function measureExecutionTime<T, A extends any[]>(
    fn: (...args: A) => Promise<T> | T, 
    ...args: A
): Promise<{ result: T, executionTime: number }> {
    const startTime = performance.now();
    const result = await fn(...args);
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    return { result, executionTime };
}

/**
 * Affiche un message de performance dans la console
 * @param operation Nom de l'opération
 * @param executionTime Temps d'exécution en ms
 */
export function logPerformance(operation: string, executionTime: number): void {
    console.log(`Performance - ${operation}: ${executionTime.toFixed(2)}ms`);
}

/**
 * Exécute une fonction avec un délai d'attente
 * Cette fonction est utile pour éviter de bloquer l'interface utilisateur
 * @param fn Fonction à exécuter
 * @param delay Délai en ms
 */
export function debounce<F extends (...args: any[]) => any>(fn: F, delay: number): (...args: Parameters<F>) => void {
    let timeout: NodeJS.Timeout;
    
    return function(...args: Parameters<F>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}