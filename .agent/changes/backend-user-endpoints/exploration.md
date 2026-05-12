# Exploration: backend-user-endpoints

## Current State

The backend is a **NestJS + TypeORM** multi-tenant POS system with a global prefix of `api/v1`. The codebase uses:
- **bcrypt** for password hashing (salt rounds = 10)
- **JWT** authentication via `@nestjs/passport` with `passport-jwt`
- **class-validator** with a global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- **class-transformer** with `@Exclude()` on the password field + `ClassSerializerInterceptor` globally
- **Vitest** for testing (`@nestjs/testing`)
- **Swagger** (`@nestjs/swagger`) for API documentation

### Existing Endpoints (verified)

| Endpoint | Exists | Auth Guard | Notes |
|----------|--------|------------|-------|
| `POST /api/v1/auth/register` | YES | NO | Uses `first_name`+`last_name`, returns `access_token` but NO `refresh_token` |
| `POST /api/v1/auth/login` | YES | NO | Returns `access_token`, no `refresh_token` |
| `GET /api/v1/auth/me` | YES | `JwtAuthGuard` | Returns user profile with roles/permissions |
| `GET /api/v1/auth/profile` | YES | `JwtAuthGuard` | Returns current user from JWT payload |
| `POST /api/v1/orders` | YES | **NO** | Field is `type` not `order_type`, completely unprotected |
| `PATCH /api/v1/users/me` | **NO** | --- | Does not exist |
| `POST /api/v1/users/me/change-password` | **NO** | --- | Does not exist |
| `GET /api/v1/users/me` | **NO** | --- | Does not exist (but `/auth/me` covers this) |

### UsersModule Structure

- **Controller** (`users.controller.ts`): Admin-facing CRUD on `/users` (all routes protected by `JwtAuthGuard`). No `/users/me` self-service routes.
- **Service** (`users.service.ts`): Has `create`, `findAll`, `findOne`, `findByEmail`, `update`, `remove`, `assignRole`, `removeRole`. The `update` method already handles password hashing if `password` is in the DTO.
- **Entity** (`user.entity.ts`): Fields --- `id`, `branch_id`, `first_name`, `last_name`, `email`, `password` (excluded), `phone`, `is_owner`, `is_active`, `created_at`, `updated_at`. Relations: `branch`, `user_roles`, `customer`.
- **DTOs**:
  - `CreateUserDto`: `branch_id?`, `first_name`, `last_name`, `email`, `password` (min 8), `phone?`, `is_owner?`
  - `UpdateUserDto`: `PartialType(CreateUserDto)` + `is_active?: boolean`. No dedicated change-password DTO.
  - `AssignRoleDto`: `role_id` (UUID, required)

### AuthModule Structure

- **Controller** (`auth.controller.ts`): `POST /login`, `POST /register`, `GET /profile`, `GET /me`
- **Service** (`auth.service.ts`): `validateUser`, `login`, `register`, `getProfile`. `getProfile` normalizes roles and expands permissions.
- **JWT Strategy** (`jwt.strategy.ts`): Extracts Bearer token, validates via JWT, caches profile for 5 minutes. Payload: `{ sub, email, branch_id }`.
- **Guards**: `JwtAuthGuard` (extends `AuthGuard('jwt')`), `ModuleAccessGuard`, `PermissionsGuard`, `BranchAccessGuard`
- **Decorator**: `@CurrentUser()` --- extracts `request.user`

### OrdersModule Structure

- **Controller** (`orders.controller.ts`): NO guards on ANY endpoint. `POST /`, `GET /`, `GET /:id`, `GET /number/:orderNumber`, `PATCH /:id/status`, `PATCH /:id/archive`, `GET /:id/payments`, `POST /:id/payments`
- **Service** (`orders.service.ts`): Full CRUD with status management, payments, archiving
- **DTO** (`create-order.dto.ts`): Uses `type` field (enum `OrderType`), not `order_type`

### Password Validation Logic

- **Existing**: Only `@MinLength(8)` on `password` in `CreateUserDto` and `RegisterDto`
- **No** complexity requirements (uppercase, lowercase, number, special char)
- **No** current-password verification for password changes
- **No** dedicated `ChangePasswordDto` exists anywhere in the codebase

### Testing Patterns

- **Framework**: Vitest with `@nestjs/testing`
- **Pattern**: `describe` > `describe(method)` > `it(should...)`
- **Mocking**: `vi.mock('bcrypt')`, repository mocks via `getRepositoryToken()`, `MockedFunction<any>`
- **Coverage**: `users.service.spec.ts` (create, findAll, findOne, findByEmail, remove), `auth.service.spec.ts` (validateUser, login, getProfile), `orders.service.spec.ts` (create, findAll, findOne, updateStatus, archive)
- **NO controller-level .spec files exist** for any of the three modules

## Affected Areas

