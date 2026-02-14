import { Injectable, Logger } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Design token extracted from Figma
 */
export interface DesignToken {
  name: string;
  value: string;
  type: 'color' | 'typography' | 'spacing' | 'radius' | 'shadow';
  description?: string;
}

/**
 * Extracted design tokens from a Figma file
 */
export interface ExtractedDesignTokens {
  colors: DesignToken[];
  typography: DesignToken[];
  spacing: DesignToken[];
  radius: DesignToken[];
  shadows: DesignToken[];
  raw?: Record<string, any>; // Full Figma styles response for debugging
}

/**
 * FigmaTokensService
 * 
 * Extracts design tokens (colors, typography, spacing, etc.) from Figma files
 * Provides structured token data for LLM-driven design-aware specs
 */
@Injectable()
export class FigmaTokensService {
  private readonly logger = new Logger(FigmaTokensService.name);

  /**
   * Extract design tokens from Figma file
   * 
   * Attempts to fetch file styles (colors, typography, etc.) and parse them
   * Falls back gracefully if API doesn't support styles or tokens
   * 
   * @param fileKey - Figma file key (extracted from URL)
   * @param accessToken - Figma API access token
   * @returns Extracted design tokens organized by type
   */
  async extractTokens(fileKey: string, accessToken: string): Promise<ExtractedDesignTokens> {
    try {
      // Fetch file details (includes components and styles)
      const fileDetails = await this.fetchFileDetails(fileKey, accessToken);
      
      // Extract tokens from file styles
      const tokens = this.parseTokensFromFile(fileDetails);
      
      this.logger.debug(`Extracted tokens from Figma file ${fileKey}: ${tokens.colors.length} colors, ${tokens.typography.length} typography`);
      
      return tokens;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to extract design tokens from Figma file ${fileKey}: ${errorMessage}`);
      
      // Return empty tokens structure - not a failure
      return {
        colors: [],
        typography: [],
        spacing: [],
        radius: [],
        shadows: [],
      };
    }
  }

  /**
   * Fetch Figma file details including styles/variables
   * @private
   */
  private async fetchFileDetails(fileKey: string, accessToken: string): Promise<any> {
    try {
      const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': accessToken,
        },
      });

      if (response.status === 404) {
        throw new Error(`Figma file ${fileKey} not found`);
      }

      if (response.status === 403) {
        throw new Error(`Access denied to Figma file ${fileKey}`);
      }

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch Figma file details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse design tokens from Figma file structure
   * @private
   */
  private parseTokensFromFile(fileDetails: any): ExtractedDesignTokens {
    const tokens: ExtractedDesignTokens = {
      colors: [],
      typography: [],
      spacing: [],
      radius: [],
      shadows: [],
      raw: fileDetails,
    };

    if (!fileDetails) return tokens;

    // Extract from file-level styles (if available)
    if (fileDetails.styles) {
      tokens.colors.push(...this.extractColorsFromStyles(fileDetails.styles));
      tokens.typography.push(...this.extractTypographyFromStyles(fileDetails.styles));
    }

    // Extract from components (design system components often define tokens)
    if (fileDetails.components) {
      const componentTokens = this.extractTokensFromComponents(fileDetails.components);
      tokens.colors.push(...(componentTokens.colors || []));
      tokens.spacing.push(...(componentTokens.spacing || []));
      tokens.radius.push(...(componentTokens.radius || []));
    }

    // Extract from document tree (frame names often contain token info)
    if (fileDetails.document) {
      const treeTokens = this.extractTokensFromTree(fileDetails.document);
      tokens.spacing.push(...(treeTokens.spacing || []));
      tokens.shadows.push(...(treeTokens.shadows || []));
    }

    // Deduplicate tokens (keep first occurrence)
    tokens.colors = this.deduplicateTokens(tokens.colors);
    tokens.typography = this.deduplicateTokens(tokens.typography);
    tokens.spacing = this.deduplicateTokens(tokens.spacing);
    tokens.radius = this.deduplicateTokens(tokens.radius);
    tokens.shadows = this.deduplicateTokens(tokens.shadows);

    return tokens;
  }

  /**
   * Extract color tokens from Figma styles
   * @private
   */
  private extractColorsFromStyles(styles: Record<string, any>): DesignToken[] {
    const colors: DesignToken[] = [];

    for (const [styleId, style] of Object.entries(styles)) {
      if (!style) continue;

      const styleData = style as any;
      
      // Look for color-related styles
      if (styleData.description?.toLowerCase().includes('color') || 
          styleData.name?.toLowerCase().includes('color')) {
        
        // Try to extract color value from style
        const color = this.extractColorValue(styleData);
        if (color) {
          colors.push({
            name: styleData.name || `Color-${styleId}`,
            value: color,
            type: 'color',
            description: styleData.description,
          });
        }
      }
    }

    return colors;
  }

  /**
   * Extract typography tokens from Figma styles
   * @private
   */
  private extractTypographyFromStyles(styles: Record<string, any>): DesignToken[] {
    const typography: DesignToken[] = [];

    for (const [styleId, style] of Object.entries(styles)) {
      if (!style) continue;

      const styleData = style as any;
      
      // Look for typography-related styles
      if (styleData.description?.toLowerCase().includes('typography') || 
          styleData.description?.toLowerCase().includes('font') ||
          styleData.name?.toLowerCase().includes('heading') ||
          styleData.name?.toLowerCase().includes('body') ||
          styleData.name?.toLowerCase().includes('text')) {
        
        typography.push({
          name: styleData.name || `Typography-${styleId}`,
          value: this.formatTypographyValue(styleData),
          type: 'typography',
          description: styleData.description,
        });
      }
    }

    return typography;
  }

  /**
   * Extract tokens from component definitions
   * @private
   */
  private extractTokensFromComponents(components: Record<string, any>): Partial<ExtractedDesignTokens> {
    const tokens: Partial<ExtractedDesignTokens> = {
      colors: [],
      spacing: [],
      radius: [],
    };

    for (const [id, component] of Object.entries(components)) {
      if (!component) continue;

      const comp = component as any;

      // Extract spacing hints from component names/descriptions
      const spacingMatch = comp.name?.match(/spacing[_-](\d+)/i);
      if (spacingMatch) {
        tokens.spacing?.push({
          name: comp.name,
          value: `${spacingMatch[1]}px`,
          type: 'spacing',
          description: `Spacing token extracted from component ${comp.name}`,
        });
      }

      // Extract radius hints
      const radiusMatch = comp.name?.match(/radius[_-](\d+)/i);
      if (radiusMatch) {
        tokens.radius?.push({
          name: comp.name,
          value: `${radiusMatch[1]}px`,
          type: 'radius',
          description: `Border radius token extracted from component ${comp.name}`,
        });
      }
    }

    return tokens;
  }

  /**
   * Extract tokens from document tree (frame names, etc.)
   * @private
   */
  private extractTokensFromTree(document: any): Partial<ExtractedDesignTokens> {
    const tokens: Partial<ExtractedDesignTokens> = {
      spacing: [],
      shadows: [],
    };

    const traverse = (node: any) => {
      if (!node) return;

      // Look for spacing grid sizes in frame names
      const spacingMatch = node.name?.match(/spacing[_-]grid[_-](\d+)/i);
      if (spacingMatch) {
        tokens.spacing?.push({
          name: `Spacing Grid ${spacingMatch[1]}`,
          value: `${spacingMatch[1]}px`,
          type: 'spacing',
        });
      }

      // Look for shadow definitions
      if (node.effects) {
        for (const effect of node.effects) {
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            tokens.shadows?.push({
              name: node.name || 'Shadow',
              value: this.formatShadowValue(effect),
              type: 'shadow',
            });
          }
        }
      }

      // Recursively traverse children
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(document);
    return tokens;
  }

  /**
   * Extract color value from style object
   * @private
   */
  private extractColorValue(style: any): string | null {
    // Check if style has fill color
    if (style.fills && Array.isArray(style.fills) && style.fills.length > 0) {
      const fill = style.fills[0];
      if (fill.color) {
        return this.rgbToHex(fill.color);
      }
    }

    // Check for stroke color
    if (style.strokes && Array.isArray(style.strokes) && style.strokes.length > 0) {
      const stroke = style.strokes[0];
      if (stroke.color) {
        return this.rgbToHex(stroke.color);
      }
    }

    return null;
  }

  /**
   * Format typography value for display
   * @private
   */
  private formatTypographyValue(style: any): string {
    const parts: string[] = [];

    if (style.fontFamily) parts.push(style.fontFamily);
    if (style.fontSize) parts.push(`${style.fontSize}px`);
    if (style.fontWeight) parts.push(`${style.fontWeight}w`);
    if (style.lineHeightPx) parts.push(`${style.lineHeightPx}px line-height`);

    return parts.join(', ') || 'Typography token';
  }

  /**
   * Format shadow value for display
   * @private
   */
  private formatShadowValue(effect: any): string {
    const offsetX = effect.offset?.x || 0;
    const offsetY = effect.offset?.y || 0;
    const radius = effect.radius || 0;
    const color = effect.color ? this.rgbToHex(effect.color) : '#000000';

    return `${offsetX}px ${offsetY}px ${radius}px ${color}`;
  }

  /**
   * Convert RGB to hex color
   * @private
   */
  private rgbToHex(rgb: { r?: number; g?: number; b?: number; a?: number }): string {
    const toHex = (value: number | undefined) => {
      if (value === undefined) return '00';
      return Math.round((value || 0) * 255)
        .toString(16)
        .padStart(2, '0');
    };

    const r = toHex(rgb.r);
    const g = toHex(rgb.g);
    const b = toHex(rgb.b);

    return `#${r}${g}${b}`.toUpperCase();
  }

  /**
   * Deduplicate tokens by name
   * @private
   */
  private deduplicateTokens(tokens: DesignToken[]): DesignToken[] {
    const seen = new Set<string>();
    return tokens.filter((token) => {
      if (seen.has(token.name)) return false;
      seen.add(token.name);
      return true;
    });
  }

  /**
   * Format extracted tokens for LLM consumption
   * 
   * Creates a readable string representation of design tokens
   * for inclusion in LLM prompts
   */
  formatTokensForLLM(tokens: ExtractedDesignTokens): string {
    const sections: string[] = [];

    if (tokens.colors.length > 0) {
      sections.push('## Color Palette');
      for (const color of tokens.colors.slice(0, 10)) {
        sections.push(`- **${color.name}**: ${color.value}`);
      }
      if (tokens.colors.length > 10) {
        sections.push(`- ... and ${tokens.colors.length - 10} more colors`);
      }
    }

    if (tokens.typography.length > 0) {
      sections.push('\n## Typography');
      for (const typo of tokens.typography.slice(0, 8)) {
        sections.push(`- **${typo.name}**: ${typo.value}`);
      }
      if (tokens.typography.length > 8) {
        sections.push(`- ... and ${tokens.typography.length - 8} more typography styles`);
      }
    }

    if (tokens.spacing.length > 0) {
      sections.push('\n## Spacing Scale');
      for (const space of tokens.spacing.slice(0, 10)) {
        sections.push(`- **${space.name}**: ${space.value}`);
      }
      if (tokens.spacing.length > 10) {
        sections.push(`- ... and ${tokens.spacing.length - 10} more spacing values`);
      }
    }

    if (tokens.radius.length > 0) {
      sections.push('\n## Border Radius');
      for (const rad of tokens.radius.slice(0, 5)) {
        sections.push(`- **${rad.name}**: ${rad.value}`);
      }
    }

    if (tokens.shadows.length > 0) {
      sections.push('\n## Shadows');
      for (const shadow of tokens.shadows.slice(0, 5)) {
        sections.push(`- **${shadow.name}**: ${shadow.value}`);
      }
    }

    return sections.length > 0 ? sections.join('\n') : '';
  }
}
