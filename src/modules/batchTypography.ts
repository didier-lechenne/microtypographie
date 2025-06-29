// Module de traitement par lot mis à jour

import { Editor } from "obsidian";
import { MicrotypographieSettings } from '../settings/settings';
import { compileRules } from '../core/typographyRules';
import { analyzeDocumentStructure } from '../core/blockAnalyzer';
import { processTextWithBlocks, processLargeDocument } from '../core/textProcessor';

export class BatchTypographyModule {
    private settings: MicrotypographieSettings;

    constructor(settings: MicrotypographieSettings) {
        this.settings = settings;
    }

    /**
     * Initialise le module avec les paramètres actuels
     * @param settings Paramètres mis à jour
     */
    public updateSettings(settings: MicrotypographieSettings) {
        this.settings = settings;
    }

    /**
     * Applique toutes les règles typographiques sur un texte sélectionné
     * @param editor Éditeur Obsidian
     * @returns true si des modifications ont été appliquées
     */
    public applyTypographicRules(editor: Editor): boolean {
        // Vérifier s'il y a une sélection
        const selection = editor.getSelection();
        
        // Si aucune sélection, ne rien faire
        if (!selection || selection.length === 0) {
            return false;
        }
        
        // Conserver les positions de sélection
        const selectionStart = editor.getCursor('from');
        const selectionEnd = editor.getCursor('to');
        
        // Précompiler les règles typographiques avec les paramètres courants
        const rules = compileRules(this.settings);
        
        // Analyser la structure du document pour détecter les blocs spéciaux
        const blocks = analyzeDocumentStructure(
            editor.getValue(),
            selectionStart.line,
            selectionEnd.line
        );
        
        // Traiter le texte avec les règles compilées et les paramètres
        const processedText = processTextWithBlocks(selection, blocks.lineTypes, rules, this.settings);
        
        // Vérifier si le texte a changé
        if (processedText === selection) {
            return false;
        }
        
       
        editor.replaceSelection(processedText);
        
   
        
        return true;
    }

    /**
     * Traite de grands documents de manière asynchrone
     * @param editor Éditeur Obsidian
     * @param callback Fonction appelée lorsque le traitement est terminé
     */
    public async processLargeSelection(editor: Editor, callback?: () => void): Promise<void> {
        const selection = editor.getSelection();
        
        if (!selection || selection.length === 0) {
            if (callback) callback();
            return;
        }
        
        const selectionStart = editor.getCursor('from');
        const selectionEnd = editor.getCursor('to');
        
        // Si la sélection est petite, utiliser la méthode synchrone
        if (selection.length < 10000) {
            this.applyTypographicRules(editor);
            if (callback) callback();
            return;
        }
        
        // Pour les grandes sélections, utiliser le traitement asynchrone
        const rules = compileRules(this.settings);
        const blocks = analyzeDocumentStructure(
            editor.getValue(),
            selectionStart.line,
            selectionEnd.line
        );
        
        await processLargeDocument(
            selection, 
            blocks.lineTypes, 
            rules, 
            this.settings,
            (processedText) => {
                editor.replaceSelection(processedText);
                editor.setSelection(selectionStart, selectionEnd);
                if (callback) callback();
            }
        );
    }
}