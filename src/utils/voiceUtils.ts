// ============================================================
// Italian Number Normalizer for Speech Recognition
// ============================================================

const ITALIAN_NUMBERS: Record<string, number> = {
  zero: 0,
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  undici: 11,
  dodici: 12,
  tredici: 13,
  quattordici: 14,
  quindici: 15,
  sedici: 16,
  diciassette: 17,
  diciotto: 18,
  diciannove: 19,
  venti: 20,
  trenta: 30,
  quaranta: 40,
  cinquanta: 50,
  sessanta: 60,
  settanta: 70,
  ottanta: 80,
  novanta: 90,
  cento: 100,
  duecento: 200,
};

// Compound numbers like "ventuno", "trentadue", "quarantacinque"
const COMPOUND_SUFFIXES: Record<string, number> = {
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
};

const TENS_PREFIXES: Record<string, number> = {
  vent: 20,
  trent: 20, // will be overridden
  quarant: 40,
  cinquant: 50,
  sessant: 60,
  settant: 70,
  ottant: 80,
  novant: 90,
};

// Fix tens prefixes
TENS_PREFIXES["trent"] = 30;

/**
 * Converts Italian number words to numeric values.
 * Handles: "dieci" -> 10, "venticinque" -> 25, "cento" -> 100,
 *          "ottanta" -> 80, "5" -> 5, "7,5" -> 7.5
 */
export function normalizeItalianNumber(input: string): number | null {
  if (!input) return null;

  const cleaned = input.trim().toLowerCase();

  // Already a digit (handle "7,5" -> 7.5 Italian decimal)
  const numericStr = cleaned.replace(",", ".");
  const asNum = parseFloat(numericStr);
  if (!isNaN(asNum)) return asNum;

  // Direct lookup
  if (ITALIAN_NUMBERS[cleaned] !== undefined) {
    return ITALIAN_NUMBERS[cleaned];
  }

  // Try compound numbers (e.g. "ventuno", "trentadue", "quarantacinque")
  for (const [prefix, tens] of Object.entries(TENS_PREFIXES)) {
    if (cleaned.startsWith(prefix)) {
      const suffix = cleaned.slice(prefix.length);
      // Handle elision: "vent" + "uno" = "ventuno" (vowel drop)
      // Also "a" prefix: "trenta" + "due" = "trentadue"
      const cleanSuffix = suffix.startsWith("a") ? suffix.slice(1) : suffix;
      if (COMPOUND_SUFFIXES[cleanSuffix] !== undefined) {
        return tens + COMPOUND_SUFFIXES[cleanSuffix];
      }
      // Check without elision too
      if (COMPOUND_SUFFIXES[suffix] !== undefined) {
        return tens + COMPOUND_SUFFIXES[suffix];
      }
    }
  }

  // "cento" + number: e.g. "centodieci" -> 110
  if (cleaned.startsWith("cento")) {
    const rest = cleaned.slice(5);
    if (!rest) return 100;
    const restNum = normalizeItalianNumber(rest);
    if (restNum !== null) return 100 + restNum;
  }

  return null;
}

/**
 * Extracts the first number (word or digit) from a transcript string.
 * Returns the captured word/number group ready for normalization.
 */
export function extractNumberToken(text: string, afterPattern: RegExp): string | null {
  const match = text.match(afterPattern);
  if (!match || !match[1]) return null;
  return match[1].trim();
}
