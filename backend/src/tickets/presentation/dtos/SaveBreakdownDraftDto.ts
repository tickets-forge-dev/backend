import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * SaveBreakdownDraftDto
 *
 * Placeholder DTO for draft saving.
 * The actual breakdown structure is complex and deeply nested.
 * Since we use localStorage on the frontend, this DTO is minimal.
 * Can be expanded if implementing Firestore persistence.
 */
export class SaveBreakdownDraftDto {
  @IsString()
  prdText: string = '';

  @IsString()
  @IsOptional()
  projectName?: string;

  @IsObject()
  @IsOptional()
  breakdown?: any;

  @IsObject()
  @IsOptional()
  analysisMetadata?: {
    analysisTime: number;
    totalTickets: number;
    epicCount: number;
  };
}
