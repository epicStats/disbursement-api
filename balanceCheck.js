import { generateToken } from './auth.js';
import { CONFIG, assertValidBankName, BankName } from './config.js';

/**
 * Check the wallet or bank account balance.
 * @param {string} [bankName=BankName.AZAMPESA] - One of the BankName enum values
 * @returns {Promise<Object|string>}
 */
export async function checkBalance(bankName = BankName.AZAMPESA) {
  // Step 1: Validate bankName
  assertValidBankName(bankName);

  // Step 2: Get bearer token
  const token = await generateToken();

  // Step 3: Build URL
  const url = `${CONFIG.balanceBaseUrl}/api/v1/azampay/checkbalance/${bankName.toLowerCase()}`;

  console.log('Disbursement Wallet Name:', bankName);

  // Step 4: Call the API (returns text/plain)
  const response = await fetch(url, {
    method:  'GET',
    headers: {
      'accept':        'text/plain',
      'Authorization': `Bearer ${token}`,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  // Parse JSON if possible, otherwise return raw text
  try {
    const data = JSON.parse(text);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch {
    return text;
  }
}

// node --env-file=.env balanceCheck.js [bankName]
if (process.argv[1].endsWith('balanceCheck.js')) {
  const bankName = process.argv[2] || BankName.AZAMPESA;
  checkBalance(bankName)
    .then(result => console.log('Balance Result:\n', result))
    .catch(err   => console.error(err.message));
}