- `src/users/users.controller.ts` --- Needs new `/me` routes (GET, PATCH, POST change-password)
- `src/users/users.service.ts` --- May need new methods: `findByJwtSub`, `changePassword`
- `src/users/dto/` --- Needs `ChangePasswordDto` and possibly `UpdateMeDto`
- `src/auth/auth.service.ts` --- May need a `changePassword` method (or keep in UsersService)
- `src/orders/orders.controller.ts` --- Needs `JwtAuthGuard` on all endpoints
- `src/users/users.service.spec.ts` --- Needs tests for new methods
- `src/auth/auth.service.spec.ts` --- May need tests for password change flow

## Approaches

### Approach 1: Add `/users/me` routes to UsersController (Recommended)

Add three new endpoints to the existing `UsersController`:
- `GET /users/me` --- Uses `@CurrentUser()` decorator + `JwtAuthGuard` to fetch the authenticated user full profile
- `PATCH /users/me` --- Allows users to update their own profile (name, phone). Uses `JwtAuthGuard` + a restricted `UpdateMeDto`
- `POST /users/me/change-password` --- Uses `JwtAuthGuard` + `ChangePasswordDto` (currentPassword, newPassword). Validates current password before updating

**Pros**:
- Follows RESTful conventions for self-service endpoints
- Reuses existing `JwtAuthGuard` and `@CurrentUser()` patterns already used in AuthController
- `UsersService.update()` already handles password hashing
- Minimal new code --- mostly wiring existing capabilities

**Cons**:
- `/users/me` overlaps with `/auth/me` --- need to decide which is the canonical "get my profile" endpoint
- `UsersService` needs a method to find user by JWT `sub` (or reuse `findOne`)

**Effort**: Low

### Approach 2: Move all self-service to AuthController

Move all `/me` and `/change-password` endpoints into `AuthController` since it already handles `/auth/me`.

**Pros**:
- No overlap --- `/auth/me` is the single profile endpoint
- AuthController already uses `@CurrentUser()` decorator
- Conceptually clean: auth-related self-service lives with auth

**Cons**:
- `PATCH /users/me` is semantically a user operation, not auth
- AuthController would grow beyond its responsibility
- Breaks the convention that `/users` handles user entity operations

**Effort**: Low

### Approach 3: Create a dedicated UserSelfServiceController

Create a new controller at `/users/me/*` or `/me/*` specifically for self-service operations.

**Pros**:
- Clean separation between admin user management and self-service
- Can apply `JwtAuthGuard` at the controller level (all routes protected)

**Cons**:
- Over-engineering for 3 endpoints
- Adds a new module file and registration in AppModule
- More files to maintain

**Effort**: Medium

## Recommendation

**Approach 1** --- Add `/users/me` routes to `UsersController`. This is the most pragmatic choice:

1. **`GET /users/me`**: Use `@CurrentUser() user: { id: string }` with `JwtAuthGuard`, call `usersService.findOne(user.id)`. This returns the same data as `/auth/me` but from the Users resource. Consider deprecating `/auth/me` later or making `/users/me` the canonical endpoint.

2. **`PATCH /users/me`**: Create an `UpdateMeDto` that only allows `first_name`, `last_name`, `phone` (NOT `email`, `password`, `is_active`, `branch_id`, `is_owner`). Use `JwtAuthGuard` + `@CurrentUser()`.

3. **`POST /users/me/change-password`**: Create a `ChangePasswordDto` with `currentPassword` and `newPassword`. In the handler: fetch user, verify `currentPassword` with `bcrypt.compare`, hash `newPassword`, save. This keeps password change logic in UsersService where `update()` already handles hashing.

4. **OrdersModule**: Add `@UseGuards(JwtAuthGuard)` to ALL endpoints in `OrdersController`. This is a security gap that should be fixed alongside the user endpoints.

## Risks

1. **Endpoint overlap**: Both `/auth/me` and the new `/users/me` will return similar data. The frontend may need to be updated to use one consistently.
2. **No refresh token**: The current auth flow only returns `access_token`. If the spec requires `refresh_token`, that is a separate (larger) change to the JWT strategy and auth service.
3. **OrdersController has NO auth**: This is a CRITICAL security gap. All order endpoints are publicly accessible. Adding `JwtAuthGuard` will break any existing unauthenticated integrations.
4. **Password validation is minimal**: Only `@MinLength(8)`. No complexity rules, no breach checking. If the spec requires stronger validation, that adds complexity.
5. **No controller tests exist**: The codebase only has service-level tests. Adding controller tests for the new `/me` endpoints would be good practice but requires setting up testing patterns that do not currently exist.
6. **UpdateUserDto is too permissive**: It extends `PartialType(CreateUserDto)`, which means it allows updating `email`, `password`, `branch_id`, etc. The `UpdateMeDto` must be a separate, restricted DTO.

## Ready for Proposal

**Yes.** The codebase is well-structured and the patterns are clear. The missing endpoints are straightforward additions that follow existing conventions. The main decisions for the proposal phase are:

1. Should `/users/me` replace `/auth/me` as the canonical profile endpoint, or should both coexist?
2. Should `refresh_token` be added to the auth flow (out of scope for this change, but worth noting)?
3. What password complexity requirements should `ChangePasswordDto` enforce?
4. Should the OrdersController auth guard fix be bundled into this change or treated separately?
