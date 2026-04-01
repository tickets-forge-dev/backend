/**
 * TitleValidator — Domain value object for ticket title quality validation.
 *
 * Deterministic, pure-function validation that catches gibberish input
 * ("jgg jg jhg jhk") without requiring external services.
 *
 * Heuristics:
 *  1. Minimum 3 words required
 *  2. At least 60% of words must contain a vowel (real words do)
 *  3. Words must average 3+ characters (filters "a b c d e f")
 *  4. No excessive character repetition within words ("jjjjj", "aaaa")
 */

const VOWELS = new Set('aeiouAEIOUàáâãäåèéêëìíîïòóôõöùúûüyYæøåÆØÅ');

export interface TitleValidationResult {
  valid: boolean;
  reason?: string;
}

export class TitleValidator {
  static validate(title: string): TitleValidationResult {
    const trimmed = title.trim();

    // Length checks
    if (trimmed.length < 3) {
      return { valid: false, reason: 'Title must be at least 3 characters' };
    }
    if (trimmed.length > 5000) {
      return { valid: false, reason: 'Title must be 5000 characters or less' };
    }

    const words = trimmed.split(/\s+/).filter(Boolean);

    // Minimum word count
    if (words.length < 3) {
      return { valid: false, reason: 'Title must be at least 3 words — describe what you need' };
    }

    // Average word length — filters "a b c d e f g"
    const totalChars = words.reduce((sum, w) => sum + w.length, 0);
    const avgLen = totalChars / words.length;
    if (avgLen < 3) {
      return { valid: false, reason: 'Title words are too short — use descriptive words' };
    }

    // Vowel check — real words in most languages contain vowels
    const wordsWithVowel = words.filter((w) =>
      [...w].some((ch) => VOWELS.has(ch)),
    );
    const vowelRatio = wordsWithVowel.length / words.length;
    if (vowelRatio < 0.5) {
      return { valid: false, reason: 'Title doesn\'t appear to contain meaningful words' };
    }

    // Repeated character check — "jjjjj" or "hhhh" in any word
    const hasExcessiveRepetition = words.some((w) =>
      /(.)\1{2,}/i.test(w),
    );
    if (hasExcessiveRepetition) {
      return { valid: false, reason: 'Title contains repeated characters — use real words' };
    }

    return { valid: true };
  }
}
