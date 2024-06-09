/** @type {import('@gumab/local-dev-proxy').LocalDevProxyOption} */
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
      target: `https://remote.your-domain.com`,
    },
  ],
};
