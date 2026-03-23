import { IsIn, IsOptional, IsBoolean } from 'class-validator';

export class UpdateFolderScopeDto {
  @IsIn(['team', 'private'], { message: 'Folder scope must be "team" or "private"' })
  scope!: 'team' | 'private';

  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}
