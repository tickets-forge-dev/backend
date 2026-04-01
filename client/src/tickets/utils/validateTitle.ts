/**
 * Client-side title quality validation — mirrors backend TitleValidator.
 *
 * Catches gibberish ("jgg jg jhg jhk") before the request is sent.
 */

const VOWELS = new Set('aeiouAEIOUàáâãäåèéêëìíîïòóôõöùúûüyYæøåÆØÅ');

export interface TitleValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateTitle(title: string): TitleValidationResult {
  const trimmed = title.trim();

  if (trimmed.length < 3) {
    return { valid: false, reason: 'Title must be at least 3 characters' };
  }
  if (trimmed.length > 5000) {
    return { valid: false, reason: 'Description must be 5000 characters or less' };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length < 3) {
    return { valid: false, reason: 'Describe what you need in at least 3 words' };
  }

  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  if (totalChars / words.length < 3) {
    return { valid: false, reason: 'Use descriptive words, not single characters' };
  }

  const wordsWithVowel = words.filter((w) =>
    [...w].some((ch) => VOWELS.has(ch)),
  );
  if (wordsWithVowel.length / words.length < 0.5) {
    return { valid: false, reason: 'Title doesn\'t appear to contain meaningful words' };
  }

  if (words.some((w) => /(.)\1{2,}/i.test(w))) {
    return { valid: false, reason: 'Title contains repeated characters — use real words' };
  }

  return { valid: true };
}
