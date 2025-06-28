// Mise à jour du fichier index.ts pour correspondre à la nouvelle structure

// Settings
export type { MicrotypographieSettings } from './settings/settings';
export { DEFAULT_SETTINGS, validateSettings } from './settings/settings';
export { MicrotypographieSettingTab } from './settings/settingsTab';

// Core
export type { TypographicRule, CompiledRules } from './core/typographyRules';
export { compileRules, applyRules } from './core/typographyRules';

export { 
    applyAllRules, 
    processTextWithBlocks, 
    processLargeDocument 
} from './core/textProcessor';

export type { EditorPosition, BlockAnalysisResult } from './core/blockAnalyzer';
export { 
    analyzeDocumentStructure, 
    isLineInSpecialBlock, 
    getLineBlockType 
} from './core/blockAnalyzer';

// UI
export { createDecorations } from './ui/decorations';
export { 
    createStatusBarButton, 
    updateStatusBarButton, 
    removeStatusBarButton 
} from './ui/statusBar';

// Utils
export { 
    isInSpecialBlock, 
    isInPreservedMarkdown,
    injectCSSFromFile, 
    isEmptyOrWhitespace, 
    getTextPosition, 
    measureExecutionTime, 
    logPerformance, 
    debounce 
} from './utils/helpers';