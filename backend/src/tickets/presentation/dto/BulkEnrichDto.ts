import { IsArray, IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class BulkEnrichDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ticketIds!: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  repositoryOwner!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  repositoryName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9/_-]+$/, {
    message: 'branch must contain only alphanumeric, /, -, _',
  })
  branch!: string;
}
