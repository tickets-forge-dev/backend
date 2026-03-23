import { CreateFolderUseCase } from './CreateFolderUseCase';

describe('CreateFolderUseCase', () => {
  let folderRepository: {
    save: jest.Mock;
    findByTeamAndName: jest.Mock;
    findByTeamNameAndScope: jest.Mock;
  };
  let useCase: CreateFolderUseCase;

  beforeEach(() => {
    folderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findByTeamAndName: jest.fn().mockResolvedValue(null),
      findByTeamNameAndScope: jest.fn().mockResolvedValue(null),
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
    expect(result.scope).toBe('team');
    expect(folderRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should create a private folder when scope is specified', async () => {
    const result = await useCase.execute({
      teamId: 'team_1',
      userId: 'user_1',
      name: 'My Private',
      scope: 'private',
    });

    expect(result.scope).toBe('private');
    expect(folderRepository.findByTeamNameAndScope).toHaveBeenCalledWith(
      'team_1', 'My Private', 'private', 'user_1',
    );
  });

  it('should check for duplicate names using scope-aware method', async () => {
    folderRepository.findByTeamNameAndScope.mockResolvedValue({ getId: () => 'existing' });

    await expect(
      useCase.execute({ teamId: 'team_1', userId: 'user_1', name: 'Duplicate' }),
    ).rejects.toThrow('already exists');

    expect(folderRepository.save).not.toHaveBeenCalled();
  });

  it('should trim the folder name before checking duplicates', async () => {
    await useCase.execute({ teamId: 'team_1', userId: 'user_1', name: '  Trimmed  ' });

    expect(folderRepository.findByTeamNameAndScope).toHaveBeenCalledWith(
      'team_1', 'Trimmed', 'team', undefined,
    );
  });

  it('should allow same name for team and private folders', async () => {
    // First call for team scope returns null (no conflict)
    folderRepository.findByTeamNameAndScope.mockResolvedValue(null);

    const result = await useCase.execute({
      teamId: 'team_1',
      userId: 'user_1',
      name: 'Shared Name',
      scope: 'private',
    });

    expect(result.name).toBe('Shared Name');
    expect(result.scope).toBe('private');
    expect(folderRepository.findByTeamNameAndScope).toHaveBeenCalledWith(
      'team_1', 'Shared Name', 'private', 'user_1',
    );
  });
});
