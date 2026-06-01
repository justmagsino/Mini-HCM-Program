# Documentation Index

Mini HCM technical specifications and production guides.

## Production guides (start here)

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Installation, local dev, scripts, quick troubleshooting |
| [../DEPLOYMENT.md](../DEPLOYMENT.md) | Production deployment runbook |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Environment variables (client + server) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture overview |

## Contracts (source of truth)

| # | File | Topic |
|---|------|-------|
| 01 | [01-project-overview.md](./01-project-overview.md) | Scope, goals, error codes |
| 04 | [04-firestore-schema.md](./04-firestore-schema.md) | **Firestore schema** |
| 11 | [11-api-routes.md](./11-api-routes.md) | **REST API** |
| 12 | [12-security-rules.md](./12-security-rules.md) | Security rules |

## Feature specifications

| # | File | Topic |
|---|------|-------|
| 02 | [02-tech-stack.md](./02-tech-stack.md) | Approved libraries |
| 03 | [03-folder-structure.md](./03-folder-structure.md) | Repository layout |
| 05 | [05-auth-system.md](./05-auth-system.md) | Authentication |
| 06 | [06-attendance-system.md](./06-attendance-system.md) | Punch in/out |
| 07 | [07-computation-engine.md](./07-computation-engine.md) | Metrics engine |
| 08 | [08-daily-summary.md](./08-daily-summary.md) | Daily summaries |
| 09 | [09-admin-system.md](./09-admin-system.md) | Admin features |
| 10 | [10-dashboard-ui.md](./10-dashboard-ui.md) | Dashboards & UI |

## Process

| # | File | Topic |
|---|------|-------|
| 13 | [13-deployment.md](./13-deployment.md) | Deployment architecture |
| 14 | [14-coding-standards.md](./14-coding-standards.md) | Coding standards |
| 15 | [15-development-workflow.md](./15-development-workflow.md) | Phased implementation |

## Conflict resolution

If documents disagree, apply: **`04` → `11` → `07` → others**.
