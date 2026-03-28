import { IsString, IsIn, IsNotEmpty, ValidateIf, MaxLength } from 'class-validator';

export class ReviewDeliveryDto {
  @IsIn(['accept', 'request_changes'])
  action!: 'accept' | 'request_changes';

  @ValidateIf((o) => o.action === 'request_changes')
  @IsString()
  @IsNotEmpty({ message: 'Note is required when requesting changes' })
  @MaxLength(5000)
  note?: string;
}
