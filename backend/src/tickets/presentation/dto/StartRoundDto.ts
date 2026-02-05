import { IsEnum } from 'class-validator';

export class StartRoundDto {
  @IsEnum([1, 2, 3])
  roundNumber!: 1 | 2 | 3;
}
