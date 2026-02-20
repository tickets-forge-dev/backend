import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class DeviceVerifyDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/, {
    message: 'userCode must be in the format XXXX-XXXX',
  })
  userCode!: string;
}
