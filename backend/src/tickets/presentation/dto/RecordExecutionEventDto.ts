import { IsString, IsIn, IsNotEmpty, MaxLength } from 'class-validator';

export class RecordExecutionEventDto {
  @IsIn(['decision', 'risk', 'scope_change'])
  type!: 'decision' | 'risk' | 'scope_change';

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description!: string;
}
