// src/core/typographyRules.ts - Version optimisée complète

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
  frenchRules: TypographicRule[];
  dashRules: TypographicRule[];
}

/**
 * Classe optimisée pour compiler et mettre en cache les règles typographiques
 */
class CompiledTypographyRules {
  private static compiledRules: Map<string, CompiledRules> = new Map();

  /**
   * Compile et met en cache les règles pour éviter la recompilation
   */
  static getCompiledRules(settings: MicrotypographieSettings): CompiledRules {
    const key = this.createSettingsKey(settings);
    
    if (!this.compiledRules.has(key)) {
      this.compiledRules.set(key, this.compileOptimizedRules(settings));
    }
    
    return this.compiledRules.get(key)!;
  }

  private static createSettingsKey(settings: MicrotypographieSettings): string {
    return JSON.stringify({
      openDoubleQuote: settings.openDoubleQuote,
      closeDoubleQuote: settings.closeDoubleQuote,
      openSingleQuote: settings.openSingleQuote,
      frenchRulesEnabled: settings.frenchRulesEnabled,
      dashesEnabled: settings.dashesEnabled,
      skipEnDash: settings.skipEnDash,
      ellipsisEnabled: settings.ellipsisEnabled,
      guillemetsEnabled: settings.guillemetsEnabled
    });
  }

