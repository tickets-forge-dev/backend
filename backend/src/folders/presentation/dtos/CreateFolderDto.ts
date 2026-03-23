import { IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(1, { message: 'Folder name cannot be empty' })
  @MaxLength(100, { message: 'Folder name cannot exceed 100 characters' })
  name!: string;

  @IsOptional()
  @IsIn(['team', 'private'], { message: 'Folder scope must be "team" or "private"' })
  scope?: 'team' | 'private';
}
