import { IsArray, IsString, IsNotEmpty, MinLength, Matches, ArrayMaxSize, ArrayMinSize, IsOptional } from 'class-validator';

export class BulkEnrichDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1, { message: 'At least one ticket ID is required' })
  @ArrayMaxSize(100, { message: 'Cannot enrich more than 100 tickets at a time' })
  ticketIds!: string[];

  @IsString()
  @IsOptional()
  @MinLength(1)
  repositoryOwner?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  repositoryName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9/_.-]+$/, {
    message: 'branch must contain only alphanumeric, /, -, _, .',
  })
  branch?: string;
}
