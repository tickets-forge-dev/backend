import { CreateFolderUseCase } from './CreateFolderUseCase';

describe('CreateFolderUseCase', () => {
  let folderRepository: { save: jest.Mock; findByTeamAndName: jest.Mock };
  let useCase: CreateFolderUseCase;

  beforeEach(() => {
    folderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findByTeamAndName: jest.fn().mockResolvedValue(null),
    };
    useCase = new CreateFolderUseCase(folderRepository as any);
  });

  it('should create a folder and return its object representation', async () => {
    const result = await useCase.execute({
      teamId: 'team_1',
      userId: 'user_1',
      name: 'Sprint Backlog',
    });

    expect(result.name).toBe('Sprint Backlog');
    expect(result.teamId).toBe('team_1');
    expect(result.createdBy).toBe('user_1');
    expect(result.id).toMatch(/^folder_/);
    expect(folderRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should check for duplicate names within team', async () => {
    folderRepository.findByTeamAndName.mockResolvedValue({ getId: () => 'existing' });

    await expect(
      useCase.execute({ teamId: 'team_1', userId: 'user_1', name: 'Duplicate' }),
    ).rejects.toThrow('already exists');

    expect(folderRepository.save).not.toHaveBeenCalled();
  });

  it('should trim the folder name before checking duplicates', async () => {
    await useCase.execute({ teamId: 'team_1', userId: 'user_1', name: '  Trimmed  ' });

    expect(folderRepository.findByTeamAndName).toHaveBeenCalledWith('team_1', 'Trimmed');
  });
});