  private static compileOptimizedRules(settings: MicrotypographieSettings): CompiledRules {
    const frenchRules: TypographicRule[] = [];

    // === RÈGLES DE BASE (toujours actives) ===
    
    // Apostrophes - pattern très spécifique
    if (settings.openSingleQuote !== "'") {
      frenchRules.push({ 
        reg: /'/g, 
        repl: settings.openSingleQuote 
      });
    }

    // Points de suspension - pattern atomique
    if (settings.ellipsisEnabled) {
      frenchRules.push({ 
        reg: /\.{3,}/g, 
        repl: "…" 
      });
    }

    // Guillemets via chevrons - patterns atomiques
    if (settings.guillemetsEnabled) {
      frenchRules.push(
        { reg: /<</g, repl: "«\u202F" },
        { reg: />>/g, repl: "\u202F»" }
      );
    }

    // === GUILLEMETS PERSONNALISÉS ===
    // Pattern optimisé pour éviter le backtracking
    frenchRules.push({
      reg: new RegExp(`"([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0153\u0152])`, "g"),
      repl: settings.openDoubleQuote + "$1"
    });

    frenchRules.push({
      reg: new RegExp(`([A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0153\u0152][!?;:.,]?)\\s*"`, "g"),
      repl: "$1" + settings.closeDoubleQuote
    });

    // === RÈGLES FRANÇAISES COMPLÈTES ===
    if (settings.frenchRulesEnabled) {
      frenchRules.push(
        // Ligatures - patterns spécifiques et rapides
        { reg: /\boe\b/g, repl: "œ" },
        { reg: /\bOe\b/g, repl: "Œ" },
        { reg: /\bOE\b/g, repl: "Œ" },
        { reg: /\bae\b/g, repl: "æ" },
        { reg: /\bAe\b/g, repl: "Æ" },
        { reg: /\bAE\b/g, repl: "Æ" },

        // Ordinaux - patterns non-greedy
        { reg: /(X|I|V)(ème|eme|éme)/g, repl: "$1e" },

        // Nettoyer les espaces normaux SEULEMENT (préserver les espaces fines)
        { reg: /[ \t]+([!?;:»›")\]\.\,])/g, repl: "$1" },

        // Espaces typographiques - application directe
        { reg: /([!?;»›])/g, repl: "\u202F$1" },
        { reg: /([^\s:\/])(:)(?!\/\/)/g, repl: "$1\u00A0$2" },

        // Guillemets avec cleanup atomique
        { reg: /([«‹])\s*/g, repl: "$1\u202F" },

        // Mots courts - pattern très spécifique
        { reg: /\s([aày])\s/gi, repl: " $1\u00A0" },

        // Noms composés
        {
          reg: /([A-ZÀ-ÖØŒ])([A-Za-zÀ-ÖØ-öø-ÿœŒ]+)\s+([A-ZÀ-ÖØŒ])([A-Za-zÀ-ÖØ-öø-ÿœŒ]+)/g,
          repl: "$1$2\u00A0$3$4",
        },

        // Abréviations - pattern précis
        {
          reg: /([A-ZÀ-ÖØŒ]\.)\s+([A-ZÀ-ÖØŒ][A-Za-zÀ-ÖØ-öø-ÿœŒ]+)/g,
          repl: "$1\u00A0$2",
        },

        // Siècles - pattern non-ambigu
        { reg: /(X|I|V)(er|e)\s+siècle/g, repl: "$1$2\u00A0siècle" },

        // Exposants après siècles
        { reg: /(X|I|V)(er|e)/g, repl: "$1<sup>$2</sup>" },

        // Guillemets imbriqués
        { reg: /(«\u202F[^»]*)'([^']*)'([^»]*\u202F»)/g, repl: '$1“$2”$3' },
        { reg: /(«\u202F[^»]*)«\u202F([^»]*)\u202F»([^»]*\u202F»)/g, repl: '$1“$2”$3' },

        // Espace après guillemet fermant
        // { reg: /(»)([A-Za-zÀ-ÖØ-öø-ÿœŒ0-9])/g, repl: "$1 $2" }
      );
    }

    // === RÈGLES POUR TIRETS ===
    const dashRules: TypographicRule[] = [];
    
    if (settings.dashesEnabled) {
      if (settings.skipEnDash) {
        dashRules.push({ reg: /--/g, repl: "—" });
      } else {
        dashRules.push(
          { reg: /--/g, repl: "–" },
          { reg: /–-/g, repl: "—" },
          { reg: /—-/g, repl: "---" }
        );
      }
    }

    return { frenchRules, dashRules };
  }

  /**
   * Nettoie le cache (utile pour les tests ou changements fréquents)
   */
  static clearCache(): void {
    this.compiledRules.clear();
  }
}

// === FONCTIONS PUBLIQUES ===

/**
 * Compile l'ensemble des règles typographiques en fonction des paramètres
 * Version optimisée avec cache
 */
export function compileRules(settings: MicrotypographieSettings): CompiledRules {
  return CompiledTypographyRules.getCompiledRules(settings);
}

/**
 * Version optimisée d'application des règles
 */
export function applyRules(text: string, rules: TypographicRule[]): string {
  // Éviter le traitement si le texte est vide
  if (!text || text.length === 0) {
    return text;
  }

  let result = text;
  
  // Appliquer les règles de façon séquentielle
  for (const rule of rules) {
    // Vérifier si la règle peut s'appliquer avant de l'exécuter
    if (rule.reg.test(result)) {
      // Reset le lastIndex pour les regex globales
      rule.reg.lastIndex = 0;
      result = result.replace(rule.reg, rule.repl);
    }
  }
  
  return result;
}

/**
 * Version avec timeout pour éviter les blocages
 */
export function applyRulesWithTimeout(
  text: string, 
  rules: TypographicRule[], 
  timeoutMs: number = 1000
): string {
  const startTime = Date.now();
  let result = text;
  
  for (const rule of rules) {
    // Vérifier le timeout à chaque règle
    if (Date.now() - startTime > timeoutMs) {
      console.warn('Typography rules timeout reached');
      break;
    }
    
    if (rule.reg.test(result)) {
      rule.reg.lastIndex = 0;
      result = result.replace(rule.reg, rule.repl);
    }
  }
  
  return result;
}

/**
 * Nettoie le cache des règles compilées
 * Utile lors de changements de paramètres ou pour les tests
 */
export function clearRulesCache(): void {
  CompiledTypographyRules.clearCache();
}