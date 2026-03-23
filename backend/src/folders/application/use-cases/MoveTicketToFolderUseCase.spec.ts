import { MoveTicketToFolderUseCase } from './MoveTicketToFolderUseCase';
import { Folder } from '../../domain/Folder';

describe('MoveTicketToFolderUseCase', () => {
  let folderRepository: { findByIdInTeam: jest.Mock };
  let aecRepository: { updateTicketFolder: jest.Mock };
  let useCase: MoveTicketToFolderUseCase;

  const mockFolder = Folder.reconstitute(
    'folder_1', 'team_1', 'Test', 'user_1', new Date(), new Date(),
  );

  const mockPrivateFolder = Folder.reconstitute(
    'folder_2', 'team_1', 'Private', 'user_1', new Date(), new Date(), 'private',
  );

  beforeEach(() => {
    folderRepository = {
      findByIdInTeam: jest.fn().mockResolvedValue(mockFolder),
    };
    aecRepository = {
      updateTicketFolder: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new MoveTicketToFolderUseCase(folderRepository as any, aecRepository as any);
  });

  it('should move ticket to a folder', async () => {
    await useCase.execute({
      teamId: 'team_1', ticketId: 'aec_1', folderId: 'folder_1', userId: 'user_1',
    });

    expect(folderRepository.findByIdInTeam).toHaveBeenCalledWith('folder_1', 'team_1');
    expect(aecRepository.updateTicketFolder).toHaveBeenCalledWith('aec_1', 'team_1', 'folder_1');
  });

  it('should move ticket to root (unfiled) without folder validation', async () => {
    await useCase.execute({
      teamId: 'team_1', ticketId: 'aec_1', folderId: null, userId: 'user_1',
    });

    expect(folderRepository.findByIdInTeam).not.toHaveBeenCalled();
    expect(aecRepository.updateTicketFolder).toHaveBeenCalledWith('aec_1', 'team_1', null);
  });

  it('should throw if target folder not found', async () => {
    folderRepository.findByIdInTeam.mockResolvedValue(null);

    await expect(
      useCase.execute({
        teamId: 'team_1', ticketId: 'aec_1', folderId: 'nonexistent', userId: 'user_1',
      }),
    ).rejects.toThrow('not found');

    expect(aecRepository.updateTicketFolder).not.toHaveBeenCalled();
  });

  it('should throw if non-creator tries to move ticket into private folder', async () => {
    folderRepository.findByIdInTeam.mockResolvedValue(mockPrivateFolder);

    await expect(
      useCase.execute({
        teamId: 'team_1', ticketId: 'aec_1', folderId: 'folder_2', userId: 'user_other',
      }),
    ).rejects.toThrow('permission');

    expect(aecRepository.updateTicketFolder).not.toHaveBeenCalled();
  });

  it('should allow creator to move ticket into their private folder', async () => {
    folderRepository.findByIdInTeam.mockResolvedValue(mockPrivateFolder);

    await useCase.execute({
      teamId: 'team_1', ticketId: 'aec_1', folderId: 'folder_2', userId: 'user_1',
    });

    expect(aecRepository.updateTicketFolder).toHaveBeenCalledWith('aec_1', 'team_1', 'folder_2');
  });
});
