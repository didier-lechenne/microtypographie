// Fichier typographyRules.ts avec une solution simple pour l'imbrication

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
  { reg: /(«\u202F[^»]*)'([^']*)'([^»]*\u202F»)/g, repl: '$1“$2”$3' },
  // ajouter espace après guillemet fermant suivi d'un mot
  { reg: /(»)([A-Za-zÀ-ÖØ-öø-ÿœŒ0-9])/g, repl: "$1 $2" },
  // Transformer les guillemets simples à l'intérieur de guillemets doubles en guillemets anglais
  { reg: /(«\u202F[^»]*)«\u202F([^»]*)\u202F»([^»]*\u202F»)/g, repl: '$1“$2”$3'  },
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

  // Règles pour les guillemets - VERSION SIMPLIFIÉE
  frenchRules.push(
    // Remplacer tous les guillemets par un placeholder UNIQUEMENT
    {
      reg: /"/g,
      repl: "QUOTE_PLACEHOLDER"
    }
    // PLUS de règles de suppression d'espaces qui cassent la détection !
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
 * LOGIQUE SIMPLIFIÉE : 4 guillemets = imbrication, sauf si séparés par fin de phrase
 * Si le texte continue après le 3e guillemet (sans majuscule) = imbrication
 */
function processQuotes(text: string, openQuote: string, closeQuote: string): string {
  let result = text;
  
  // Compter les guillemets
  const totalQuotes = (result.match(/QUOTE_PLACEHOLDER/g) || []).length;
  
  if (totalQuotes === 4) {
    // Diviser le texte en segments par les guillemets
    const segments = result.split('QUOTE_PLACEHOLDER');
    
    if (segments.length === 5) {
      const segment1 = segments[1]; // Contenu entre 1er et 2e guillemet
      const segment2 = segments[2]; // Contenu entre 2e et 3e guillemet (potentiellement imbriqué)
      const segment3 = segments[3]; // Contenu entre 3e et 4e guillemet
      
      // console.log(`🔍 Analyse des segments:`);
      // console.log(`  Segment 1: "${segment1}"`);
      // console.log(`  Segment 2: "${segment2}"`);
      // console.log(`  Segment 3: "${segment3}"`);
      
      // LOGIQUE SIMPLE : si segment3 commence par minuscule ou espace+minuscule = continuation = imbrication
      const segment3StartsWithLowercase = /^\s*[a-zà-ÿ]/.test(segment3);
      
      // OU si segment2 est relativement court (< 50 caractères) ET segment3 n'est pas vide
      const segment2IsShort = segment2.length < 50;
      const segment3NotEmpty = segment3.trim().length > 0;
      
      if ((segment3StartsWithLowercase && segment3NotEmpty) || 
          (segment2IsShort && segment3NotEmpty && segment3StartsWithLowercase)) {
        
        // console.log(`✅ Imbrication détectée`);
        // console.log(`  segment3StartsWithLowercase: ${segment3StartsWithLowercase}`);
        // console.log(`  segment2IsShort: ${segment2IsShort}`);
        
        // Imbrication : français à l'extérieur, anglais à l'intérieur
        let tempResult = result;
        tempResult = tempResult.replace(/QUOTE_PLACEHOLDER/, openQuote);     // 1er : «
        tempResult = tempResult.replace(/QUOTE_PLACEHOLDER/, '“');           // 2e : "
        tempResult = tempResult.replace(/QUOTE_PLACEHOLDER/, '”');           // 3e : "
        tempResult = tempResult.replace(/QUOTE_PLACEHOLDER/, closeQuote);    // 4e : »
        return tempResult;
      } else {
        // console.log(`❌ Pas d'imbrication détectée`);
        // console.log(`  segment3StartsWithLowercase: ${segment3StartsWithLowercase}`);
        // console.log(`  segment2IsShort: ${segment2IsShort}`);
        // console.log(`  segment3NotEmpty: ${segment3NotEmpty}`);
      }
    }
  }
  
  // Cas standard : alternance simple (ouvrant/fermant)
  console.log(`🔄 Alternance simple pour ${totalQuotes} guillemets`);
  let quoteIndex = 0;
  result = result.replace(/QUOTE_PLACEHOLDER/g, () => {
    const isOpening = (quoteIndex % 2 === 0);
    quoteIndex++;
    return isOpening ? openQuote : closeQuote;
  });
  
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
      // console.log("🔄 Règle appliquée:");
      // console.log("   Regex:", rule.reg);
      // console.log("   Avant:", before);
      // console.log("   Après:", result);
      // console.log("---");
    }
  }
  
  // Traitement spécial des guillemets si des paramètres sont fournis
  if (settings && result.includes("QUOTE_PLACEHOLDER")) {
    // console.log("🔄 Traitement des guillemets par alternance");
    // console.log("   Avant:", result);
    result = processQuotes(result, settings.openDoubleQuote, settings.closeDoubleQuote);
    // console.log("   Après:", result);
    // console.log("---");
  }
  
  return result;
}