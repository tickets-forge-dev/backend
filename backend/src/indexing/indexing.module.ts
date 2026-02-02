/**
 * Indexing Module
 * 
 * Provides code indexing capabilities for repositories.
 * Handles repository cloning, file parsing, and index storage.
 * 
 * Part of: Story 4.2 - Code Indexing
 * Epic: 4 - Code Intelligence & Estimation
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FirestoreIndexRepository } from './infrastructure/persistence/firestore-index.repository';
import { INDEX_REPOSITORY } from './domain/IndexRepository';
import { FileParserService } from './application/services/file-parser.service';
import { RepoIndexerService } from './application/services/repo-indexer.service';
import { IndexQueryService } from './application/services/index-query.service';
import { IndexingProcessor } from './application/jobs/indexing.processor';
import { IndexingController } from './presentation/controllers/indexing.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    SharedModule, // Provides Firestore
    // Bull queue for async indexing jobs
    // TODO: Uncomment when Redis is set up
    // BullModule.registerQueue({
    //   name: 'indexing',
    // }),
  ],
  providers: [
    {
      provide: INDEX_REPOSITORY,
      useClass: FirestoreIndexRepository,
    },
    FileParserService,
    RepoIndexerService,
    IndexQueryService,
    // TODO: Uncomment when Bull is configured
    // IndexingProcessor,
  ],
  controllers: [IndexingController],
  exports: [
    INDEX_REPOSITORY,
    FileParserService,
    RepoIndexerService,
    IndexQueryService,
  ],
})
export class IndexingModule {}
