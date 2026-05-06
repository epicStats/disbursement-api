import { generateToken } from './auth.js';
import { computeChecksum } from './checksum.js';
import { CONFIG, assertValidBankName, BankName } from './config.js';

/**
 * Look up the account holder name for a bank account or mobile wallet.
 *
 * @param {Object} params
 * @param {string} params.bankName      - One of the BankName enum values
 * @param {string} params.accountNumber
 * @returns {Promise<Object>}
 */
export async function nameLookup({ bankName, accountNumber }) {
  if (!bankName || !accountNumber) {
    throw new Error('bankName and accountNumber are required');
  }

  // Step 1: Validate bankName
  assertValidBankName(bankName);

  // Step 2: Get bearer token
  const token = await generateToken();

  // Step 3: Build checksum input and compute checksum
  const checksumInput = bankName + accountNumber;
  const checksum      = computeChecksum(checksumInput);

  console.log('FSP Name:', bankName);
  console.log('Account Number:', accountNumber);

  // Step 4: Call the API
  const response = await fetch(
    `${CONFIG.disburseBaseUrl}/api/v1/azampay/namelookup`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        bankName: CONFIG.bankName,
        accountNumber: CONFIG.accountNumber, 
        checksum, 
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// node --env-file=.env nameLookup.js <bankName> <accountNumber>
if (process.argv[1].endsWith('nameLookup.js')) {
  const bankName      = process.argv[2] || BankName.AZAMPESA;
  const accountNumber = process.argv[3] || '';

  if (!accountNumber) {
    console.error('Usage: node --env-file=.env nameLookup.js <bankName> <accountNumber>');
    process.exit(1);
  }

  nameLookup({ bankName, accountNumber })
    .then(result => console.log('Account Details Result:\n', result))
    .catch(err   => console.error(err.message));
}
