import { Injectable } from '@nestjs/common';
import { TicketInputValidatorAgent } from '../../../validation/agents/TicketInputValidatorAgent';

export interface ValidateInputCommand {
  input: string;
}

export interface ValidationResult {
  isValid: boolean;
  processedInput: string;
  message?: string;
}

@Injectable()
export class ValidateInputUseCase {
  constructor(private validatorAgent: TicketInputValidatorAgent) {}

  async execute(command: ValidateInputCommand): Promise<ValidationResult> {
    const { input } = command;

    console.log('🔍 [ValidateInputUseCase] Validating user input, length:', input.length);

    // Basic checks first (fast, no LLM needed)
    if (!input || input.trim().length === 0) {
      return {
        isValid: false,
        processedInput: input,
        message: 'Input cannot be empty. Please describe what you want to create.',
      };
    }

    if (input.trim().length < 3) {
      return {
        isValid: false,
        processedInput: input,
        message: 'Input is too short. Please provide at least a few characters.',
      };
    }

    // Use dedicated validator agent for garbage detection
    const result = await this.validatorAgent.validate(input.trim());

    if (!result.isValid && result.message) {
      console.log('❌ [ValidateInputUseCase] Input rejected:', result.message);
    } else {
      console.log('✅ [ValidateInputUseCase] Input accepted');
    }

    return {
      isValid: result.isValid,
      processedInput: result.processedInput,
      message: result.message,
    };
  }
}
