import { DesignReference } from '../../domain/value-objects/DesignReference';

/**
 * DesignContextPromptBuilder
 * 
 * Formats design references with metadata into LLM-friendly context
 * Extracts design tokens, constraints, and visual expectations from Figma/Loom
 */
export class DesignContextPromptBuilder {
  static buildDesignContext(references: DesignReference[]): string {
    if (!references || references.length === 0) {
      return '';
    }

    const figmaReferences = references.filter(ref => ref.platform === 'figma' && ref.metadata?.figma);
    const loomReferences = references.filter(ref => ref.platform === 'loom' && ref.metadata?.loom);

    let context = '';

    // Add Figma design context
    if (figmaReferences.length > 0) {
      context += this.buildFigmaContext(figmaReferences);
    }

    // Add Loom context
    if (loomReferences.length > 0) {
      context += this.buildLoomContext(loomReferences);
    }

    return context;
  }

  private static buildFigmaContext(figmaReferences: DesignReference[]): string {
    let context = '## Design References (Figma)\n\n';
    context += 'The following Figma designs provide visual specifications for this feature:\n\n';

    for (const ref of figmaReferences) {
      const metadata = ref.metadata!.figma!;
      context += `### ${ref.title || metadata.fileName}\n`;
      context += `- **File**: ${metadata.fileName}\n`;
      context += `- **URL**: ${ref.url}\n`;
      context += `- **Last Modified**: ${new Date(metadata.lastModified).toLocaleDateString()}\n`;
      context += `- **File Key**: ${metadata.fileKey}\n\n`;

      // Include extracted design tokens if available (Phase 3)
      if (metadata.tokens) {
        context += '**Extracted Design Tokens**:\n';

        if (metadata.tokens.colors.length > 0) {
          context += '\n*Color Palette:*\n';
          for (const color of metadata.tokens.colors.slice(0, 5)) {
            context += `- ${color.name}: ${color.value}\n`;
          }
          if (metadata.tokens.colors.length > 5) {
            context += `- ... and ${metadata.tokens.colors.length - 5} more colors\n`;
          }
        }

        if (metadata.tokens.typography.length > 0) {
          context += '\n*Typography:*\n';
          for (const typo of metadata.tokens.typography.slice(0, 3)) {
            context += `- ${typo.name}: ${typo.value}\n`;
          }
          if (metadata.tokens.typography.length > 3) {
            context += `- ... and ${metadata.tokens.typography.length - 3} more typography styles\n`;
          }
        }

        if (metadata.tokens.spacing.length > 0) {
          context += '\n*Spacing Values:*\n';
          for (const space of metadata.tokens.spacing.slice(0, 3)) {
            context += `- ${space.name}: ${space.value}\n`;
          }
          if (metadata.tokens.spacing.length > 3) {
            context += `- ... and ${metadata.tokens.spacing.length - 3} more spacing values\n`;
          }
        }

        context += '\n';
      }

      context += `**Design Expectations**:\n`;
      context += `- Generate acceptance criteria matching the visual design\n`;
      context += `- Include pixel-perfect measurements in specs\n`;
      context += `- Reference component names from the design system\n`;
      context += `- Use extracted design tokens (colors, typography, spacing) in acceptance criteria\n`;
      context += `- Ensure implementation matches design tokens exactly\n\n`;
    }

    context += '**Design Token Usage Guidelines**:\n';
    context += '- Use the exact color codes provided in the Figma tokens\n';
    context += '- Apply typography styles (font family, sizes, weights) from design tokens\n';
    context += '- Use spacing/padding values from the extracted spacing tokens\n';
    context += '- Apply border radius values from design tokens\n';
    context += '- Use shadow definitions for box-shadow CSS\n';
    context += '- Reference component variants and states from design\n\n';

    return context;
  }

  private static buildLoomContext(loomReferences: DesignReference[]): string {
    let context = '## Video Context (Loom)\n\n';
    context += 'The following Loom videos provide additional context:\n\n';

    for (const ref of loomReferences) {
      const metadata = ref.metadata!.loom!;
      context += `### ${ref.title || metadata.videoTitle}\n`;
      context += `- **Title**: ${metadata.videoTitle}\n`;
      context += `- **Duration**: ${this.formatDuration(metadata.duration)}\n`;
      context += `- **URL**: ${ref.url}\n`;

      if (metadata.transcript) {
        context += `- **Transcript**: [Available]\n\n`;
        context += `Transcript excerpt:\n\`\`\`\n${metadata.transcript.substring(0, 500)}...\n\`\`\`\n\n`;
      }

      context += `**Context from Video**:\n`;
      context += `- Extract user flow and interaction patterns\n`;
      context += `- Note any design decisions or rationale discussed\n`;
      context += `- Include animation or transition expectations\n`;
      context += `- Reference any accessibility considerations mentioned\n\n`;
    }

    return context;
  }

  private static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Build design-aware system prompt for spec generation
   * Includes design context and pixel-perfect requirements
   */
  static buildDesignAwareSystemPrompt(
    basePrompt: string,
    designContext: string
  ): string {
    if (!designContext) {
      return basePrompt;
    }

    return `${basePrompt}

${designContext}

## Design-Driven Specification Guidelines

When generating acceptance criteria and technical specifications:

1. **Reference Design Files**: Link acceptance criteria to specific Figma frames/components
2. **Design Tokens**: Use exact color codes, font sizes, and spacing values from designs
3. **Pixel-Perfect**: Include precise measurements for layouts, typography, and spacing
4. **Component States**: Define states (hover, active, disabled) based on design variants
5. **Responsive Design**: Include breakpoint specifications from design system
6. **Accessibility**: Reference any a11y notes from designs or videos
7. **Visual Hierarchy**: Ensure specs maintain design-intended visual importance

Generate specs that a developer could implement by directly referencing the Figma file.`;
  }
}
