import { Timestamp } from 'firebase-admin/firestore';
import { ProjectProfile } from '../../domain/ProjectProfile';
import { ProjectProfileStatus } from '../../domain/ProjectProfileStatus';

/** Safely convert Firestore Timestamp, {_seconds,_nanoseconds}, or ISO string to Date */
function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    typeof (value as { _seconds: number })._seconds === 'number'
  ) {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  return new Date(value as string | number);
}

export interface ProjectProfileDocument {
  id: string;
  teamId: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  profileContent: string | null;
  status: string;
  scannedAt: Timestamp | null;
  scannedBy: string | null;
  fileCount: number;
  techStack: string[];
  commitSha: string | null;
  error: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ProjectProfileMapper {
  static toDomain(doc: ProjectProfileDocument): ProjectProfile {
    return ProjectProfile.reconstitute({
      id: doc.id,
      teamId: doc.teamId,
      repoOwner: doc.repoOwner,
      repoName: doc.repoName,
      branch: doc.branch,
      profileContent: doc.profileContent ?? null,
      status: doc.status as ProjectProfileStatus,
      scannedAt: doc.scannedAt ? toDate(doc.scannedAt) : null,
      scannedBy: doc.scannedBy ?? null,
      fileCount: doc.fileCount ?? 0,
      techStack: doc.techStack ?? [],
      commitSha: doc.commitSha ?? null,
      error: doc.error ?? null,
      createdAt: toDate(doc.createdAt),
      updatedAt: toDate(doc.updatedAt),
    });
  }

  static toFirestore(profile: ProjectProfile): ProjectProfileDocument {
    return {
      id: profile.id,
      teamId: profile.teamId,
      repoOwner: profile.repoOwner,
      repoName: profile.repoName,
      branch: profile.branch,
      profileContent: profile.profileContent,
      status: profile.status,
      scannedAt: profile.scannedAt ? Timestamp.fromDate(profile.scannedAt) : null,
      scannedBy: profile.scannedBy,
      fileCount: profile.fileCount,
      techStack: profile.techStack,
      commitSha: profile.commitSha,
      error: profile.error,
      createdAt: Timestamp.fromDate(profile.createdAt),
      updatedAt: Timestamp.fromDate(profile.updatedAt),
    };
  }
}
