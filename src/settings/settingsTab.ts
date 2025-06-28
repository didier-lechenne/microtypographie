import { App, PluginSettingTab, Setting } from "obsidian";
// import { MicrotypographieSettings } from "./settings";
import type Microtypographie from "../../main";

/**
 * Onglet de configuration du plugin dans les paramètres d'Obsidian
 */
export class MicrotypographieSettingTab extends PluginSettingTab {
  plugin: Microtypographie;
  private wordsInputContainer: HTMLElement; // Pour stocker la référence au container du champ de texte

  constructor(app: App, plugin: Microtypographie) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h3", { text: "Microtypographie" });

    // Bloc d'information
    // this.createInfoBlock(containerEl);

    // Paramètres de base
    this.createBasicSettings(containerEl);

    // Paramètres de mise en évidence
    this.createHighlightSettings(containerEl);
  }

  /**
   * Crée le bloc d'information
   * @param containerEl Conteneur parent
   */
  private createInfoBlock(containerEl: HTMLElement): void {
    const infoContainer = containerEl.createEl("div", {
      cls: "microtypographie-info-container",
    });

    const infoContent = infoContainer.createEl("div", {
      cls: "microtypographie-info-content",
    });

    infoContent.createEl("p", {
      text: "Ce plugin applique automatiquement une partie des règles typographiques françaises pendant la saisie.",
    });

    const rulesList = infoContent.createEl("ul");
    rulesList.createEl("li", {
      text: "Espaces insécables avant les ponctuations doubles (! ? ; »)",
    });
    rulesList.createEl("li", { text: "Espaces fines insécables avant (:)" });
    rulesList.createEl("li", {
      text: "Espaces fines insécables dans les guillemets français («\u202Fphrase\u202F»)",
    });
    rulesList.createEl("li", { text: "Apostrophe typographique (’)" });
    rulesList.createEl("li", {
      text: "Conversion de (--) en tiret cadratin (—)",
    });

    infoContent.createEl("p", {
      text: "Utilisez Alt+F pour appliquer toutes les règles sur un texte existant.",
    });

    const transformationsList = infoContent.createEl("ul");
    transformationsList.createEl("li", {
      text: 'Conversion de (" ") en guillemets français (« »)',
    });
    transformationsList.createEl("li", {
      text: "Conversion de ' en apostrophe typographique (’)",
    });
    transformationsList.createEl("li", {
      text: "Espace fine insécable avant : (! ? ; » ›)",
    });
    transformationsList.createEl("li", {
      text: "Espace insécable avant : (:)",
    });
    transformationsList.createEl("li", {
      text: "Espace fine insécable après : (« ‹)",
    });
    transformationsList.createEl("li", {
      text: "Espace insécable après les mots d'une lettre (a, y, à …)",
    });
    transformationsList.createEl("li", {
      text: "Espace insécable dans les noms composés (Jean\u00A0Dupont)",
    });
    transformationsList.createEl("li", {
      text: "Espace insécable avant les initiales (M.\u00A0Dupont)",
    });
    transformationsList.createEl("li", {
      text: "Espace insécable avant (siècle) (XXe\u00A0siècle)",
    });
    transformationsList.createEl("li", {
      text: "Conversion de (oe/OE) en ligatures (œ/Œ)",
    });
    transformationsList.createEl("li", {
      text: "Conversion de (--) en tiret cadratin (—)",
    });
    transformationsList.createEl("li", {
      text: "Conversion de (...) en points de suspension (…)",
    });

    infoContent.createEl("p", {
      text: "Info pour insérer une espace insécable avec Obsidian :",
    });

    // Créer une liste pour les raccourcis
    const shortcutsList = infoContent.createEl("ul");
    shortcutsList.createEl("li", { text: "Windows : Alt+255" });
    shortcutsList.createEl("li", { text: "macOS : Alt+Espace" });

    // Ajouter du style CSS en ligne pour le bloc d'information
    this.addInfoBlockStyles();
  }

  /**
   * Ajoute les styles CSS pour le bloc d'information
   */
  private addInfoBlockStyles(): void {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
        .microtypographie-info-container {
            background-color: rgba(var(--interactive-accent-rgb), 0.1);
            border-left: 4px solid var(--interactive-accent);
            margin: 1em 0;
            padding: 1em;
            border-radius: 4px;
        }
        
        .microtypographie-info-container h2 {
            margin-top: 0;
            font-size: 1.2em;
            color: var(--interactive-accent);
        }
        
        .microtypographie-info-content p {
            margin: 0.5em 0;
        }
    `;

    document.head.appendChild(styleElement);
  }

/**
 * Crée les paramètres de base
 * @param containerEl Conteneur parent
 */
private createBasicSettings(containerEl: HTMLElement): void {
  // Ajouter les nouveaux paramètres personnalisables
  const desEl = containerEl.createEl("p", {
    text: "Caractères typographiques personnalisables",
  });
  desEl.style.fontWeight = "bold";

  // Option pour le guillemet double ouvrant
  new Setting(containerEl)
    .setName("Guillemet double ouvrant")
    .addText((text) =>
      text
        .setValue(this.plugin.settings.openDoubleQuote)
        .onChange(async (value) => {
          this.plugin.settings.openDoubleQuote = value;
          await this.plugin.saveSettings();
        })
    );

  // Option pour le guillemet double fermant
  new Setting(containerEl)
    .setName("Guillemet double fermant")
    .addText((text) =>
      text
        .setValue(this.plugin.settings.closeDoubleQuote)
        .onChange(async (value) => {
          this.plugin.settings.closeDoubleQuote = value;
          await this.plugin.saveSettings();
        })
    );

  // Option pour le guillemet simple ouvrant (apostrophe)
  new Setting(containerEl)
    .setName("Guillemet simple ouvrant")
    .addText((text) =>
      text
        .setValue(this.plugin.settings.openSingleQuote)
        .onChange(async (value) => {
          this.plugin.settings.openSingleQuote = value;
          await this.plugin.saveSettings();
        })
    );

  // Option pour le guillemet simple fermant (apostrophe)
  new Setting(containerEl)
    .setName("Guillemet simple fermant")
    .addText((text) =>
      text
        .setValue(this.plugin.settings.closeSingleQuote)
        .onChange(async (value) => {
          this.plugin.settings.closeSingleQuote = value;
          await this.plugin.saveSettings();
        })
    );

  // Section pour les nouvelles options
  const transformTitle = containerEl.createEl("p", {
    text: "Options",
  });
  transformTitle.style.fontWeight = "bold";
  transformTitle.style.marginTop = "1.5em";

  // Option pour les tirets
  new Setting(containerEl)
    .setName("Tirets")
    .setDesc(
      "-- devient tiret demi-cadratin (–), –- devient tiret cadratin (—), —- devient trois tirets (---)"
    )
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.dashesEnabled)
        .onChange(async (value) => {
          this.plugin.settings.dashesEnabled = value;
          await this.plugin.saveSettings();
        })
    );

  // Option pour sauter le tiret demi-cadratin
  new Setting(containerEl)
    .setName("Ignorer le tiret demi-cadratin")
    .setDesc(
      "Quand activé, -- est directement converti en tiret cadratin (—) plutôt qu'en demi-cadratin (–)"
    )
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.skipEnDash)
        .onChange(async (value) => {
          this.plugin.settings.skipEnDash = value;
          await this.plugin.saveSettings();
        })
    );

  // Option pour les points de suspension
  new Setting(containerEl)
    .setName("Points de suspension")
    .setDesc(
      "Trois points (...) seront convertis en points de suspension (…)"
    )
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.ellipsisEnabled)
        .onChange(async (value) => {
          this.plugin.settings.ellipsisEnabled = value;
          await this.plugin.saveSettings();
        })
    );

  // Option pour les guillemets chevrons
  new Setting(containerEl)
    .setName("Guillemets")
    .setDesc(
      "Les chevrons << et >> seront convertis en guillemets français « et »"
    )
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.guillemetsEnabled)
        .onChange(async (value) => {
          this.plugin.settings.guillemetsEnabled = value;
          await this.plugin.saveSettings();
        })
    );

  // const frenchRulesTitle = containerEl.createEl("p", {
  //   text: "Règles typographiques par langue",
  // });
  // frenchRulesTitle.style.fontWeight = "bold";

  // Créer un conteneur pour les règles françaises et leur description
  const frenchRulesContainer = containerEl.createEl("div");
  frenchRulesContainer.style.marginTop = "3em";


  // Option pour les règles typographiques françaises avec toggle
  const frenchRulesSetting = new Setting(frenchRulesContainer)
    .setName("Règles typographiques françaises")
    .setDesc(
      ""
    )
    .addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.frenchRulesEnabled)
        .onChange(async (value) => {
          this.plugin.settings.frenchRulesEnabled = value;
          // Afficher ou masquer la description des règles
          frenchRulesDescContainer.style.display = value ? "block" : "none";
          await this.plugin.saveSettings();
        })
    );

    const nameEl = frenchRulesSetting.nameEl;
    if (nameEl) {
      nameEl.style.fontWeight = "bold";
      // nameEl.style.marginTop = "3em";
    }

  // Conteneur pour la description des règles françaises
  const frenchRulesDescContainer = frenchRulesContainer.createEl("div", {
    cls: "french-rules-description"
  });
  
  // Définir la visibilité initiale
  frenchRulesDescContainer.style.display = this.plugin.settings.frenchRulesEnabled ? "block" : "none";
  frenchRulesDescContainer.style.paddingLeft = "24px";
  frenchRulesDescContainer.style.marginTop = "8px";

  // Ajouter une description des règles typographiques françaises
  const frenchRulesDesc = frenchRulesDescContainer.createEl("div", {
    cls: "setting-item-description",
  });

  frenchRulesDesc.createEl("p", {
    text: "Ces règles incluent :",
  });

  const rulesList = frenchRulesDesc.createEl("ul");
  rulesList.style.marginLeft = "20px";
  // rulesList.style.marginTop = "5px";
  rulesList.style.marginBottom = "15px";

  rulesList.createEl("li", {
    text: 'Conversion de (" ") en guillemets français (« »)',
  });
  rulesList.createEl("li", {
    text: "Espace fine insécable avant les ponctuations doubles (! ? ; »)",
  });
  rulesList.createEl("li", {
    text: "Espace insécable avant les deux-points (:)",
  });
  rulesList.createEl("li", {
    text: "Espace insécable après les mots d'une lettre (a, y, à...)",
  });
  rulesList.createEl("li", {
    text: "Espace insécable dans les noms composés (Jean Dupont)",
  });
  rulesList.createEl("li", {
    text: "Espace insécable avant les initiales (M. Dupont)",
  });
  rulesList.createEl("li", {
    text: 'Espace insécable avant "siècle" (XXe siècle)',
  });
  rulesList.createEl("li", {
    text: 'Conversion des ligatures "oe/OE" en "œ/Œ"',
  });
  rulesList.createEl("li", {
    text: "Exposants pour les ordinaux (1er, XIIe)",
  });
  rulesList.createEl("li", {
    text: "Conversion de (...) en points de suspension (…)",
  });

  // Ajouter une note explicative sur les espaces fines insécables
  const noteEl = frenchRulesDescContainer.createEl("div", {
    cls: "setting-item-description",
  });

  noteEl.createEl("p", {
    text: "Sources :",
  });

  const infoList = noteEl.createEl("ul");
  const infoItem = infoList.createEl("li");
  infoItem.createEl("a", {
    href: "https://gitlab.com/JulieBlanc/typesetting-tools/-/blob/master/regex-typo.js?ref_type=heads",
    text: "typesetting-tools (Julie Blanc)",
  });

  const infoItem2 = infoList.createEl("li");
  infoItem2.createEl("a", {
    href: "https://typomanie.fr/tag/micro-typographie/",
    text: "Le Petit manuel de composition typographique. (Muriel Paris)",
  });
}

  /**
   * Crée les paramètres de mise en évidence
   * @param containerEl Conteneur parent
   */
  private createHighlightSettings(containerEl: HTMLElement): void {
    const desEl = containerEl.createEl("p", {
      text: "Affichage des caractères invisibles",
    });
    desEl.style.fontWeight = "bold";
    desEl.style.marginTop = "3em";

    new Setting(containerEl)
      .setName("Activer l'affichage des caractères invisibles")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.highlightEnabled)
          .onChange(async (value) => {
            this.plugin.settings.highlightEnabled = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Bouton dans la barre d'état")
      .setDesc(
        "Afficher un bouton d'activation/désactivation"
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.highlightButton)
          .onChange(async (value) => {
            this.plugin.settings.highlightButton = value;
            await this.plugin.saveSettings();
          })
      );

      new Setting(containerEl)
      .setName("Bouton dans la barre de titre")
      .setDesc(
          "Afficher un bouton d'activation/désactivation dans la barre de titre des onglets"
      )
      .addToggle((toggle) =>
          toggle
              .setValue(this.plugin.settings.tabTitleBarButton)
              .onChange(async (value) => {
                  this.plugin.settings.tabTitleBarButton = value;
                  await this.plugin.saveSettings();
              })
      );


  }
}
