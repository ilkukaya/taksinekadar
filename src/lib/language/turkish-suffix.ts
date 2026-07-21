/**
 * Turkish case-suffix generator for proper nouns (province/district names).
 *
 * TDK orthography rule for proper nouns: the suffix attaches after an apostrophe and
 * the stem's spelling never changes (no consonant softening of the stem itself — e.g.
 * "Zonguldak'a", not "Zonguldağ'a"). Only two things vary:
 *   1. Vowel harmony picks the suffix's own vowel from the stem's LAST vowel.
 *   2. A handful of suffixes need a buffer consonant ("y" for dative, "n" for genitive)
 *      when the stem ends in a vowel, and/or devoice their leading consonant
 *      (d/t alternation) when the stem ends in one of the voiceless consonants
 *      {p, ç, t, k, s, ş, h, f}.
 */

const BACK_UNROUNDED = new Set(["a", "ı"]);
const BACK_ROUNDED = new Set(["o", "u"]);
const FRONT_UNROUNDED = new Set(["e", "i"]);
const FRONT_ROUNDED = new Set(["ö", "ü"]);

const VOWELS = new Set<string>([
  ...BACK_UNROUNDED,
  ...BACK_ROUNDED,
  ...FRONT_UNROUNDED,
  ...FRONT_ROUNDED,
]);

/** "FISTIKÇI ŞAHAP" mnemonic: consonants that devoice a following D/T-initial suffix. */
const VOICELESS_CONSONANTS = new Set(["p", "ç", "t", "k", "s", "ş", "h", "f"]);

/** Case-folds a single Turkish letter without relying on locale-dependent toLowerCase(). */
function toTurkishLower(char: string): string {
  switch (char) {
    case "İ":
      return "i";
    case "I":
      return "ı";
    case "Ç":
      return "ç";
    case "Ğ":
      return "ğ";
    case "Ö":
      return "ö";
    case "Ş":
      return "ş";
    case "Ü":
      return "ü";
    default:
      return char.toLowerCase();
  }
}

function lastLetter(word: string): string {
  const trimmed = word.trim();
  return toTurkishLower(trimmed[trimmed.length - 1] ?? "");
}

function findLastVowel(word: string): string | null {
  const trimmed = word.trim();
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const ch = toTurkishLower(trimmed[i]);
    if (VOWELS.has(ch)) return ch;
  }
  return null;
}

function endsInVowel(word: string): boolean {
  return VOWELS.has(lastLetter(word));
}

function endsInVoicelessConsonant(word: string): boolean {
  return VOICELESS_CONSONANTS.has(lastLetter(word));
}

function isBackVowel(vowel: string): boolean {
  return BACK_UNROUNDED.has(vowel) || BACK_ROUNDED.has(vowel);
}

/** Four-way (I-type) harmony group used by the genitive suffix. */
function fourWayGroup(vowel: string): "ı" | "i" | "u" | "ü" {
  if (BACK_UNROUNDED.has(vowel)) return "ı";
  if (FRONT_UNROUNDED.has(vowel)) return "i";
  if (BACK_ROUNDED.has(vowel)) return "u";
  return "ü";
}

/** Two-way (A-type) harmony vowel used by locative/dative/ablative suffixes. */
function twoWayVowel(word: string): "a" | "e" {
  const vowel = findLastVowel(word);
  return vowel && isBackVowel(vowel) ? "a" : "e";
}

/** Locative case (-DA/-TA): "nerede?" — e.g. İstanbul'da, Beşiktaş'ta. */
export function getLocativeSuffix(word: string): string {
  const consonant = endsInVoicelessConsonant(word) ? "t" : "d";
  return `${consonant}${twoWayVowel(word)}`;
}

/** Ablative case (-DAN/-TEN): "nereden?" — e.g. İstanbul'dan, Beşiktaş'tan. */
export function getAblativeSuffix(word: string): string {
  const consonant = endsInVoicelessConsonant(word) ? "t" : "d";
  return `${consonant}${twoWayVowel(word)}n`;
}

/** Dative case (-(y)A): "nereye?" — e.g. İstanbul'a, Ankara'ya. */
export function getDativeSuffix(word: string): string {
  const buffer = endsInVowel(word) ? "y" : "";
  return `${buffer}${twoWayVowel(word)}`;
}

/** Genitive/possessive case (-(n)In): "neresinin?" — e.g. İstanbul'un, Ankara'nın. */
export function getGenitiveSuffix(word: string): string {
  const vowel = findLastVowel(word);
  const group = vowel ? fourWayGroup(vowel) : "ı";
  const buffer = endsInVowel(word) ? "n" : "";
  return `${buffer}${group}n`;
}

/** Joins a proper noun with an apostrophe + suffix, per TDK orthography. */
export function formatProperNounSuffix(word: string, suffix: string): string {
  return `${word}'${suffix}`;
}

export function locativeOf(word: string): string {
  return formatProperNounSuffix(word, getLocativeSuffix(word));
}

export function dativeOf(word: string): string {
  return formatProperNounSuffix(word, getDativeSuffix(word));
}

export function ablativeOf(word: string): string {
  return formatProperNounSuffix(word, getAblativeSuffix(word));
}

export function genitiveOf(word: string): string {
  return formatProperNounSuffix(word, getGenitiveSuffix(word));
}
