import { generateToken } from './auth.js';
import { computeChecksum, generateReferenceId } from './checksum.js';
import { CONFIG, assertValidBankName, BankName } from './config.js';

/**
 * Disburse funds from a source account to a destination account.
 *
 * @param {Object}        params
 * @param {Object}        params.source
 * @param {string}        params.source.fullName
 * @param {string}        params.source.bankName        
 * @param {string}        params.source.accountNumber
 * @param {string}        [params.source.currency='TZS']
 * @param {string}        [params.source.countryCode='TZ']
 * @param {Object}        params.destination
 * @param {string}        params.destination.fullName
 * @param {string}        params.destination.bankName  
 * @param {string}        params.destination.accountNumber
 * @param {string}        [params.destination.currency='TZS']
 * @param {string}        [params.destination.countryCode='TZ']
 * @param {string|number} params.amount
 * @param {string}        [params.externalReferenceId]
 * @param {string}        [params.remarks='']
 * @returns {Promise<Object>}
 */
export async function disburse({
  source,
  destination,
  amount,
  externalReferenceId,
  remarks = '',
}) {
  if (!source?.accountNumber || !destination?.accountNumber || !amount) {
    throw new Error('source, destination and amount are required');
  }

  // Step 1: Validate bank names
  assertValidBankName(source.bankName);
  assertValidBankName(destination.bankName);

  // Step 2: Get bearer token
  const token = await generateToken();

  // Step 3: Build checksum inputs
  const currency      = source.currency || 'TZS';
  const epochDate     = Math.floor(Date.now() / 1000);
  const refId         = externalReferenceId || generateReferenceId();
  const checksumInput =
    source.accountNumber +
    destination.accountNumber +
    currency +
    String(amount) +
    epochDate +
    refId;
  const checksum = computeChecksum(checksumInput);

  console.log('[Disburse] Source account  :', source.accountNumber);
  console.log('[Disburse] Dest account    :', destination.accountNumber);
  console.log('[Disburse] Amount          :', amount, currency);
  console.log('[Disburse] Epoch date      :', epochDate);
  console.log('[Disburse] Reference ID    :', refId);
  console.log('[Disburse] Checksum (40ch) :', checksum.substring(0, 40) + '...');

  // Step 4: Build request payload
  const payload = {
    source: {
      countryCode:   source.countryCode || 'TZ',
      fullName:      source.fullName,
      bankName:      source.bankName,
      accountNumber: source.accountNumber,
      currency,
    },
    destination: {
      countryCode:   destination.countryCode || 'TZ',
      fullName:      destination.fullName,
      bankName:      destination.bankName,
      accountNumber: destination.accountNumber,
      currency:      destination.currency || 'TZS',
    },
    transferDetails: {
      type:        'FUND',
      amount:      String(amount),
      dateInEpoch: epochDate,
    },
    externalReferenceId: refId,
    additionalProperties: { property1: null, property2: null },
    checksum,
    remarks,
  };

  // Step 5: Call the API
  const response = await fetch(
    `${CONFIG.disburseBaseUrl}/api/v1/azampay/disburse`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// node --env-file=.env disburse.js
if (process.argv[1].endsWith('disburse.js')) {
  disburse({
    source: {
      fullName:      process.env.SOURCE_FULL_NAME      || 'Stats Life',
      bankName:      process.env.SOURCE_BANK_NAME      || BankName.AZAMPESA,
      accountNumber: process.env.SOURCE_ACCOUNT_NUMBER || '',
      currency:      'TZS',
    },
    destination: {
      fullName:      process.env.DEST_FULL_NAME      || '',
      bankName:      process.env.DEST_BANK_NAME      || BankName.AZAMPESA,
      accountNumber: process.env.DEST_ACCOUNT_NUMBER || '',
      currency:      'TZS',
    },
    amount:  process.env.DISBURSE_AMOUNT  || '100',
    remarks: process.env.DISBURSE_REMARKS || 'Test Disbursement',
  })
    .then(result => console.log('Disburse Result:\n', result))
    .catch(err   => console.error(err.message));
}
