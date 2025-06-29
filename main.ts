import { MarkdownView, Plugin } from "obsidian";
// import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { MicrotypographieSettings, DEFAULT_SETTINGS } from './src/settings/settings';
import { MicrotypographieSettingTab } from './src/settings/settingsTab';
import { createDecorations } from './src/ui/decorations';
import { 
    createStatusBarButton, 
    updateStatusBarButton, 
    createTabTitleBarButton, 
    updateTabTitleBarButton, 
    removeTabTitleBarButton 
} from './src/ui/statusBar';
import { injectCSSFromFile } from './src/utils/helpers';

// Importer les nouveaux modules
import { LiveTypographyModule } from './src/modules/liveTypography';
import { BatchTypographyModule } from './src/modules/batchTypography';

import { EditorView } from "@codemirror/view";

export default class Microtypographie extends Plugin {
    settings: MicrotypographieSettings;
    private statusBarButton: HTMLElement | null = null;
    private tabTitleBarButton: HTMLElement | null = null;
    
    // Instances des modules
    private liveModule: LiveTypographyModule;
    private batchModule: BatchTypographyModule;

    async onload() {
        // Charger les paramètres
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    
        // Initialiser les modules
        this.liveModule = new LiveTypographyModule(this.settings);
        this.batchModule = new BatchTypographyModule(this.settings);
        
        // Ajouter l'onglet de paramètres
        this.addSettingTab(new MicrotypographieSettingTab(this.app, this));
    
        // Enregistrer l'événement keydown pour le module d'aperçu direct
        this.registerDomEvent(document, 'keydown', this.handleKeyDown.bind(this));
    
        // Injecter le CSS pour la mise en évidence
        await injectCSSFromFile(this, "styles.css");

        // Enregistrer l'extension de l'éditeur pour les décorations
        this.registerEditorExtension(createDecorations(this.settings));

        // Ajouter le bouton dans la barre d'état si l'option est activée
        if (this.settings.highlightButton) {
            this.statusBarButton = createStatusBarButton(
                this, 
                this.settings.highlightEnabled,
                this.toggleHighlight.bind(this)
            );
        }
        
        
        // Ajouter le bouton dans la barre de titre des onglets si l'option est activée
        if (this.settings.tabTitleBarButton) {
            this.tabTitleBarButton = createTabTitleBarButton(
                this,
                this.settings.highlightEnabled,
                this.toggleHighlight.bind(this)
            );
        }
        
        // Ajouter la commande pour appliquer les règles typographiques (via le module de traitement par lot)
        this.addCommand({
            id: 'apply-french-typography',
            name: 'Appliquer les règles typographiques françaises',
            callback: () => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    this.batchModule.applyTypographicRules(activeView.editor);
                }
            },
            hotkeys: [{ modifiers: ["Alt"], key: "f" }]
        });

        // Ajouter la commande pour activer/désactiver la mise en évidence
        this.addCommand({
            id: 'toggle-highlight',
            name: 'Afficher/Masquer les caractères invisibles',
            callback: () => {
                this.toggleHighlight();
            }
        });
        
        // Enregistrer un événement pour mettre à jour le bouton de la barre de titre
        // lorsque l'utilisateur change d'onglet ou de vue
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                // Recréer le bouton de la barre de titre si l'option est activée
                if (this.settings.tabTitleBarButton) {
                    // Supprimer l'ancien bouton s'il existe
                    if (this.tabTitleBarButton) {
                        this.tabTitleBarButton.remove();
                    }
                    
                    // Créer un nouveau bouton
                    this.tabTitleBarButton = createTabTitleBarButton(
                        this,
                        this.settings.highlightEnabled,
                        this.toggleHighlight.bind(this)
                    );
                }
            })
        );
    }

    // Gérer les événements clavier (délègue au module d'aperçu direct)
    private handleKeyDown(event: KeyboardEvent) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView || activeView.getMode() !== 'source') {
            return;
        }
    
        const leaf = this.app.workspace.getLeaf();
        if (!leaf) return;
    
        const activeState = leaf.getViewState().state;
        if (!activeState) return;
    
        if (activeView && activeView.getMode() === 'source' && activeState["source"] === false) {
            // Déléguer le traitement au module d'aperçu direct
            this.liveModule.handleKeyEvent(event, activeView.editor);
        }
    }

    async loadSettings() {
        // Charger les données brutes sauvegardées
        const savedData = await this.loadData();
        
        // Créer un nouvel objet de paramètres en partant des valeurs par défaut
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
        
        // Si des paramètres ont été sauvegardés, les copier dans les nouvelles propriétés
        if (savedData) {
            // Copier uniquement les propriétés qui existent dans la nouvelle interface
            Object.keys(this.settings).forEach(key => {
                if (key in savedData) {
                    (this.settings as any)[key] = (savedData as any)[key];
                }
            });
            
            // Migration des anciennes propriétés vers les nouvelles
            // Cette partie est exécutée seulement si les anciennes propriétés existent
            if ('apostrophe' in savedData || 'quotationmarks' in savedData || 'emdashes' in savedData) {
                console.log("Migration des paramètres de Microtypographie vers la nouvelle version");
                
                // Si ces anciennes options étaient désactivées, on vide les paramètres correspondants
                // pour désactiver les fonctionnalités
                if (savedData.apostrophe === false) {
                    this.settings.openSingleQuote = "'";  // Apostrophe standard
                    this.settings.closeSingleQuote = "'";
                }
                
                if (savedData.quotationmarks === false) {
                    this.settings.openDoubleQuote = "\"";  // Guillemet standard
                    this.settings.closeDoubleQuote = "\"";
                }
                
                // Sauvegarder immédiatement les paramètres migrés
                await this.saveSettings();
            }
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
        
      

        // Mettre à jour les modules avec les nouveaux paramètres
        this.liveModule.updateSettings(this.settings);
        this.batchModule.updateSettings(this.settings);
        
        // Mettre à jour l'UI
        updateStatusBarButton(this.statusBarButton, this.settings.highlightEnabled);
        updateTabTitleBarButton(this.tabTitleBarButton, this.settings.highlightEnabled);
        this.refreshDecorations();
    }

    // Activer/désactiver la mise en évidence
    toggleHighlight() {
        this.settings.highlightEnabled = !this.settings.highlightEnabled;
        this.saveSettings();
    }

    // Rafraîchir les décorations
    refreshDecorations() {
        this.app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view instanceof MarkdownView && leaf.view.editor) {
                const editorView = (leaf.view.editor as any).cm as EditorView;
                
                if (editorView) {
                    editorView.dispatch({
                        changes: {
                            from: 0,
                            to: editorView.state.doc.length,
                            insert: editorView.state.doc.toString()
                        }
                    });
                }
            }
        });
    }

    onunload() {
        // Nettoyer les éléments UI
        removeTabTitleBarButton(this.tabTitleBarButton);
    }
}