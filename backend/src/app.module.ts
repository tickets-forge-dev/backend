import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Feature modules will be added in subsequent stories
    // TicketsModule (Story 2.x)
    // IndexingModule (Story 4.x)
    // IntegrationsModule (Story 5.x)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
