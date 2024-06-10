// http://simple.local.your-domain.com/* -> local server
// http://simple.local.your-domain.com/remote/* -> https://remote.your-domain.com

/** @type {import('local-dev-proxy').LocalDevProxyOption} */
module.exports = {
  rule: {
    key: 'sample-key',
    priority: 1,
    host: 'simple.local.your-domain.com',
  },
  subRules: [
    {
      key: 'sample-key-remote',
      priority: 2,
      host: 'simple.local.your-domain.com',
      path: /^\/remote/,
      target: `https://remote.your-domain.com`,
    },
  ],
};
