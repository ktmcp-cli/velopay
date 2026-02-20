# AGENT.md — Velo Payments CLI for AI Agents

## Overview

The `velopay` CLI provides access to the Velo Payments API for mass payout processing.

## Prerequisites

```bash
velopay config set --api-key <key> --api-secret <secret>
velopay config set --environment sandbox  # or production
velopay auth login
```

## Commands

### Auth
```bash
velopay auth login
velopay auth logout
```

### Payors
```bash
velopay payors list --json
velopay payors get <payor-id> --json
```

### Payees
```bash
velopay payees list --json
velopay payees get <payee-id> --json
```

### Payouts
```bash
velopay payouts list --json
velopay payouts get <payout-id> --json
```

### Payments
```bash
velopay payments list --json
```

### Funding
```bash
velopay funding accounts --json
```

## Tips

- Supports sandbox and production environments
- Payouts can contain 1-2000 payments
- Always use `--json` for programmatic access
