import { IsString } from 'class-validator';

export class StartSessionDto {
  @IsString()
  ticketId!: string;
}
