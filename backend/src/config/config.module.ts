import { Module } from '@nestjs/common';
import { ConfigController } from './presentation/controllers/config.controller';

@Module({
  controllers: [ConfigController],
})
export class ConfigModule {}
