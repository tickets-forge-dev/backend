import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './infrastructure/firebase/firebase.config';
import { LLMConfigService } from './infrastructure/mastra/llm.config';
import { MastraContentGenerator } from './infrastructure/mastra/MastraContentGenerator';
import { LLM_CONTENT_GENERATOR } from './application/ports/ILLMContentGenerator';
import { GitHubApiService } from './infrastructure/github/github-api.service';

@Global()
@Module({
  providers: [
    FirebaseService,
    LLMConfigService,
    GitHubApiService,
    {
      provide: LLM_CONTENT_GENERATOR,
      useClass: MastraContentGenerator,
    },
  ],
  exports: [FirebaseService, LLM_CONTENT_GENERATOR, LLMConfigService, GitHubApiService],
})
export class SharedModule {}
