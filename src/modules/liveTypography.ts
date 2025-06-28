// Module d'aperçu direct mis à jour

import { Editor } from "obsidian";
import { MicrotypographieSettings } from '../settings/settings';
import { isInSpecialBlock, isInPreservedMarkdown } from '../utils/helpers';

export class LiveTypographyModule {
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
     * Gère les événements clavier pour appliquer les règles typographiques en temps réel
     * @param event Événement clavier
     * @param editor Éditeur Obsidian
     * @returns true si l'événement a été géré, false sinon
     */
    public handleKeyEvent(event: KeyboardEvent, editor: Editor): boolean {
        // Vérifier si le curseur est dans un bloc spécial ou un élément à préserver
        if (isInSpecialBlock(editor) || isInPreservedMarkdown(editor)) {
            return false;
        }

        const cursor = editor.getCursor();
        let handled = false;

        // Gérer l'apostrophe typographique
        if (event.key === "'") {
            event.preventDefault();
            const selection = editor.getSelection();
            
            if (selection.length > 0) {
                editor.replaceSelection(this.settings.openSingleQuote);
            } else {
                editor.replaceRange(this.settings.openSingleQuote, cursor);
                editor.setCursor({ line: cursor.line, ch: cursor.ch + this.settings.openSingleQuote.length });
            }
            handled = true;
        }
        
        // Gérer les espaces insécables avant la ponctuation (règles françaises)
        else if (['!', '?', ';'].includes(event.key) && this.settings.frenchRulesEnabled) {
            event.preventDefault();
            const charBefore = editor.getRange(
                { line: cursor.line, ch: cursor.ch - 1 },
                cursor
            );
            
            if (charBefore === " ") {
                editor.replaceRange("\u202F" + event.key, 
                    { line: cursor.line, ch: cursor.ch - 1 },
                    cursor
                );
            } else {
                editor.replaceRange(event.key, cursor);
            }
            editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
            handled = true;
        }
        
        // Gérer les espaces insécables avant les deux-points (règles françaises)
        else if (event.key === ':' && this.settings.frenchRulesEnabled) {
            event.preventDefault();
            const charBefore = editor.getRange(
                { line: cursor.line, ch: cursor.ch - 1 },
                cursor
            );
            
            if (charBefore === " ") {
                editor.replaceRange("\u00A0" + event.key, 
                    { line: cursor.line, ch: cursor.ch - 1 },
                    cursor
                );
            } else {
                editor.replaceRange(event.key, cursor);
            }
            editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
            handled = true;
        }
        
        // Gérer les guillemets personnalisables
        else if (event.key === '"') {
            event.preventDefault();
            
            // Insérer la paire complète de guillemets personnalisés avec le curseur au milieu
            const quoteSet = this.settings.openDoubleQuote + this.settings.closeDoubleQuote;
            editor.replaceRange(quoteSet, cursor);
            
            // Placer le curseur entre les guillemets
            editor.setCursor({ 
                line: cursor.line, 
                ch: cursor.ch + this.settings.openDoubleQuote.length 
            });
            
            handled = true;
        }
        
        // Gestion pour les points de suspension
        else if (event.key === '.' && this.settings.ellipsisEnabled) {
            const textBefore = editor.getRange(
                { line: cursor.line, ch: cursor.ch - 2 }, 
                cursor
            );
            
            if (textBefore === '..') {
                event.preventDefault();
                editor.replaceRange('…', 
                    { line: cursor.line, ch: cursor.ch - 2 }, 
                    cursor
                );
                editor.setCursor({ line: cursor.line, ch: cursor.ch - 1 });
                handled = true;
            }
        }
        
        // Gestion pour les tirets
        else if (event.key === '-' && this.settings.dashesEnabled) {
            const textBefore = editor.getRange(
                { line: cursor.line, ch: cursor.ch - 1 }, 
                cursor
            );
            
            if (this.settings.skipEnDash) {
                // Mode direct -- vers em-dash (—)
                if (textBefore === '-') {
                    event.preventDefault();
                    editor.replaceRange('—', 
                        { line: cursor.line, ch: cursor.ch - 1 }, 
                        cursor
                    );
                    editor.setCursor({ line: cursor.line, ch: cursor.ch });
                    handled = true;
                }
            } else {
                // Mode progressif: -- vers en-dash, puis en-dash- vers em-dash, puis em-dash- vers ---
                if (textBefore === '-') {
                    event.preventDefault();
                    editor.replaceRange('–', 
                        { line: cursor.line, ch: cursor.ch - 1 }, 
                        cursor
                    );
                    editor.setCursor({ line: cursor.line, ch: cursor.ch });
                    handled = true;
                } else if (textBefore === '–') {
                    event.preventDefault();
                    editor.replaceRange('—', 
                        { line: cursor.line, ch: cursor.ch - 1 }, 
                        cursor
                    );
                    editor.setCursor({ line: cursor.line, ch: cursor.ch });
                    handled = true;
                } else if (textBefore === '—') {
                    event.preventDefault();
                    editor.replaceRange('---', 
                        { line: cursor.line, ch: cursor.ch - 1 }, 
                        cursor
                    );
                    editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
                    handled = true;
                }
            }
        }
        
        // Gestion pour les guillemets français via chevrons
        else if (event.key === '>' && this.settings.guillemetsEnabled) {
            const textBefore = editor.getRange(
                { line: cursor.line, ch: cursor.ch - 1 }, 
                cursor
            );
            
            if (textBefore === '>') {
                event.preventDefault();
                editor.replaceRange('\u202F»', 
                    { line: cursor.line, ch: cursor.ch - 1 }, 
                    cursor
                );
                editor.setCursor({ line: cursor.line, ch: cursor.ch });
                handled = true;
            }
        } else if (event.key === '<' && this.settings.guillemetsEnabled) {
            const textBefore = editor.getRange(
                { line: cursor.line, ch: cursor.ch - 1 }, 
                cursor
            );
            
            if (textBefore === '<') {
                event.preventDefault();
                editor.replaceRange('«\u202F', 
                    { line: cursor.line, ch: cursor.ch - 1 }, 
                    cursor
                );
                editor.setCursor({ line: cursor.line, ch: cursor.ch });
                handled = true;
            }
        }
        
        return handled;
    }
}