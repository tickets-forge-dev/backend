import { IsString } from 'class-validator';

export class StartFinalizationDto {
  @IsString()
  ticketId!: string;
}
