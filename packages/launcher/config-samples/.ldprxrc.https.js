// https://https.local.your-domain.com/* -> local server
// http://https.local.your-domain.com/* -> https://https.local.your-domain.com/* (Redirect)

/** @type {import('local-dev-proxy').LocalDevProxyOption} */
module.exports = {
  rule: {
    key: 'sample-key',
    host: 'https.local.your-domain.com',
  },
};
