import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './infrastructure/firebase/firebase.config';
import { GitHubApiService } from './infrastructure/github/github-api.service';
import { EmailService } from './infrastructure/email/EmailService';
import { SendGridEmailService } from './infrastructure/email/SendGridEmailService';

@Global()
@Module({
  providers: [
    FirebaseService,
    GitHubApiService,
    {
      provide: EmailService,
      useClass: SendGridEmailService,
    },
  ],
  exports: [FirebaseService, GitHubApiService, EmailService],
})
export class SharedModule {}
