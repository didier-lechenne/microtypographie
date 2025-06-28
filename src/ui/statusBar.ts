import { Plugin, setIcon } from "obsidian";


/**
 * Crée un bouton dans la barre d'état
 * @param plugin Instance du plugin
 * @param isEnabled État initial (activé/désactivé)
 * @param toggleCallback Fonction de rappel pour le basculement
 * @returns Élément HTML du bouton
 */
export function createStatusBarButton(
    plugin: Plugin,
    isEnabled: boolean,
    toggleCallback: () => void
): HTMLElement {
    const statusBarItemEl = plugin.addStatusBarItem();
    statusBarItemEl.id = "highlight-status-bar-button";
    
    statusBarItemEl.addClass("mod-clickable");
    
    // Créer l'icône et l'ajouter au bouton
    setIcon(statusBarItemEl, "pilcrow");

    statusBarItemEl.setAttribute("aria-label", "Afficher/Masquer les caractères invisibles");
    statusBarItemEl.setAttribute("data-tooltip-position", "top");

    // Définir l'apparence initiale
    updateStatusBarButton(statusBarItemEl, isEnabled);

    // Ajouter l'événement de clic
    statusBarItemEl.onClickEvent(() => {
        toggleCallback();
    });
    
    return statusBarItemEl;
}

/**
 * Crée un bouton dans la barre de titre des onglets
 * @param plugin Instance du plugin
 * @param isEnabled État initial (activé/désactivé)
 * @param toggleCallback Fonction de rappel pour le basculement
 * @returns Élément HTML du bouton
 */
export function createTabTitleBarButton(
    plugin: Plugin,
    isEnabled: boolean,
    toggleCallback: () => void
): HTMLElement {
    // Créer le bouton
    const buttonEl = document.createElement('button');
    buttonEl.id = "highlight-tab-title-button";
    buttonEl.className = "clickable-icon view-action";
    buttonEl.setAttribute("aria-label", "Afficher/Masquer les caractères invisibles");
    
    // Créer l'icône et l'ajouter au bouton
    setIcon(buttonEl, "pilcrow");
    
    // Définir l'apparence initiale
    updateTabTitleBarButton(buttonEl, isEnabled);
    
    // Ajouter l'événement de clic
    buttonEl.addEventListener('click', (event) => {
        event.preventDefault();
        toggleCallback();
    });
    
    // Ajouter le bouton à la barre de titre
    const titleBarEl = document.querySelector('.view-header-title-container');
    if (titleBarEl) {
        const actionsEl = titleBarEl.nextElementSibling as HTMLElement;
        if (actionsEl && actionsEl.classList.contains('view-actions')) {
            actionsEl.prepend(buttonEl);
        }
    }
    
    return buttonEl;
}

/**
 * Met à jour l'apparence du bouton de la barre d'état
 * @param buttonEl Élément HTML du bouton
 * @param isEnabled État (activé/désactivé)
 */
export function updateStatusBarButton(buttonEl: HTMLElement | null, isEnabled: boolean): void {
    if (!buttonEl) return;
    
    if (isEnabled) {
        buttonEl.addClass('highlight-enabled');
    } else {
        buttonEl.removeClass('highlight-enabled');
    }
}

/**
 * Met à jour l'apparence du bouton de la barre de titre
 * @param buttonEl Élément HTML du bouton
 * @param isEnabled État (activé/désactivé)
 */
export function updateTabTitleBarButton(buttonEl: HTMLElement | null, isEnabled: boolean): void {
    if (!buttonEl) return;
    
    if (isEnabled) {
        buttonEl.addClass('is-active');
    } else {
        buttonEl.removeClass('is-active');
    }
}

/**
 * Supprime le bouton de la barre d'état
 * @param buttonEl Élément HTML du bouton
 */
export function removeStatusBarButton(buttonEl: HTMLElement | null): void {
    if (buttonEl) {
        buttonEl.remove();
    }
}

/**
 * Supprime le bouton de la barre de titre
 * @param buttonEl Élément HTML du bouton
 */
export function removeTabTitleBarButton(buttonEl: HTMLElement | null): void {
    if (buttonEl) {
        buttonEl.remove();
    }
}