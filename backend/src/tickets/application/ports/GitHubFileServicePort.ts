import { GitHubFileService } from '@github/domain/github-file.service';

export const GITHUB_FILE_SERVICE = Symbol('GITHUB_FILE_SERVICE');

export type GitHubFileServicePort = GitHubFileService;
