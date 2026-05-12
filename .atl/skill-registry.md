# Skill Registry — Colossus-Backend-v2

Auto-generated. Do not edit manually.

## Project Skills

No project-level skills found.

## Global Skills

| Skill | Path | Trigger |
|-------|------|---------|
| branch-pr | `~/.config/opencode/skills/branch-pr/SKILL.md` | When creating a pull request, opening a PR, or preparing changes for review |
| go-testing | `~/.config/opencode/skills/go-testing/SKILL.md` | When writing Go tests, using teatest, or adding test coverage |
| issue-creation | `~/.config/opencode/skills/issue-creation/SKILL.md` | When creating a GitHub issue, reporting a bug, or requesting a feature |
| judgment-day | `~/.config/opencode/skills/judgment-day/SKILL.md` | When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" |
| sdd-apply | `~/.config/opencode/skills/sdd-apply/SKILL.md` | When the orchestrator launches you to implement one or more tasks from a change |
| sdd-archive | `~/.config/opencode/skills/sdd-archive/SKILL.md` | When the orchestrator launches you to archive a change after implementation and verification |
| sdd-design | `~/.config/opencode/skills/sdd-design/SKILL.md` | When the orchestrator launches you to write or update the technical design for a change |
| sdd-explore | `~/.config/opencode/skills/sdd-explore/SKILL.md` | When the orchestrator launches you to think through a feature, investigate the codebase, or clarify requirements |
| sdd-init | `~/.config/opencode/skills/sdd-init/SKILL.md` | When user wants to initialize SDD in a project, or says "sdd init", "iniciar sdd", "openspec init" |
| sdd-onboard | `~/.config/opencode/skills/sdd-onboard/SKILL.md` | When the orchestrator launches you to onboard a user through the full SDD cycle |
| sdd-propose | `~/.config/opencode/skills/sdd-propose/SKILL.md` | When the orchestrator launches you to create or update a proposal for a change |
| sdd-spec | `~/.config/opencode/skills/sdd-spec/SKILL.md` | When the orchestrator launches you to write or update specs for a change |
| sdd-tasks | `~/.config/opencode/skills/sdd-tasks/SKILL.md` | When the orchestrator launches you to create or update the task breakdown for a change |
| sdd-verify | `~/.config/opencode/skills/sdd-verify/SKILL.md` | When the orchestrator launches you to verify a completed (or partially completed) change |
| skill-creator | `~/.config/opencode/skills/skill-creator/SKILL.md` | When user asks to create a new skill, add agent instructions, or document patterns for AI |
| skill-registry | `~/.config/opencode/skills/skill-registry/SKILL.md` | When user says "update skills", "skill registry", "actualizar skills", "update registry", or after installing/removing skills |

## Project Conventions

- **Copilot Instructions**: `.github/copilot-instructions.md`
  - NestJS modules: controller, service, module, dto, entities
  - TypeORM entities with snake_case columns
  - Business logic in services, not controllers
  - REST endpoints with plural resource names
  - class-validator for all input validation
  - UUID primary keys with @PrimaryGeneratedColumn('uuid')
  - Soft-delete via is_active flag
  - Vitest for unit + E2E tests with SWC compilation
