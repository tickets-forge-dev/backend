import { IsString, MinLength, MaxLength } from 'class-validator';

export class RenameFolderDto {
  @IsString()
  @MinLength(1, { message: 'Folder name cannot be empty' })
  @MaxLength(100, { message: 'Folder name cannot exceed 100 characters' })
  name!: string;
}
