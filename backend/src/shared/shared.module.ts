import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './infrastructure/firebase/firebase.config';
import { LLMConfigService } from './infrastructure/mastra/llm.config';
import { GitHubApiService } from './infrastructure/github/github-api.service';

@Global()
@Module({
  providers: [
    FirebaseService,
    GitHubApiService,
  ],
  exports: [FirebaseService, GitHubApiService],
})
export class SharedModule {}
