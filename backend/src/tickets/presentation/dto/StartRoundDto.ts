import { IsInt, Min, Max } from 'class-validator';

export class StartRoundDto {
  @IsInt()
  @Min(1)
  @Max(3)
  roundNumber!: number;
}
