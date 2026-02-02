/**
 * FileMetadata Value Object
 * 
 * Represents parsed metadata for a single code file.
 * Immutable value object - no framework dependencies (Clean Architecture).
 * 
 * Part of: Story 4.2 - Task 2 (Domain Models)
 * Layer: Domain
 */

export class FileMetadata {
  constructor(
    public readonly path: string,
    public readonly language: string,
    public readonly size: number,
    public readonly exports: string[],
    public readonly imports: string[],
    public readonly functions: string[],
    public readonly classes: string[],
    public readonly summary: string,
    public readonly loc: number, // Lines of code
    public readonly parseWarnings: string[],
  ) {}

  /**
   * Factory method for creating FileMetadata
   * Provides defaults for optional fields
   */
  static create(data: Partial<FileMetadata>): FileMetadata {
    return new FileMetadata(
      data.path || '',
      data.language || 'unknown',
      data.size || 0,
      data.exports || [],
      data.imports || [],
      data.functions || [],
      data.classes || [],
      data.summary || '',
      data.loc || 0,
      data.parseWarnings || [],
    );
  }

  /**
   * Check if file was successfully parsed (has extracted symbols)
   */
  isParsed(): boolean {
    return (
      this.exports.length > 0 ||
      this.imports.length > 0 ||
      this.functions.length > 0 ||
      this.classes.length > 0
    );
  }

  /**
   * Check if file has parsing errors/warnings
   */
  hasWarnings(): boolean {
    return this.parseWarnings.length > 0;
  }

  /**
   * Get total symbol count (exports + functions + classes)
   */
  getSymbolCount(): number {
    return this.exports.length + this.functions.length + this.classes.length;
  }
}
