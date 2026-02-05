/**
 * Drift Detection Integration Tests
 * Tests full drift detection workflow with Firestore mocks
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DriftDetectorService } from '../../../tickets/infrastructure/services/drift-detector.service';
import { AEC } from '../../../tickets/domain/aec/AEC';
import { AECStatus } from '../../../tickets/domain/value-objects/AECStatus';

describe('Drift Detection Integration', () => {
  let service: DriftDetectorService;
  let mockFirestore: any;

  beforeEach(async () => {
    // Mock Firestore
    mockFirestore = createFirestoreMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriftDetectorService,
      ],
    }).compile();

    service = module.get<DriftDetectorService>(DriftDetectorService);

    // Inject mocked Firestore
    (service as any).firestore = mockFirestore;
  });

  describe('Code Drift Detection', () => {
    it('should detect drift when commit SHA changes', async () => {
      const aec = createTestAEC({
        status: AECStatus.READY,
        codeSnapshot: { commitSha: 'abc123', indexId: 'idx-1' },
      });

      mockFirestore.collection().doc().collection().where().where().get.mockResolvedValue({
        docs: [{ id: 'aec-1', data: () => aecToFirestore(aec) }],
        empty: false,
      });

      mockFirestore.collection().doc().collection().doc().update.mockResolvedValue(null);

      await service.detectDrift('ws-1', 'test/repo', 'def456');

      expect(mockFirestore.collection().doc().collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'drifted',
          driftReason: expect.stringContaining('Code snapshot changed'),
        })
      );
    });

    it('should not detect drift when commit SHA matches', async () => {
      const aec = createTestAEC({
        status: AECStatus.READY,
        codeSnapshot: { commitSha: 'abc123', indexId: 'idx-1' },
      });

      mockFirestore.collection().doc().collection().where().where().get.mockResolvedValue({
        docs: [{ id: 'aec-1', data: () => aecToFirestore(aec) }],
        empty: false,
      });

      await service.detectDrift('ws-1', 'test/repo', 'abc123');

      expect(mockFirestore.collection().doc().collection().doc().update).not.toHaveBeenCalled();
    });

    it('should skip AECs without snapshots', async () => {
      const aec = createTestAEC({
        status: AECStatus.READY,
        codeSnapshot: null,
      });

      mockFirestore.collection().doc().collection().where().where().get.mockResolvedValue({
        docs: [{ id: 'aec-1', data: () => aecToFirestore(aec) }],
        empty: false,
      });

      await service.detectDrift('ws-1', 'test/repo', 'def456');

      expect(mockFirestore.collection().doc().collection().doc().update).not.toHaveBeenCalled();
    });

    it('should only check open AECs (ready, created)', async () => {
      mockFirestore.collection().doc().collection().where().where().get.mockResolvedValue({
        docs: [],
        empty: true,
      });

      await service.detectDrift('ws-1', 'test/repo', 'def456');

      expect(mockFirestore.collection().doc().collection().where).toHaveBeenCalledWith(
        'status',
        'in',
        ['ready', 'created']
      );
    });
  });

  describe('API Drift Detection', () => {
    it('should detect drift when API hash changes', async () => {
      const aec = createTestAEC({
        status: AECStatus.READY,
        apiSnapshot: { specUrl: 'openapi.yaml', hash: 'abc123hash' },
      });

      mockFirestore.collection().doc().collection().where().where().get.mockResolvedValue({
        docs: [{ id: 'aec-1', data: () => aecToFirestore(aec) }],
        empty: false,
      });

      mockFirestore.collection().doc().collection().doc().update.mockResolvedValue(null);

      await service.detectApiDrift('ws-1', 'test/repo', 'def456hash');

      expect(mockFirestore.collection().doc().collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'drifted',
          driftReason: expect.stringContaining('API spec changed'),
        })
      );
    });

    it('should not detect drift when API hash matches', async () => {
      const aec = createTestAEC({
        status: AECStatus.READY,
        apiSnapshot: { specUrl: 'openapi.yaml', hash: 'abc123hash' },
      });

      mockFirestore.collection().doc().collection().where().where().get.mockResolvedValue({
        docs: [{ id: 'aec-1', data: () => aecToFirestore(aec) }],
        empty: false,
      });

      await service.detectApiDrift('ws-1', 'test/repo', 'abc123hash');

      expect(mockFirestore.collection().doc().collection().doc().update).not.toHaveBeenCalled();
    });
  });

  describe('Batch Processing', () => {
    it('should handle multiple drifted AECs', async () => {
      const aec1 = createTestAEC({
        id: 'aec-1',
        codeSnapshot: { commitSha: 'abc123', indexId: 'idx-1' },
      });
      const aec2 = createTestAEC({
        id: 'aec-2',
        codeSnapshot: { commitSha: 'abc123', indexId: 'idx-2' },
      });

      mockFirestore.collection().doc().collection().where().where().get.mockResolvedValue({
        docs: [
          { id: 'aec-1', data: () => aecToFirestore(aec1) },
          { id: 'aec-2', data: () => aecToFirestore(aec2) },
        ],
        empty: false,
      });

      mockFirestore.collection().doc().collection().doc().update.mockResolvedValue(null);

      await service.detectDrift('ws-1', 'test/repo', 'def456');

      expect(mockFirestore.collection().doc().collection().doc().update).toHaveBeenCalledTimes(2);
    });
  });
});

function createFirestoreMock() {
  const updateMock = jest.fn();
  const setMock = jest.fn();
  const getMock = jest.fn();
  const whereMock = jest.fn();
  const limitMock = jest.fn();
  const docMock = jest.fn();
  const collectionMock = jest.fn();

  // Chain methods
  whereMock.mockReturnValue({ where: whereMock, get: getMock, limit: limitMock });
  limitMock.mockReturnValue({ get: getMock });
  docMock.mockReturnValue({ update: updateMock, set: setMock, get: getMock, collection: collectionMock });
  collectionMock.mockReturnValue({ doc: docMock, where: whereMock, get: getMock });

  return {
    collection: collectionMock,
  };
}

function createTestAEC(overrides: any = {}) {
  return AEC.reconstitute(
    overrides.id || 'aec-test',
    'ws-1',
    overrides.status || AECStatus.READY,
    'Test Ticket',
    'Test description',
    'feature',
    85,
    { currentStep: 8, steps: [] },
    ['AC1'],
    ['Assumption1'],
    ['src/file.ts'],
    overrides.codeSnapshot || null,
    overrides.apiSnapshot || null,
    [],
    null,
    [],
    null,
    null,
    null,
    {
      repositoryId: 123,
      repositoryName: 'test/repo',
      branch: 'main',
      defaultBranch: 'main',
    },
    new Date(),
    new Date(),
  );
}

function aecToFirestore(aec: AEC): any {
  return {
    status: aec.status,
    codeSnapshot: aec.codeSnapshot,
    apiSnapshot: aec.apiSnapshot,
    driftDetectedAt: aec.driftDetectedAt,
    driftReason: aec.driftReason,
    repositoryContext: aec.repositoryContext,
  };
}
