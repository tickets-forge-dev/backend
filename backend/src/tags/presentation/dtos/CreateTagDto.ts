import { IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MinLength(1, { message: 'Tag name cannot be empty' })
  @MaxLength(50, { message: 'Tag name cannot exceed 50 characters' })
  name!: string;

  @IsString()
  @IsIn(['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'], {
    message: 'Tag color must be one of: red, orange, yellow, green, teal, blue, purple, pink',
  })
  color!: string;

  @IsOptional()
  @IsIn(['team', 'private'], { message: 'Tag scope must be "team" or "private"' })
  scope?: 'team' | 'private';
}
