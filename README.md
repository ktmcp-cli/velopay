![Banner](https://raw.githubusercontent.com/ktmcp-cli/velopay/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Velo Payments CLI

> **Warning: Unofficial CLI** - Not officially sponsored or affiliated with Velo Payments.

Command-line interface for the Velo Payments mass payout API. Manage payees, payouts, payments, and payor accounts from your terminal.

## Installation

```bash
npm install -g @ktmcp-cli/velopay
```

## Setup

```bash
velopay config set --api-key <key> --api-secret <secret> --payor-id <payor-id>
velopay auth login
```

## Commands

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
velopay payees get <payee-id>
velopay payees delete <payee-id>
```

### Payouts

```bash
velopay payouts list --payor-id <id>
velopay payouts list --payor-id <id> --status SUBMITTED
velopay payouts get <payout-id>
velopay payouts submit --file payout.json
velopay payouts withdraw <payout-id>
```

### Payments

```bash
velopay payments list
velopay payments list --payout-id <id>
velopay payments list --status ACCEPTED
velopay payments get <payment-id>
```

### Payor

```bash
velopay payor get <payor-id>
velopay payor funding-accounts <payor-id>
```

## Payout File Format

```json
{
  "payorId": "your-payor-id",
  "payoutMemo": "Monthly payroll",
  "payments": [
    {
      "payeeId": "payee-uuid",
      "sourceAccountName": "funding-account-name",
      "payoutAmount": 10000,
      "payoutCurrencyCode": "USD",
      "memo": "January salary"
    }
  ]
}
```

## JSON Output

All commands support `--json` for structured output:

```bash
velopay payees list --payor-id <id> --json
velopay payouts list --payor-id <id> --json
```

## License

MIT
