import Conf from 'conf';

const conf = new Conf({ projectName: 'ktmcp-velopay' });

export function getConfig(key) { return conf.get(key); }
export function setConfig(key, value) { conf.set(key, value); }
export function isConfigured() { return !!conf.get('apiKey'); }
