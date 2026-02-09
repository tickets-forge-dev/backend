import { IsString } from 'class-validator';

export class ImportFromLinearDto {
  @IsString()
  issueId!: string; // Accepts UUID or identifier like "FOR-123"
}
