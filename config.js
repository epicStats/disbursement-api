/**
 * Azampay Disbursement API - Shared Configuration
 * All sensitive values are loaded from environment variables.
 * Copy .env.example → .env and fill in your credentials.
 */

// Node 20.6+ supports --env-file flag natively (node --env-file=.env yourfile.js).
// For older Node versions, install dotenv: npm install dotenv
// then uncomment the next line:
import 'dotenv/config';

const missing = [];
function require_env(key) {
  const val = process.env[key];
  if (!val) missing.push(key);
  return val ?? '';
}

export const CONFIG = {
  appName:      require_env('APP_NAME'),
  clientId:     require_env('CLIENT_ID'),
  clientSecret: require_env('CLIENT_SECRET'),

  authBaseUrl:     require_env('AUTH_BASE_URL'),
  disburseBaseUrl: require_env('DISBURSE_BASE_URL'),
  balanceBaseUrl:  require_env('BALANCE_BASE_URL'),

  publicKey: require_env('PUBLIC_KEY'),

  source: require_env('SOURCE_ACCOUNT_NUMBER'),
  destination: require_env('DEST_ACCOUNT_NUMBER'),
  amount: require_env('DISBURSE_AMOUNT'),

};

if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
    'Copy .env.example to .env and fill in your credentials.'
  );
}

/**
 * Supported bank/wallet names accepted by the Azampay disbursement API.
 * @readonly
 * @enum {string}
 */
export const BankName = Object.freeze({
  VODACOM:  'Vodacom',
  YAS:      'Yas',
  AIRTEL:   'Airtel',
  HALOTEL:  'Halotel',
  AZAMPESA: 'Azampesa',
  TPESA:    'Tpesa',
});

/**
 * Validate that the given bankName is a supported value.
 * @param {string} bankName
 * @throws {Error} if bankName is not in the enum
 */
export function assertValidBankName(bankName) {
  const valid = Object.values(BankName);
  if (!valid.includes(bankName)) {
    throw new Error(
      `Invalid bankName "${bankName}". Must be one of: ${valid.join(', ')}`
    );
  }
}
