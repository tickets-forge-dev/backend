import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { UsersController } from './presentation/controllers/users.controller';
import { GetUserProfileUseCase } from './application/use-cases/GetUserProfileUseCase';
import { UpdateUserProfileUseCase } from './application/use-cases/UpdateUserProfileUseCase';
import { UpdateUserAvatarUseCase } from './application/use-cases/UpdateUserAvatarUseCase';
import { AvatarStorageService } from './infrastructure/storage/AvatarStorageService';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [
    GetUserProfileUseCase,
    UpdateUserProfileUseCase,
    UpdateUserAvatarUseCase,
    AvatarStorageService,
  ],
})
export class UsersModule {}
