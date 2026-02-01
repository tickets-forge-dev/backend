export class Workspace {
  private constructor(
    public readonly id: string,
    public readonly ownerId: string,
    private _name: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(ownerId: string, ownerEmail: string): Workspace {
    // Generate workspace ID from owner's uid (first 12 chars)
    const id = `ws_${ownerId.substring(0, 12)}`;

    // Default name from email (e.g., "user@example.com" → "user's workspace")
    const emailUser = ownerEmail.split('@')[0];
    const name = `${emailUser}'s workspace`;

    return new Workspace(id, ownerId, name, new Date(), new Date());
  }

  static reconstitute(
    id: string,
    ownerId: string,
    name: string,
    createdAt: Date,
    updatedAt: Date,
  ): Workspace {
    return new Workspace(id, ownerId, name, createdAt, updatedAt);
  }

  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  get name(): string {
    return this._name;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
