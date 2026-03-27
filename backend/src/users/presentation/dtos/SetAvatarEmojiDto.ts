import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SetAvatarEmojiDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  emoji!: string;
}
