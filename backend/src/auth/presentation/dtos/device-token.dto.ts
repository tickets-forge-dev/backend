import { IsString, IsNotEmpty } from 'class-validator';

export class DeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  deviceCode!: string;
}
