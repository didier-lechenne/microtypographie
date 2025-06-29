// Fichier typographyRules.ts simplifié

import { MicrotypographieSettings } from "../settings/settings";

/**
 * Interface pour une règle typographique
 */
export interface TypographicRule {
  reg: RegExp;
  repl: string;
}

/**
 * Structure pour l'ensemble des règles compilées
 */
export interface CompiledRules {
  frenchRules: TypographicRule[]; // Règles typographiques françaises
  dashRules: TypographicRule[]; // Règles pour les tirets
}

// Définir les règles typographiques françaises
const FRENCH_RULES: TypographicRule[] = [
  // Règles orthographiques
  { reg: /(X|I|V)ème/g, repl: "$1e" },
  { reg: /(X|I|V)eme/g, repl: "$1e" },
  { reg: /(X|I|V)éme/g, repl: "$1e" },
  { reg: /oe/g, repl: "œ" },
  { reg: /OE/g, repl: "Œ" },
  { reg: /Oe/g, repl: "Œ" },
  { reg: /ae/g, repl: "æ" },
  { reg: /AE/g, repl: "Æ" },
  { reg: /Ae/g, repl: "Æ" },

  // real apostrophe
  { reg: /\'/g, repl: "'" },
  // real suspension points
  { reg: /\.{3,}/g, repl: "\u2026" },
  // delete all spaces after «‹"[(
  { reg: /([«‹"\[(])\s+/g, repl: "$1" },
  // delete all spaces before punctuation !?;:»›")].,
  { reg: /\s+([!?;:»›")\]\.\,])/g, repl: "$1" },
  // add narrow no break space before !?;»›
  { reg: /([!?;»›])/g, repl: "\u202F$1" },
  // add no break space before : (correctly handling existing spaces, but avoiding URLs)
  { reg: /\s+(:)(?!\/\/)/g, repl: "\u00A0$1" },
  { reg: /([^\s:\/])(:)(?!\/\/)/g, repl: "$1\u00A0$2" },

  // add narrow no break space after «‹
  { reg: /([«‹])/g, repl: "$1\u202F" },
  // no break space after one letter words
  { reg: /\s+([a-zà])\s+/gi, repl: " $1\u00A0" },
  // no break space into names
  {
    reg: /([A-ZÀ-ÖØŒ])([A-Za-zÀ-ÖØ-öø-ÿœŒ]+)\s+([A-ZÀ-ÖØŒ])([A-Za-zÀ-ÖØ-öø-ÿœŒ]+)/g,
    repl: "$1$2\u00A0$3$4",
  },
  // no break space after abbreviation with period
  {
    reg: /([A-ZÀ-ÖØŒ]\.)\s+([A-ZÀ-ÖØŒ][A-Za-zÀ-ÖØ-öø-ÿœŒ]+)/g,
    repl: "$1\u00A0$2",
  },
  // no break space before 'siècles'
  { reg: /(X|I|V)(er|e)\s+siècle/g, repl: "$1$2\u00A0siècle" },
  // add sub
  { reg: /(X|I|V)(er|e)/g, repl: "$1<sup>$2</sup>" },
  // Transformer les guillemets simples à l'intérieur de guillemets doubles en guillemets anglais
  { reg: /(«\u202F[^»]*)'([^']*)'([^»]*\u202F»)/g, repl: '$1"$2"$3' },
  // ajouter espace après guillemet fermant suivi d'un mot
  { reg: /(»)([A-Za-zÀ-ÖØ-öø-ÿœŒ0-9])/g, repl: "$1 $2" },
  // Transformer les guillemets simples à l'intérieur de guillemets doubles en guillemets anglais
  { reg: /(«\u202F[^»]*)«\u202F([^»]*)\u202F»([^»]*\u202F»)/g, repl: '$1"$2"$3'  },
];

// Règles de base pour les espaces (non spécifiques au français)
const BASE_RULES: TypographicRule[] = [];

/**
 * Compile l'ensemble des règles typographiques en fonction des paramètres
 * @param settings Paramètres du plugin
 * @returns Ensemble des règles compilées
 */
export function compileRules(
  settings: MicrotypographieSettings
): CompiledRules {
  // Initialiser le tableau de règles
  let frenchRules: TypographicRule[] = [];

  // Règles pour les guillemets - approche par alternance
  frenchRules.push(
    // Remplacer tous les guillemets par une fonction personnalisée
    {
      reg: /"/g,
      repl: "QUOTE_PLACEHOLDER"
    },
    // Nettoyer tous les espaces après les placeholders de guillemets ouvrants
    {
      reg: /QUOTE_PLACEHOLDER\s+/g,
      repl: "QUOTE_PLACEHOLDER"
    },
    // Nettoyer tous les espaces avant les placeholders de guillemets fermants
    {
      reg: /\s+QUOTE_PLACEHOLDER/g,
      repl: "QUOTE_PLACEHOLDER"
    }
  );

  // Apostrophe typographique personnalisable
  frenchRules.push({ reg: /\'/g, repl: settings.openSingleQuote });

  // Traitement des points de suspension si activé
  if (settings.ellipsisEnabled) {
    frenchRules.push({ reg: /\.{3,}/g, repl: "\u2026" });
  }

  // Règles pour les guillemets via chevrons si activés
  if (settings.guillemetsEnabled) {
    frenchRules.push({ reg: /<</g, repl: "«\u202F" }, { reg: />>/g, repl: "\u202F»" });
  }

  // Ajouter les règles françaises si activées
  if (settings.frenchRulesEnabled) {
    frenchRules = [...frenchRules, ...FRENCH_RULES];
    
    // Ajouter la règle pour les guillemets anglais dans les guillemets français
    frenchRules.push({ 
      reg: /(«\u202F[^»]*)«\u202F([^»]*)\u202F»([^»]*\u202F»)/g, 
      repl: '$1"$2"$3'  
    });
  } else {
    frenchRules = [...frenchRules, ...BASE_RULES];
  }

  // Créer les règles pour les tirets en fonction des paramètres
  const dashRules: TypographicRule[] = [];

  if (settings.dashesEnabled) {
    if (settings.skipEnDash) {
      // Mode direct: -- devient directement —
      dashRules.push({ reg: /--/g, repl: "—" });
    } else {
      // Mode progressif
      dashRules.push(
        { reg: /--/g, repl: "–" }, // -- devient –
        { reg: /–-/g, repl: "—" }, // –- devient —
        { reg: /—-/g, repl: "---" } // —- devient ---
      );
    }
  }

  return { frenchRules, dashRules };
}

/**
 * Traite les guillemets avec détection simple de l'imbrication par proximité
 * @param text Texte avec les placeholders QUOTE_PLACEHOLDER
 * @param openQuote Guillemet français ouvrant
 * @param closeQuote Guillemet français fermant
 * @returns Texte avec les guillemets traités
 */
function processQuotes(text: string, openQuote: string, closeQuote: string): string {
  let result = text;
  
  // Stratégie simple : chercher les paires de guillemets "proches" (imbriqués)
  // et les traiter différemment des paires "éloignées" (séparées)
  
  // Trouver toutes les positions
  const positions = [];
  let index = 0;
  while ((index = result.indexOf("QUOTE_PLACEHOLDER", index)) !== -1) {
    positions.push(index);
    index += "QUOTE_PLACEHOLDER".length;
  }
  
  // Grouper les guillemets par proximité
  const groups = [];
  let currentGroup = [];
  
  for (let i = 0; i < positions.length; i++) {
    currentGroup.push(i);
    
    // Si c'est le dernier ou si le suivant est "loin", fermer le groupe
    if (i === positions.length - 1 || 
        (i < positions.length - 1 && 
         positions[i + 1] - positions[i] > 100)) { // Plus de 100 caractères = groupe séparé
      
      groups.push([...currentGroup]);
      currentGroup = [];
    }
  }
  
  // Déterminer le type de chaque guillemet
  const replacements = new Array(positions.length);
  
  for (const group of groups) {
    if (group.length === 2) {
      // Groupe de 2 = paire simple
      replacements[group[0]] = openQuote;  // ouvrant
      replacements[group[1]] = closeQuote; // fermant
    } else if (group.length === 4) {
      // Groupe de 4 = imbrication probable
      replacements[group[0]] = openQuote;  // ouvrant principal
      replacements[group[1]] = ' “';        // ouvrant imbriqué
      replacements[group[2]] = '” ';        // fermant imbriqué
      replacements[group[3]] = closeQuote; // fermant principal
    } else {
      // Autres cas : alternance simple dans le groupe
      for (let i = 0; i < group.length; i++) {
        const isOpening = (i % 2 === 0);
        replacements[group[i]] = isOpening ? openQuote : closeQuote;
      }
    }
  }
  
  // Remplacer dans l'ordre inverse pour préserver les indices
  for (let i = positions.length - 1; i >= 0; i--) {
    const start = positions[i];
    const end = start + "QUOTE_PLACEHOLDER".length;
    result = result.substring(0, start) + replacements[i] + result.substring(end);
  }
  
  return result;
}

/**
 * Applique une série de règles typographiques à un texte
 * @param text Texte d'entrée
 * @param rules Règles à appliquer
 * @param settings Paramètres pour le traitement des guillemets
 * @returns Texte transformé
 */
export function applyRules(text: string, rules: TypographicRule[], settings?: MicrotypographieSettings): string {
  let result = text;
  for (const rule of rules) {
    const before = result;
    result = result.replace(rule.reg, rule.repl);
    if (before !== result) {
      console.log("🔄 Règle appliquée:");
      console.log("   Regex:", rule.reg);
      console.log("   Avant:", before);
      console.log("   Après:", result);
      console.log("---");
    }
  }
  
  // Traitement spécial des guillemets si des paramètres sont fournis
  if (settings && result.includes("QUOTE_PLACEHOLDER")) {
    console.log("🔄 Traitement des guillemets par alternance");
    console.log("   Avant:", result);
    result = processQuotes(result, settings.openDoubleQuote, settings.closeDoubleQuote);
    console.log("   Après:", result);
    console.log("---");
  }
  
  return result;
}