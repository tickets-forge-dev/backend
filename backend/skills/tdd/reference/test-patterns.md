# Test Patterns

## Naming Convention

```
test('[unit] [behavior] when [condition]', () => { ... })
```

Examples:
- `test('UserService creates user when email is valid')`
- `test('AuthGuard rejects request when token is expired')`

## Arrange-Act-Assert

```typescript
test('calculates total with discount', () => {
  // Arrange
  const cart = new Cart([item(100), item(50)]);
  const discount = new Discount(10); // 10%

  // Act
  const total = cart.calculateTotal(discount);

  // Assert
  expect(total).toBe(135);
});
```

## Mock at Boundaries

```typescript
// GOOD — mock the external boundary
const mockRepo = { findById: jest.fn().mockResolvedValue(user) };
const useCase = new GetUserUseCase(mockRepo);

// BAD — mock internal logic
jest.spyOn(user, 'validate');
```

## One Assertion Per Test

```typescript
// GOOD
test('returns user name', () => expect(result.name).toBe('Alice'));
test('returns user email', () => expect(result.email).toBe('alice@test.com'));

// BAD
test('returns user', () => {
  expect(result.name).toBe('Alice');
  expect(result.email).toBe('alice@test.com');
  expect(result.role).toBe('admin');
});
```
