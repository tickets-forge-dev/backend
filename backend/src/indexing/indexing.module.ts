/**
 * Indexing Module
 * 
 * Provides code indexing capabilities for repositories.
 * Handles repository cloning, file parsing, and index storage.
 * 
 * Part of: Story 4.2 - Code Indexing, Story 4.3 - OpenAPI Spec Sync
 * Epic: 4 - Code Intelligence & Estimation
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FirestoreIndexRepository } from './infrastructure/persistence/firestore-index.repository';
import { FirestoreApiSpecRepository } from './infrastructure/persistence/firestore-api-spec.repository';
import { INDEX_REPOSITORY } from './domain/IndexRepository';
import { API_SPEC_REPOSITORY } from './domain/ApiSpecRepository';
import { FileParserService } from './application/services/file-parser.service';
import { RepoIndexerService } from './application/services/repo-indexer.service';
import { IndexQueryService } from './application/services/index-query.service';
import { API_SPEC_INDEXER } from './application/services/api-spec-indexer.interface';
import { ApiSpecIndexerImpl } from './infrastructure/services/api-spec-indexer.service';
import { IndexingProcessor } from './application/jobs/indexing.processor';
import { IndexingController } from './presentation/controllers/indexing.controller';
import { SharedModule } from '../shared/shared.module';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [
    SharedModule, // Provides Firestore
    GitHubModule, // Provides GitHub integration and token service
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
    {
      provide: API_SPEC_REPOSITORY,
      useClass: FirestoreApiSpecRepository,
    },
    {
      provide: API_SPEC_INDEXER,
      useClass: ApiSpecIndexerImpl,
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
    API_SPEC_REPOSITORY,
    API_SPEC_INDEXER,
    FileParserService,
    RepoIndexerService,
    IndexQueryService,
  ],
})
export class IndexingModule {}
