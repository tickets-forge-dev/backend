# Clean Architecture Patterns

## Port (Interface)

```typescript
// application/ports/UserRepository.port.ts
export const USER_REPOSITORY = Symbol('UserRepository');
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

## Adapter (Implementation)

```typescript
// infrastructure/persistence/FirestoreUserRepository.ts
@Injectable()
export class FirestoreUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> { ... }
  async save(user: User): Promise<void> { ... }
}
```

## Use Case

```typescript
// application/use-cases/CreateUserUseCase.ts
@Injectable()
export class CreateUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepository) {}
  async execute(command: CreateUserCommand): Promise<User> { ... }
}
```

## Layer Dependencies

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑           ↑
 Controllers    Use Cases    Entities    Adapters
                   ↓           ↑
                 Ports ←───────┘
```

Domain depends on nothing. Everything depends on domain.
