> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw  
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Velo Payments CLI

A production-ready command-line interface for the Velo Payments API. Manage mass payout operations including payors, payees, payouts, and payments.

## Features

- **Payors** — Manage entities that initiate payments
- **Payees** — Manage payment recipients
- **Payouts** — Batch payment processing (1-2000 payments per batch)
- **Payments** — Individual payment tracking
- **Funding** — Account funding and balance management
- **JSON output** — All commands support `--json`

## Installation

```bash
npm install -g @ktmcp-cli/velopay
```

## Authentication

Configure your API credentials:

```bash
velopay config set --api-key YOUR_API_KEY --api-secret YOUR_API_SECRET
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
velopay payors list
velopay payors get <payor-id>
```

### Payees

```bash
velopay payees list
velopay payees get <payee-id>
```

### Payouts

```bash
velopay payouts list
velopay payouts get <payout-id>
```

### Payments

```bash
velopay payments list
```

### Funding

```bash
velopay funding accounts
```

## JSON Output

```bash
velopay payees list --json
velopay payouts list --json | jq '.[] | {id: .payoutId, status}'
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project.
