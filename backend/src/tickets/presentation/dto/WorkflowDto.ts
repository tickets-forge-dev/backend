import { IsString, IsNotEmpty } from 'class-validator';

export class ExecuteWorkflowDto {
  @IsString()
  @IsNotEmpty()
  aecId: string;
}

export class ResumeFindingsDto {
  @IsString()
  @IsNotEmpty()
  aecId: string;

  @IsString()
  @IsNotEmpty()
  action: 'proceed' | 'edit' | 'cancel';
}

export class SubmitAnswersDto {
  @IsString()
  @IsNotEmpty()
  aecId: string;

  answers: Record<string, string>;
}

export class SkipQuestionsDto {
  @IsString()
  @IsNotEmpty()
  aecId: string;
}

export class RetryStepDto {
  @IsString()
  @IsNotEmpty()
  aecId: string;

  stepId: number;
}
