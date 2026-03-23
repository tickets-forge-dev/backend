import { DeleteFolderUseCase } from './DeleteFolderUseCase';
import { Folder } from '../../domain/Folder';

describe('DeleteFolderUseCase', () => {
  let folderRepository: { findByIdInTeam: jest.Mock; delete: jest.Mock };
  let aecRepository: { clearFolderFromTickets: jest.Mock };
  let useCase: DeleteFolderUseCase;

  const mockFolder = Folder.reconstitute(
    'folder_1', 'team_1', 'Test', 'user_1', new Date(), new Date(),
  );

  const mockPrivateFolder = Folder.reconstitute(
    'folder_2', 'team_1', 'Private', 'user_1', new Date(), new Date(), 'private',
  );

  beforeEach(() => {
    folderRepository = {
      findByIdInTeam: jest.fn().mockResolvedValue(mockFolder),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    aecRepository = {
      clearFolderFromTickets: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteFolderUseCase(folderRepository as any, aecRepository as any);
  });

  it('should clear tickets from folder then delete the folder', async () => {
    await useCase.execute({ teamId: 'team_1', folderId: 'folder_1', userId: 'user_1' });

    expect(aecRepository.clearFolderFromTickets).toHaveBeenCalledWith('team_1', 'folder_1');
    expect(folderRepository.delete).toHaveBeenCalledWith('folder_1', 'team_1');
  });

  it('should clear tickets before deleting (order matters)', async () => {
    const callOrder: string[] = [];
    aecRepository.clearFolderFromTickets.mockImplementation(() => {
      callOrder.push('clear');
      return Promise.resolve();
    });
    folderRepository.delete.mockImplementation(() => {
      callOrder.push('delete');
      return Promise.resolve();
    });

    await useCase.execute({ teamId: 'team_1', folderId: 'folder_1', userId: 'user_1' });

    expect(callOrder).toEqual(['clear', 'delete']);
  });

  it('should throw if folder not found', async () => {
    folderRepository.findByIdInTeam.mockResolvedValue(null);

    await expect(
      useCase.execute({ teamId: 'team_1', folderId: 'nonexistent', userId: 'user_1' }),
    ).rejects.toThrow('not found');

    expect(aecRepository.clearFolderFromTickets).not.toHaveBeenCalled();
    expect(folderRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw if non-creator tries to delete private folder', async () => {
    folderRepository.findByIdInTeam.mockResolvedValue(mockPrivateFolder);

    await expect(
      useCase.execute({ teamId: 'team_1', folderId: 'folder_2', userId: 'user_other' }),
    ).rejects.toThrow('permission');

    expect(aecRepository.clearFolderFromTickets).not.toHaveBeenCalled();
    expect(folderRepository.delete).not.toHaveBeenCalled();
  });

  it('should allow creator to delete private folder', async () => {
    folderRepository.findByIdInTeam.mockResolvedValue(mockPrivateFolder);

    await useCase.execute({ teamId: 'team_1', folderId: 'folder_2', userId: 'user_1' });

    expect(aecRepository.clearFolderFromTickets).toHaveBeenCalled();
    expect(folderRepository.delete).toHaveBeenCalled();
  });
});
