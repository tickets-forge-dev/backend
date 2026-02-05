/**
 * DriftDetectorService Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DriftDetectorService } from '../drift-detector.service';

describe('DriftDetectorService', () => {
  let service: DriftDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriftDetectorService,
      ],
    }).compile();

    service = module.get<DriftDetectorService>(DriftDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
