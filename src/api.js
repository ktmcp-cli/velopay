import axios from 'axios';
import { getConfig, setConfig, hasValidToken } from './config.js';

const BASE_URLS = {
  sandbox: 'https://api.sandbox.velopayments.com',
  production: 'https://api.payouts.velopayments.com'
};

async function getAccessToken() {
  if (hasValidToken()) {
    return getConfig('accessToken');
  }
  return await authenticate();
}

async function authenticate() {
  const apiKey = getConfig('apiKey');
  const apiSecret = getConfig('apiSecret');
  const environment = getConfig('environment') || 'sandbox';

  if (!apiKey || !apiSecret) {
    throw new Error('API credentials not configured. Run: velopay config set --api-key <key> --api-secret <secret>');
  }

  const baseUrl = BASE_URLS[environment];

  try {
    const response = await axios.post(`${baseUrl}/v1/authenticate`, {
      apiKey,
      apiSecret
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { access_token, expires_in } = response.data;
    setConfig('accessToken', access_token);
    setConfig('tokenExpiry', Date.now() + (expires_in * 1000));

    return access_token;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    throw new Error(`Authentication failed: ${msg}`);
  }
}

async function apiRequest(method, endpoint, data = null, params = null) {
  const token = await getAccessToken();
  const environment = getConfig('environment') || 'sandbox';
  const baseUrl = BASE_URLS[environment];

  const config = {
    method,
    url: `${baseUrl}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (params) config.params = params;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      throw new Error('Authentication failed. Run: velopay auth login');
    } else if (status === 403) {
      throw new Error('Access forbidden.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded.');
    } else {
      const message = data?.message || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from Velo API. Check your internet connection.');
  } else {
    throw error;
  }
}

// AUTH
export async function login() {
  return await authenticate();
}

export async function logout() {
  const token = getConfig('accessToken');
  if (!token) return;

  const environment = getConfig('environment') || 'sandbox';
  const baseUrl = BASE_URLS[environment];

  try {
    await axios.post(`${baseUrl}/v1/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    // Ignore logout errors
  }

  setConfig('accessToken', '');
  setConfig('tokenExpiry', 0);
}

// PAYORS
export async function listPayors(params = {}) {
  const data = await apiRequest('GET', '/v1/payors', null, params);
  return data.content || [];
}

export async function getPayor(payorId) {
  const data = await apiRequest('GET', `/v1/payors/${payorId}`);
  return data || null;
}

export async function getPayorV2(payorId) {
  const data = await apiRequest('GET', `/v2/payors/${payorId}`);
  return data || null;
}

export async function getPayorBranding(payorId) {
  const data = await apiRequest('GET', `/v1/payors/${payorId}/branding`);
  return data || null;
}

// PAYEES
export async function listPayees(params = {}) {
  const data = await apiRequest('GET', '/v1/payees', null, params);
  return data.content || [];
}

export async function getPayee(payeeId) {
  const data = await apiRequest('GET', `/v1/payees/${payeeId}`);
  return data || null;
}

export async function invitePayee(payeeData) {
  const data = await apiRequest('POST', '/v2/payees', payeeData);
  return data || null;
}

// PAYOUTS
export async function listPayouts(params = {}) {
  const data = await apiRequest('GET', '/v1/payouts', null, params);
  return data.content || [];
}

export async function getPayout(payoutId) {
  const data = await apiRequest('GET', `/v1/payouts/${payoutId}`);
  return data || null;
}

export async function createPayout(payoutData) {
  const data = await apiRequest('POST', '/v1/payouts', payoutData);
  return data || null;
}

export async function submitPayout(payoutId) {
  await apiRequest('POST', `/v1/payouts/${payoutId}/submit`);
  return true;
}

// PAYMENTS
export async function listPayments(params = {}) {
  const data = await apiRequest('GET', '/v1/payments', null, params);
  return data.content || [];
}

export async function getPayment(paymentId) {
  const data = await apiRequest('GET', `/v1/payments/${paymentId}`);
  return data || null;
}

export async function withdrawPayment(paymentId) {
  await apiRequest('POST', `/v1/payments/${paymentId}/withdraw`);
  return true;
}

// FUNDING
export async function listFundingAccounts(params = {}) {
  const data = await apiRequest('GET', '/v2/fundingAccounts', null, params);
  return data.content || [];
}

export async function getFunding(fundingId) {
  const data = await apiRequest('GET', `/v1/fundings/${fundingId}`);
  return data || null;
}

export async function listFundingDeltas(params = {}) {
  const data = await apiRequest('GET', '/v1/deltas/fundings', null, params);
  return data.content || [];
}
