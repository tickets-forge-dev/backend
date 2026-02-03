import { Injectable } from '@nestjs/common';
import { Agent } from '@mastra/core/agent';
import { LLMConfigService } from '../../shared/infrastructure/mastra/llm.config';

export interface TicketInputValidationResult {
  isValid: boolean;
  processedInput: string;
  message?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Ticket Input Validator Agent
 * 
 * A lenient validator that only catches obvious garbage/nonsense.
 * Should accept ANY reasonable technical description, even if brief.
 * 
 * Philosophy: Better to let through something unclear than block legitimate input.
 */
@Injectable()
export class TicketInputValidatorAgent {
  constructor(private llmConfig: LLMConfigService) {}

  private createAgent(): Agent {
    const provider = this.llmConfig.getProvider();

    const agentConfig: any = {
      id: 'ticket-input-validator',
      name: 'Ticket Input Validator',
      instructions: `You are a lenient input validator for software ticket creation. 
Your job is to catch ONLY obvious garbage while accepting all reasonable technical descriptions.`,
    };

    if (provider === 'anthropic') {
      const apiKey = this.llmConfig.getAnthropicApiKey();
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not set in .env');
      }
      agentConfig.model = this.llmConfig.getModel();
      agentConfig.apiKeys = {
        ANTHROPIC_API_KEY: apiKey,
      };
    } else if (provider === 'ollama') {
      const { createOllamaProvider } = require('../../shared/infrastructure/mastra/providers/ollama.provider');
      agentConfig.model = {
        provider: createOllamaProvider(),
        name: this.llmConfig.getOllamaModel(),
      };
    } else {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    return new Agent(agentConfig);
  }

  async validate(input: string): Promise<TicketInputValidationResult> {
    console.log('🎯 [TicketInputValidator] Validating input, length:', input.length);

    try {
      const agent = this.createAgent();

      const prompt = `You are a LENIENT ticket input validator. Your goal is to ACCEPT most inputs and only reject OBVIOUS garbage.

PHILOSOPHY: When in doubt, ACCEPT the input. Better to let through something unclear than block legitimate work.

✅ ACCEPT (these are all valid):
- Any technical description, even if brief: "add user authentication", "fix the bug", "create API endpoint"
- Feature requests: "add login with email and password", "create dashboard"
- Bug descriptions: "fix upload issue", "resolve crash on startup"
- Improvements: "optimize database queries", "refactor payment module"
- Questions that imply work: "how to add OAuth?", "what about caching?"
- Brief statements: "user profiles", "search feature", "payment integration"
- Technical jargon: "implement JWT auth", "add Redux store", "setup CI/CD"
- Mixed language/technical terms: "add utilisateur authentication" (French + English)

❌ REJECT (only these obvious cases):
- Pure keyboard mashing: "asdfasdf", "jjjjjjj", "qweqweqwe", "fdgdfgdfg"
- Completely unrelated content: "I love cats", "What's for dinner?", "The weather is nice"
- Pure greetings with NO context: "hello", "hi", "hey there"
- Strings of numbers only: "12345", "999999"
- Single meaningless characters: "a", "x", ".", "???"

BORDERLINE CASES (when uncertain, ACCEPT):
- Short but technical: "auth" → ACCEPT (could mean authentication)
- Vague but actionable: "improve performance" → ACCEPT
- Questions: "add user login?" → ACCEPT (implies work needed)
- Mixed content: "hello, add login feature" → ACCEPT (has legitimate request)

Input to validate: "${input.replace(/"/g, '\\"')}"

Analyze and respond with ONLY this JSON (no markdown, no extra text):
{
  "isValid": boolean,
  "processedInput": "cleaned/improved version if valid, original if invalid",
  "confidence": "high|medium|low",
  "message": "ONLY if invalid, explain briefly and suggest improvement. Empty string if valid."
}

Remember: Be LENIENT. Most inputs should be accepted.`;

      const result = await agent.generate(prompt);
      const text = result.text || '';
      
      console.log('🎯 [TicketInputValidator] Agent response:', text);

      // Parse JSON - try multiple strategies
      let jsonMatch = text.match(/\{[\s\S]*?\}/);
      
      if (!jsonMatch) {
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonMatch = [codeBlockMatch[1]];
        }
      }

      if (!jsonMatch) {
        console.warn('⚠️  [TicketInputValidator] Could not parse JSON, defaulting to ACCEPT');
        // Default to accepting if we can't parse (lenient approach)
        return {
          isValid: true,
          processedInput: input.trim(),
          confidence: 'low',
        };
      }

      try {
        const validationResult = JSON.parse(jsonMatch[0]);

        // Validate structure
        if (typeof validationResult.isValid !== 'boolean') {
          console.warn('⚠️  [TicketInputValidator] Invalid structure, defaulting to ACCEPT');
          return {
            isValid: true,
            processedInput: input.trim(),
            confidence: 'low',
          };
        }

        console.log('🎯 [TicketInputValidator] Result:', validationResult.isValid ? '✅ ACCEPT' : '❌ REJECT', `(${validationResult.confidence})`);

        return {
          isValid: validationResult.isValid,
          processedInput: validationResult.processedInput || input.trim(),
          confidence: validationResult.confidence || 'medium',
          message: validationResult.message || undefined,
        };

      } catch (parseError) {
        console.error('❌ [TicketInputValidator] JSON parse error, defaulting to ACCEPT:', parseError);
        // Default to accepting on parse errors (lenient)
        return {
          isValid: true,
          processedInput: input.trim(),
          confidence: 'low',
        };
      }

    } catch (error: any) {
      console.error('❌ [TicketInputValidator] Validation error, defaulting to ACCEPT:', error.message);
      // Default to accepting on errors (lenient approach)
      return {
        isValid: true,
        processedInput: input.trim(),
        confidence: 'low',
      };
    }
  }
}
