import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import { login, logout, listPayors, getPayor, listPayees, getPayee, listPayouts, getPayout, listPayments, getPayment, listFundingAccounts } from './api.js';

const program = new Command();

function printSuccess(msg) { console.log(chalk.green('✓') + ' ' + msg); }
function printError(msg) { console.error(chalk.red('✗') + ' ' + msg); }
function printJson(data) { console.log(JSON.stringify(data, null, 2)); }
async function withSpinner(msg, fn) { const s = ora(msg).start(); try { const r = await fn(); s.stop(); return r; } catch (e) { s.stop(); throw e; } }
function requireAuth() { if (!isConfigured()) { printError('API credentials not configured.'); console.log('\nRun: velopay config set --api-key <key> --api-secret <secret>'); process.exit(1); } }

program.name('velopay').description(chalk.bold('Velo Payments CLI') + ' - Mass payouts from your terminal').version('1.0.0');

const configCmd = program.command('config').description('Manage CLI configuration');
configCmd.command('set').option('--api-key <key>', 'API key').option('--api-secret <secret>', 'API secret').option('--environment <env>', 'Environment (sandbox|production)').action((opts) => { if (opts.apiKey) { setConfig('apiKey', opts.apiKey); printSuccess('API key set'); } if (opts.apiSecret) { setConfig('apiSecret', opts.apiSecret); printSuccess('API secret set'); } if (opts.environment) { setConfig('environment', opts.environment); printSuccess(`Environment set to ${opts.environment}`); } });
configCmd.command('show').action(() => { console.log(chalk.bold('\nVelo Payments Configuration\n')); console.log('API Key:    ', getConfig('apiKey') ? chalk.green('*'.repeat(20)) : chalk.red('not set')); console.log('API Secret: ', getConfig('apiSecret') ? chalk.green('*'.repeat(8)) : chalk.red('not set')); console.log('Environment:', getConfig('environment') || 'sandbox'); console.log(''); });

const authCmd = program.command('auth').description('Manage authentication');
authCmd.command('login').action(async () => { requireAuth(); try { await withSpinner('Authenticating...', login); printSuccess('Authenticated successfully'); } catch (e) { printError(e.message); process.exit(1); } });
authCmd.command('logout').action(async () => { try { await withSpinner('Logging out...', logout); printSuccess('Logged out successfully'); } catch (e) { printError(e.message); process.exit(1); } });

const payorsCmd = program.command('payors').description('Manage payors');
payorsCmd.command('list').option('--json', 'JSON output').action(async (opts) => { requireAuth(); try { const payors = await withSpinner('Fetching payors...', listPayors); if (opts.json) { printJson(payors); } else { payors.forEach(p => console.log(`${p.payorId} - ${p.payorName || 'N/A'}`)); } } catch (e) { printError(e.message); process.exit(1); } });
payorsCmd.command('get <payor-id>').option('--json', 'JSON output').action(async (id, opts) => { requireAuth(); try { const payor = await withSpinner('Fetching payor...', () => getPayor(id)); if (opts.json) { printJson(payor); } else { console.log(chalk.bold('\nPayor Details\n')); console.log('ID:   ', payor.payorId); console.log('Name: ', payor.payorName || 'N/A'); } } catch (e) { printError(e.message); process.exit(1); } });

const payeesCmd = program.command('payees').description('Manage payees');
payeesCmd.command('list').option('--json', 'JSON output').action(async (opts) => { requireAuth(); try { const payees = await withSpinner('Fetching payees...', listPayees); if (opts.json) { printJson(payees); } else { payees.forEach(p => console.log(`${p.payeeId} - ${p.email || 'N/A'}`)); } } catch (e) { printError(e.message); process.exit(1); } });
payeesCmd.command('get <payee-id>').option('--json', 'JSON output').action(async (id, opts) => { requireAuth(); try { const payee = await withSpinner('Fetching payee...', () => getPayee(id)); if (opts.json) { printJson(payee); } else { console.log(chalk.bold('\nPayee Details\n')); console.log('ID:    ', payee.payeeId); console.log('Email: ', payee.email || 'N/A'); } } catch (e) { printError(e.message); process.exit(1); } });

const payoutsCmd = program.command('payouts').description('Manage payouts');
payoutsCmd.command('list').option('--json', 'JSON output').action(async (opts) => { requireAuth(); try { const payouts = await withSpinner('Fetching payouts...', listPayouts); if (opts.json) { printJson(payouts); } else { payouts.forEach(p => console.log(`${p.payoutId} - ${p.status || 'N/A'}`)); } } catch (e) { printError(e.message); process.exit(1); } });
payoutsCmd.command('get <payout-id>').option('--json', 'JSON output').action(async (id, opts) => { requireAuth(); try { const payout = await withSpinner('Fetching payout...', () => getPayout(id)); if (opts.json) { printJson(payout); } else { console.log(chalk.bold('\nPayout Details\n')); console.log('ID:     ', payout.payoutId); console.log('Status: ', payout.status || 'N/A'); } } catch (e) { printError(e.message); process.exit(1); } });

const paymentsCmd = program.command('payments').description('Manage payments');
paymentsCmd.command('list').option('--json', 'JSON output').action(async (opts) => { requireAuth(); try { const payments = await withSpinner('Fetching payments...', listPayments); if (opts.json) { printJson(payments); } else { payments.forEach(p => console.log(`${p.paymentId} - ${p.amount || 'N/A'} ${p.currency || ''}`)); } } catch (e) { printError(e.message); process.exit(1); } });

const fundingCmd = program.command('funding').description('Manage funding');
fundingCmd.command('accounts').option('--json', 'JSON output').action(async (opts) => { requireAuth(); try { const accounts = await withSpinner('Fetching funding accounts...', listFundingAccounts); if (opts.json) { printJson(accounts); } else { accounts.forEach(a => console.log(`${a.fundingAccountId} - ${a.name || 'N/A'}`)); } } catch (e) { printError(e.message); process.exit(1); } });

program.parse(process.argv);
if (process.argv.length <= 2) { program.help(); }
