import axios from 'axios';
import { getConfig, setConfig } from './config.js';

const BASE_URL = 'https://api.velopayments.com';

function getHeaders() {
  const accessToken = getConfig('accessToken');
  if (!accessToken) throw new Error('Not authenticated. Run: velopay auth login');
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401) throw new Error('Authentication failed. Run: velopay auth login');
    if (status === 403) throw new Error('Access forbidden. Check your permissions.');
    if (status === 404) throw new Error('Resource not found.');
    if (status === 429) throw new Error('Rate limit exceeded. Please wait before retrying.');
    const message = data?.message || data?.title || JSON.stringify(data);
    throw new Error(`API Error (${status}): ${message}`);
  } else if (error.request) {
    throw new Error('No response from Velo API. Check your internet connection.');
  } else {
    throw error;
  }
}

async function apiRequest(method, endpoint, data = null, params = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: getHeaders()
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

// Auth
export async function authenticate(apiKey, apiSecret) {
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  try {
    const response = await axios.post(`${BASE_URL}/v1/authenticate`, {}, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });
    const { access_token, expires_in } = response.data;
    setConfig('accessToken', access_token);
    setConfig('tokenExpiry', Date.now() + (expires_in * 1000));
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// Payees
export async function listPayees(payorId, { page = 1, pageSize = 25, status, ofacStatus } = {}) {
  const params = { payorId, page, pageSize };
  if (status) params.status = status;
  if (ofacStatus) params.ofacStatus = ofacStatus;
  return await apiRequest('GET', '/v4/payees', null, params);
}

export async function getPayee(payeeId) {
  return await apiRequest('GET', `/v4/payees/${payeeId}`);
}

export async function createPayee(payeeData) {
  return await apiRequest('POST', '/v3/payees', payeeData);
}

export async function deletePayee(payeeId) {
  return await apiRequest('DELETE', `/v1/payees/${payeeId}`);
}

// Payouts
export async function submitPayout(payoutData) {
  return await apiRequest('POST', '/v3/payouts', payoutData);
}

export async function getPayout(payoutId) {
  return await apiRequest('GET', `/v3/payouts/${payoutId}`);
}

export async function listPayouts(payorId, { page = 1, pageSize = 25, status } = {}) {
  const params = { payorId, page, pageSize };
  if (status) params.status = status;
  return await apiRequest('GET', '/v3/payouts', null, params);
}

export async function withdrawPayout(payoutId) {
  return await apiRequest('POST', `/v3/payouts/${payoutId}/withdraw`);
}

// Payments
export async function listPayments({ payoutId, page = 1, pageSize = 25, status } = {}) {
  const params = { page, pageSize };
  if (payoutId) params.payoutId = payoutId;
  if (status) params.status = status;
  return await apiRequest('GET', '/v4/payments', null, params);
}

export async function getPayment(paymentId) {
  return await apiRequest('GET', `/v4/payments/${paymentId}`);
}

// Payor
export async function getPayor(payorId) {
  return await apiRequest('GET', `/v1/payors/${payorId}`);
}

export async function listPayorFundingAccounts(payorId) {
  return await apiRequest('GET', `/v1/payors/${payorId}/fundingAccounts`);
}

// Webhooks
export async function listWebhooks(payorId) {
  const params = {};
  if (payorId) params.payorId = payorId;
  return await apiRequest('GET', '/v1/webhooks', null, params);
}

export async function createWebhook(webhookData) {
  return await apiRequest('POST', '/v1/webhooks', webhookData);
}

export async function updateWebhook(webhookId, webhookData) {
  return await apiRequest('PUT', `/v1/webhooks/${webhookId}`, webhookData);
}
