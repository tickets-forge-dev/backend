/**
 * DriftDetectorService Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DriftDetectorService } from '../drift-detector.service';
import { API_SPEC_INDEXER } from '../../../../indexing/application/services/api-spec-indexer.interface';

describe('DriftDetectorService', () => {
  let service: DriftDetectorService;
  let mockApiSpecIndexer: any;

  beforeEach(async () => {
    mockApiSpecIndexer = {
      getSpecByRepo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriftDetectorService,
        {
          provide: API_SPEC_INDEXER,
          useValue: mockApiSpecIndexer,
        },
      ],
    }).compile();

    service = module.get<DriftDetectorService>(DriftDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
