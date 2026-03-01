import { IsString, ValidateIf } from 'class-validator';

export class MoveTicketDto {
  @ValidateIf((o) => o.folderId !== null && o.folderId !== undefined)
  @IsString()
  folderId?: string | null; // null or absent = move to root (unfiled)
}
