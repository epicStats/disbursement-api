import { CONFIG } from './config.js';

// ─── In-memory token cache ────
const _cache = {
  accessToken: null,
  expiresAt:   null,
};

/**
 * Generate (or return cached) a Bearer access token.
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<string>} 
 */
export async function generateToken(forceRefresh = false) {
  // Return cached token if valid (with 60-second buffer)
  if (
    !forceRefresh &&
    _cache.accessToken &&
    _cache.expiresAt &&
    Date.now() < _cache.expiresAt - 60_000
  ) 
  {
    return _cache.accessToken;
  }

  const response = await fetch(
    `${CONFIG.authBaseUrl}/AppRegistration/GenerateToken`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName:      CONFIG.appName,
        clientId:     CONFIG.clientId,
        clientSecret: CONFIG.clientSecret,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();

  const token  = data?.data?.accessToken || data?.accessToken;
  const expire = data?.data?.expire      || data?.expire;

  if (!token) {
    throw new Error('No accessToken in response: ' + JSON.stringify(data));
  }

  // Cache the token
  _cache.accessToken = token;
  _cache.expiresAt   = expire
    ? new Date(expire).getTime()
    : Date.now() + 3_600_000; // default 1 hour

  console.log('Token obtained. Expires:', new Date(_cache.expiresAt).toISOString());
  return token;
}

// node auth.js
if (process.argv[1].endsWith('auth.js')) {
  generateToken()
    .then(token => {
      console.log('Token (first 80 chars):');
      console.log(token.substring(0, 80) + '...');
    })
    .catch(err => console.error(err.message));
}
