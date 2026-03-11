# Colossus Backend v2 - Copilot Instructions

## Stack and Architecture
- Use NestJS modules with a consistent structure: controller, service, module, dto, entities.
- Use TypeORM entities with snake_case database columns.
- Keep business logic in services, not controllers.

## API Conventions
- Use REST endpoints with plural resource names (`/users`, `/products`, `/customers`).
- Use `@Post`, `@Get`, `@Patch`, `@Delete` consistently for CRUD.
- Use query params for filtering (`businessId`, `branchId`, etc.).

## DTO and Validation
- Validate all input using `class-validator`.
- For UUID foreign keys, use `@IsUUID()` and mark optional fields with `@IsOptional()`.
- For update DTOs, extend `PartialType(CreateXDto)`.

## Entity and Persistence Rules
- Prefer `@PrimaryGeneratedColumn('uuid')` for entity IDs.
- Add `@CreateDateColumn()` and `@UpdateDateColumn()` in entities.
- Use explicit foreign key columns (`user_id`, `business_id`) plus relation decorators.
- Mark nullable relationships with both nullable column options and nullable relation options.

## Service Rules
- Implement `create`, `findAll`, `findOne`, `update`, and `remove` methods unless requirements specify otherwise.
- Throw `NotFoundException` when an item does not exist.
- For updates, load entity first, then `Object.assign(entity, dto)` and save.
- If entity has `is_active`, prefer soft-delete by setting it to `false`.

## Code Style
- Keep naming and formatting consistent with existing codebase.
- Avoid introducing new architectural patterns unless requested.
- Keep methods short and focused.
- Add comments only for non-obvious logic.

## Integration
- Register new modules in `src/app.module.ts`.
- Ensure module exports are added only when needed by other modules.
- Keep imports ordered and clean.

## Testing and Safety
- Run lint/build after structural changes when possible.
- Do not remove or alter existing behavior outside requested scope.
- Preserve backwards compatibility of current endpoints unless explicitly changed.
