import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  authenticate,
  listPayees, getPayee, createPayee, deletePayee,
  submitPayout, getPayout, listPayouts, withdrawPayout,
  listPayments, getPayment,
  getPayor, listPayorFundingAccounts,
  listWebhooks, createWebhook, updateWebhook
} from './api.js';

const program = new Command();

function printSuccess(message) { console.log(chalk.green('✓') + ' ' + message); }
function printError(message) { console.error(chalk.red('✗') + ' ' + message); }
function printJson(data) { console.log(JSON.stringify(data, null, 2)); }

function printTable(data, columns) {
  if (!data || data.length === 0) { console.log(chalk.yellow('No results found.')); return; }
  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });
  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));
  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });
  console.log(chalk.dim(`\n${data.length} result(s)`));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  const token = getConfig('accessToken');
  const expiry = getConfig('tokenExpiry');
  if (!token || (expiry && Date.now() > expiry)) {
    printError('Not authenticated or session expired.');
    console.log('\nRun: ' + chalk.cyan('velopay auth login --api-key <key> --api-secret <secret>'));
    process.exit(1);
  }
}

program
  .name('velopay')
  .description(chalk.bold('Velo Payments CLI') + ' - Mass payouts from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'Velo API key')
  .option('--api-secret <secret>', 'Velo API secret')
  .option('--payor-id <id>', 'Default payor ID')
  .action((options) => {
    let set = false;
    if (options.apiKey) { setConfig('apiKey', options.apiKey); printSuccess('API key saved'); set = true; }
    if (options.apiSecret) { setConfig('apiSecret', options.apiSecret); printSuccess('API secret saved'); set = true; }
    if (options.payorId) { setConfig('payorId', options.payorId); printSuccess('Payor ID saved'); set = true; }
    if (!set) printError('No options provided.');
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    const payorId = getConfig('payorId');
    const hasToken = !!getConfig('accessToken');
    console.log(chalk.bold('\nVelo Payments CLI Configuration\n'));
    console.log('API Key:   ', apiKey ? chalk.green(apiKey.substring(0, 10) + '...') : chalk.red('not set'));
    console.log('Payor ID:  ', payorId ? chalk.green(payorId) : chalk.yellow('not set'));
    console.log('Token:     ', hasToken ? chalk.green('set') : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// AUTH
// ============================================================

const authCmd = program.command('auth').description('Manage authentication');

authCmd
  .command('login')
  .description('Authenticate with Velo API')
  .option('--api-key <key>', 'API key (or use stored key)')
  .option('--api-secret <secret>', 'API secret (or use stored secret)')
  .action(async (options) => {
    const apiKey = options.apiKey || getConfig('apiKey');
    const apiSecret = options.apiSecret || getConfig('apiSecret');
    if (!apiKey || !apiSecret) {
      printError('API key and secret required.');
      console.log('Run: ' + chalk.cyan('velopay config set --api-key <key> --api-secret <secret>'));
      process.exit(1);
    }
    try {
      await withSpinner('Authenticating...', () => authenticate(apiKey, apiSecret));
      printSuccess('Authenticated successfully');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

authCmd
  .command('status')
  .description('Check authentication status')
  .action(() => {
    const token = getConfig('accessToken');
    const expiry = getConfig('tokenExpiry');
    console.log(chalk.bold('\nAuth Status\n'));
    if (!token) {
      console.log(chalk.red('Not authenticated'));
    } else if (expiry && Date.now() > expiry) {
      console.log(chalk.yellow('Token expired'));
      console.log('Run: ' + chalk.cyan('velopay auth login'));
    } else {
      console.log(chalk.green('Authenticated'));
      if (expiry) console.log('Expires: ', new Date(expiry).toLocaleString());
    }
    console.log('');
  });

// ============================================================
// PAYEES
// ============================================================

const payeesCmd = program.command('payees').description('Manage payees');

payeesCmd
  .command('list')
  .description('List all payees')
  .requiredOption('--payor-id <id>', 'Payor ID')
  .option('--status <status>', 'Filter by status (INVITED|REGISTERED|ACTIVE|SUSPENDED)')
  .option('--page <n>', 'Page number', '1')
  .option('--page-size <n>', 'Results per page', '25')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Fetching payees...', () =>
        listPayees(options.payorId, {
          page: parseInt(options.page),
          pageSize: parseInt(options.pageSize),
          status: options.status
        })
      );
      const payees = result.content || result.payees || result || [];
      if (options.json) { printJson(payees); return; }
      const arr = Array.isArray(payees) ? payees : [];
      printTable(arr, [
        { key: 'payeeId', label: 'ID', format: (v) => v?.substring(0, 8) + '...' },
        { key: 'displayName', label: 'Name', format: (v) => v?.substring(0, 25) || '' },
        { key: 'email', label: 'Email', format: (v) => v?.substring(0, 30) || '' },
        { key: 'status', label: 'Status' },
        { key: 'country', label: 'Country' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

payeesCmd
  .command('get <payee-id>')
  .description('Get a specific payee')
  .option('--json', 'Output as JSON')
  .action(async (payeeId, options) => {
    requireAuth();
    try {
      const payee = await withSpinner('Fetching payee...', () => getPayee(payeeId));
      if (!payee) { printError('Payee not found'); process.exit(1); }
      if (options.json) { printJson(payee); return; }
      console.log(chalk.bold('\nPayee Details\n'));
      console.log('ID:          ', chalk.cyan(payee.payeeId));
      console.log('Name:        ', chalk.bold(payee.displayName));
      console.log('Email:       ', payee.email || 'N/A');
      console.log('Status:      ', payee.status);
      console.log('Country:     ', payee.country || 'N/A');
      console.log('Type:        ', payee.type || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

payeesCmd
  .command('delete <payee-id>')
  .description('Delete a payee')
  .action(async (payeeId) => {
    requireAuth();
    try {
      await withSpinner('Deleting payee...', () => deletePayee(payeeId));
      printSuccess(`Payee deleted: ${payeeId}`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// PAYOUTS
// ============================================================

const payoutsCmd = program.command('payouts').description('Manage payouts');

payoutsCmd
  .command('list')
  .description('List payouts')
  .requiredOption('--payor-id <id>', 'Payor ID')
  .option('--status <status>', 'Filter by status')
  .option('--page <n>', 'Page number', '1')
  .option('--page-size <n>', 'Results per page', '25')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Fetching payouts...', () =>
        listPayouts(options.payorId, {
          page: parseInt(options.page),
          pageSize: parseInt(options.pageSize),
          status: options.status
        })
      );
      const payouts = result.content || result.payouts || result || [];
      if (options.json) { printJson(payouts); return; }
      const arr = Array.isArray(payouts) ? payouts : [];
      printTable(arr, [
        { key: 'payoutId', label: 'ID', format: (v) => v?.substring(0, 8) + '...' },
        { key: 'payoutMemo', label: 'Memo', format: (v) => v?.substring(0, 25) || '' },
        { key: 'status', label: 'Status' },
        { key: 'totalPayments', label: 'Payments', format: (v) => String(v || 0) },
        { key: 'submittedDateTime', label: 'Submitted', format: (v) => v?.substring(0, 10) || '' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

payoutsCmd
  .command('get <payout-id>')
  .description('Get a specific payout')
  .option('--json', 'Output as JSON')
  .action(async (payoutId, options) => {
    requireAuth();
    try {
      const payout = await withSpinner('Fetching payout...', () => getPayout(payoutId));
      if (!payout) { printError('Payout not found'); process.exit(1); }
      if (options.json) { printJson(payout); return; }
      console.log(chalk.bold('\nPayout Details\n'));
      console.log('ID:          ', chalk.cyan(payout.payoutId));
      console.log('Status:      ', chalk.bold(payout.status));
      if (payout.payoutMemo) console.log('Memo:        ', payout.payoutMemo);
      console.log('Total:       ', payout.totalPayments || 0, 'payments');
      if (payout.submittedDateTime) console.log('Submitted:   ', payout.submittedDateTime?.substring(0, 10));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

payoutsCmd
  .command('submit')
  .description('Submit a new payout from JSON file')
  .requiredOption('--file <path>', 'JSON file with payout data')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    let payoutData;
    try {
      const { readFileSync } = await import('fs');
      payoutData = JSON.parse(readFileSync(options.file, 'utf8'));
    } catch (e) {
      printError('Failed to read/parse file: ' + e.message);
      process.exit(1);
    }
    try {
      const result = await withSpinner('Submitting payout...', () => submitPayout(payoutData));
      if (options.json) { printJson(result); return; }
      printSuccess(`Payout submitted: ${result.payoutId || 'unknown'}`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

payoutsCmd
  .command('withdraw <payout-id>')
  .description('Withdraw a payout')
  .action(async (payoutId) => {
    requireAuth();
    try {
      await withSpinner('Withdrawing payout...', () => withdrawPayout(payoutId));
      printSuccess(`Payout withdrawn: ${payoutId}`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// PAYMENTS
// ============================================================

const paymentsCmd = program.command('payments').description('View individual payments');

paymentsCmd
  .command('list')
  .description('List payments')
  .option('--payout-id <id>', 'Filter by payout ID')
  .option('--status <status>', 'Filter by status')
  .option('--page <n>', 'Page number', '1')
  .option('--page-size <n>', 'Results per page', '25')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Fetching payments...', () =>
        listPayments({
          payoutId: options.payoutId,
          page: parseInt(options.page),
          pageSize: parseInt(options.pageSize),
          status: options.status
        })
      );
      const payments = result.content || result.payments || result || [];
      if (options.json) { printJson(payments); return; }
      const arr = Array.isArray(payments) ? payments : [];
      printTable(arr, [
        { key: 'paymentId', label: 'ID', format: (v) => v?.substring(0, 8) + '...' },
        { key: 'payeeName', label: 'Payee', format: (v) => v?.substring(0, 20) || '' },
        { key: 'paymentAmount', label: 'Amount', format: (v, row) => v ? `${row.paymentCurrency || ''} ${(v/100).toFixed(2)}` : '' },
        { key: 'status', label: 'Status' },
        { key: 'submittedDateTime', label: 'Submitted', format: (v) => v?.substring(0, 10) || '' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

paymentsCmd
  .command('get <payment-id>')
  .description('Get a specific payment')
  .option('--json', 'Output as JSON')
  .action(async (paymentId, options) => {
    requireAuth();
    try {
      const payment = await withSpinner('Fetching payment...', () => getPayment(paymentId));
      if (!payment) { printError('Payment not found'); process.exit(1); }
      if (options.json) { printJson(payment); return; }
      console.log(chalk.bold('\nPayment Details\n'));
      console.log('ID:          ', chalk.cyan(payment.paymentId));
      console.log('Payee:       ', payment.payeeName || 'N/A');
      if (payment.paymentAmount) {
        console.log('Amount:      ', chalk.green(`${payment.paymentCurrency} ${(payment.paymentAmount/100).toFixed(2)}`));
      }
      console.log('Status:      ', payment.status);
      if (payment.memo) console.log('Memo:        ', payment.memo);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// PAYOR
// ============================================================

const payorCmd = program.command('payor').description('View payor information');

payorCmd
  .command('get <payor-id>')
  .description('Get payor details')
  .option('--json', 'Output as JSON')
  .action(async (payorId, options) => {
    requireAuth();
    try {
      const payor = await withSpinner('Fetching payor...', () => getPayor(payorId));
      if (!payor) { printError('Payor not found'); process.exit(1); }
      if (options.json) { printJson(payor); return; }
      console.log(chalk.bold('\nPayor Details\n'));
      console.log('ID:          ', chalk.cyan(payor.payorId));
      console.log('Name:        ', chalk.bold(payor.payorName));
      console.log('Country:     ', payor.country || 'N/A');
      console.log('Currency:    ', payor.payorType || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

payorCmd
  .command('funding-accounts <payor-id>')
  .description('List funding accounts for a payor')
  .option('--json', 'Output as JSON')
  .action(async (payorId, options) => {
    requireAuth();
    try {
      const result = await withSpinner('Fetching funding accounts...', () =>
        listPayorFundingAccounts(payorId)
      );
      const accounts = result.content || result || [];
      if (options.json) { printJson(accounts); return; }
      const arr = Array.isArray(accounts) ? accounts : [];
      printTable(arr, [
        { key: 'id', label: 'ID', format: (v) => v?.substring(0, 8) + '...' },
        { key: 'name', label: 'Name', format: (v) => v?.substring(0, 25) || '' },
        { key: 'currency', label: 'Currency' },
        { key: 'balance', label: 'Balance', format: (v) => v ? (v/100).toFixed(2) : '' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
if (process.argv.length <= 2) program.help();
