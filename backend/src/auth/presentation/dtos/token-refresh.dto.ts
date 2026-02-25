import { IsString, IsNotEmpty } from 'class-validator';

export class TokenRefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
