import { Organization } from '../../domain/Organization';

export const ORGANIZATION_REPOSITORY = Symbol('OrganizationRepository');

export interface OrganizationRepository {
  save(org: Organization): Promise<void>;
  getById(id: string): Promise<Organization | null>;
  getByOwnerId(userId: string): Promise<Organization[]>;
  getPersonalOrg(userId: string): Promise<Organization | null>;
}
