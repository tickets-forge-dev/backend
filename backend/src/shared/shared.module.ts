import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './infrastructure/firebase/firebase.config';
import { LLMConfigService } from './infrastructure/mastra/llm.config';
import { MastraContentGenerator } from './infrastructure/mastra/MastraContentGenerator';
import { LLM_CONTENT_GENERATOR } from './application/ports/ILLMContentGenerator';

@Global()
@Module({
  providers: [
    FirebaseService,
    LLMConfigService,
    {
      provide: 'FIRESTORE',
      useFactory: (firebaseService: FirebaseService) => {
        return firebaseService.getFirestore();
      },
      inject: [FirebaseService],
    },
    {
      provide: LLM_CONTENT_GENERATOR,
      useClass: MastraContentGenerator,
    },
  ],
  exports: [FirebaseService, 'FIRESTORE', LLM_CONTENT_GENERATOR, LLMConfigService],
})
export class SharedModule {}
