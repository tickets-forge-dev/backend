import { IsString, IsOptional } from 'class-validator';

/**
 * DTO for adding a design reference to a ticket
 *
 * Validates URL format (must be HTTPS)
 * Platform detection happens automatically
 */
export class AddDesignReferenceDto {
  @IsString({ message: 'URL must be a string' })
  url!: string;

  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;
}
