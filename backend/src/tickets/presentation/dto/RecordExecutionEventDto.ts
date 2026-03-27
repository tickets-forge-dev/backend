import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class RecordExecutionEventDto {
  @IsIn(['decision', 'risk', 'scope_change'])
  type!: 'decision' | 'risk' | 'scope_change';

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}
