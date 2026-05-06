import { generateToken } from './auth.js';
import { CONFIG, assertValidBankName, BankName } from './config.js';

/**
 * Check the status of a disbursement transaction.
 *
 * @param {Object} params
 * @param {string} params.pgReferenceId - Transaction reference ID from Azampay
 * @param {string} params.bankName      - One of the BankName enum values
 * @returns {Promise<Object>}
 */
export async function getTransactionStatus({ pgReferenceId, bankName }) {
  if (!pgReferenceId || !bankName) {
    throw new Error('pgReferenceId and bankName are required');
  }

  // Step 1: Validate bankName
  assertValidBankName(bankName);

  // Step 2: Get bearer token
  const token = await generateToken();

  // Step 3: Build URL with query params
  const url =
    `${CONFIG.disburseBaseUrl}/api/v1/azampay/transactionstatus` +
    `?pgReferenceId=${encodeURIComponent(pgReferenceId)}` +
    `&bankName=${encodeURIComponent(bankName)}`;

  console.log('Transaction Id:', pgReferenceId);
  console.log('FSP Name:', bankName);

  // Step 4: Call the API
  const response = await fetch(url, {
    method:  'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log('Response:', JSON.stringify(data, null, 2));
  return data;
}

// node --env-file=.env statusCheck.js <pgReferenceId> <bankName>
if (process.argv[1].endsWith('statusCheck.js')) {
  const pgReferenceId = process.argv[2] || '';
  const bankName      = process.argv[3] || BankName.AZAMPESA;

  if (!pgReferenceId) {
    console.error('Usage: node --env-file=.env statusCheck.js <pgReferenceId> <bankName>');
    process.exit(1);
  }

  getTransactionStatus({ pgReferenceId, bankName })
    .then(result => console.log('Status Result:\n', result))
    .catch(err   => console.error(err.message));
}
