# AGENT.md — Velo Payments CLI for AI Agents

## Overview

The `velopay` CLI provides access to the Velo Payments mass payout API.

## Prerequisites

```bash
velopay config set --api-key <key> --api-secret <secret> --payor-id <id>
velopay auth login
```

## All Commands

### Config
```bash
velopay config set --api-key <key> --api-secret <secret> --payor-id <id>
velopay config show
```

### Auth
```bash
velopay auth login
velopay auth status
```

### Payees
```bash
velopay payees list --payor-id <id>
velopay payees list --payor-id <id> --status ACTIVE
velopay payees get <id>
velopay payees delete <id>
```

### Payouts
```bash
velopay payouts list --payor-id <id>
velopay payouts get <id>
velopay payouts submit --file payout.json
velopay payouts withdraw <id>
```

### Payments
```bash
velopay payments list
velopay payments list --payout-id <id>
velopay payments get <id>
```

### Payor
```bash
velopay payor get <id>
velopay payor funding-accounts <id>
```

## JSON Output

Always use `--json` when parsing programmatically:
```bash
velopay payees list --payor-id <id> --json
velopay payouts list --payor-id <id> --json
```
