import Conf from 'conf';

const config = new Conf({
  projectName: 'velopay-cli',
  schema: {
    apiKey: {
      type: 'string',
      default: ''
    },
    apiSecret: {
      type: 'string',
      default: ''
    },
    accessToken: {
      type: 'string',
      default: ''
    },
    tokenExpiry: {
      type: 'number',
      default: 0
    },
    environment: {
      type: 'string',
      default: 'sandbox'
    }
  }
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function getAllConfig() {
  return config.store;
}

export function clearConfig() {
  config.clear();
}

export function isConfigured() {
  const apiKey = config.get('apiKey');
  const apiSecret = config.get('apiSecret');
  return !!(apiKey && apiSecret);
}

export function hasValidToken() {
  const accessToken = config.get('accessToken');
  const tokenExpiry = config.get('tokenExpiry');
  if (!accessToken) return false;
  return tokenExpiry > Date.now() + 60000;
}

export default config;
