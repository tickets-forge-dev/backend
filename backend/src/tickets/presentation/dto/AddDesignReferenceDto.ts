import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO for adding a design reference to a ticket
 *
 * Validates:
 * - URL format (must be HTTPS)
 * - URL length constraints
 * - Title length constraints
 *
 * Platform detection happens automatically on backend
 */
export class AddDesignReferenceDto {
  @IsString({ message: 'URL must be a string' })
  @MinLength(14, { message: 'URL must be at least 14 characters (https://a.co)' })
  @MaxLength(2048, { message: 'URL must not exceed 2048 characters' })
  @Matches(/^https:\/\/.+/, { message: 'URL must use HTTPS protocol (https://)' })
  url!: string;

  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;
}
