import { IsString, Matches } from 'class-validator';

export class ImportFromJiraDto {
  @IsString()
  @Matches(/^[A-Z]+-\d+$/, {
    message: 'issueKey must be in format PROJECT-123',
  })
  issueKey!: string;
}
