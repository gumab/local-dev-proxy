// http://simple.local.your-domain.com/* -> local server

/** @type {import('local-dev-proxy').LocalDevProxyOption} */
module.exports = {
  rule: {
    key: 'sample-key',
    host: 'simple.local.your-domain.com',
  },
};
