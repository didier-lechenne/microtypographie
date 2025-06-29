// Fichier settings.ts avec les nouvelles options

/**
 * Interface pour les paramètres du plugin
 */
export interface MicrotypographieSettings {
    openDoubleQuote: string;
    closeDoubleQuote: string;
    openSingleQuote: string;
    closeSingleQuote: string;
    frenchRulesEnabled: boolean;
    dashesEnabled: boolean;     // Convertir -- en –, –- en —, —- en ---
    skipEnDash: boolean;        // Convertir directement -- en — (sauter le tiret demi-cadratin)
    ellipsisEnabled: boolean;   // Convertir ... en …
    guillemetsEnabled: boolean; // Convertir << et >> en « et »
    highlightEnabled: boolean;
    highlightButton: boolean;
    tabTitleBarButton: boolean; // Bouton dans la barre de titre des onglets
}

/**
 * Paramètres par défaut
 */
export const DEFAULT_SETTINGS: MicrotypographieSettings = {
    openDoubleQuote: "«\u202F",  // Guillemet français ouvrant avec espace fine insécable
    closeDoubleQuote: "\u202F»", // Guillemet français fermant avec espace fine insécable
    openSingleQuote: "“",        // Apostrophe typographique
    closeSingleQuote: "”",       // Apostrophe typographique
    frenchRulesEnabled: true,
    dashesEnabled: true,
    skipEnDash: false,
    ellipsisEnabled: true,
    guillemetsEnabled: false,
    highlightEnabled: false,
    highlightButton: true,
    tabTitleBarButton: true,     // Activé par défaut
};


/**
 * Vérifie si les paramètres sont valides et complets
 * @param settings Paramètres à vérifier
 * @returns Paramètres validés et complétés si nécessaire
 */
export function validateSettings(settings: Partial<MicrotypographieSettings>): MicrotypographieSettings {
    const validatedSettings = { ...DEFAULT_SETTINGS };
    
    if (settings) {
        Object.keys(DEFAULT_SETTINGS).forEach(key => {
            if (key in settings) {
                (validatedSettings as any)[key] = (settings as any)[key];
            }
        });
    }
    
    return validatedSettings;
}