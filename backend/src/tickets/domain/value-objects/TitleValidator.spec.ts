import { TitleValidator } from './TitleValidator';

describe('TitleValidator', () => {
  describe('rejects gibberish', () => {
    it('rejects random consonant clusters', () => {
      const result = TitleValidator.validate('jggt jght jhgk jhkm');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('meaningful words');
    });

    it('rejects short gibberish words', () => {
      const result = TitleValidator.validate('jgg jg jhg jhk');
      expect(result.valid).toBe(false);
    });

    it('rejects repeated characters', () => {
      const result = TitleValidator.validate('Add the jjjjj feature');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('repeated characters');
    });

    it('rejects single-character words', () => {
      const result = TitleValidator.validate('a b c d e f g');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('descriptive words');
    });

    it('rejects fewer than 3 words', () => {
      const result = TitleValidator.validate('fix bug');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('at least 3 words');
    });
  });

  describe('accepts valid titles', () => {
    it('accepts a normal feature request', () => {
      const result = TitleValidator.validate('Add password reset functionality for users');
      expect(result.valid).toBe(true);
    });

    it('accepts a bug report', () => {
      const result = TitleValidator.validate('Fix login page crash on mobile');
      expect(result.valid).toBe(true);
    });

    it('accepts titles with technical terms', () => {
      const result = TitleValidator.validate('Implement OAuth2 authentication flow');
      expect(result.valid).toBe(true);
    });

    it('accepts user story format', () => {
      const result = TitleValidator.validate('As a user I want to reset my password so I can regain access');
      expect(result.valid).toBe(true);
    });

    it('accepts titles with numbers and abbreviations', () => {
      const result = TitleValidator.validate('Update API v2 endpoint for GET requests');
      expect(result.valid).toBe(true);
    });
  });

  describe('length constraints', () => {
    it('rejects titles shorter than 3 characters', () => {
      const result = TitleValidator.validate('ab');
      expect(result.valid).toBe(false);
    });

    it('rejects titles longer than 5000 characters', () => {
      const longTitle = 'Add this feature '.repeat(300);
      const result = TitleValidator.validate(longTitle);
      expect(result.valid).toBe(false);
    });
  });
});
