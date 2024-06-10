// http://www.local.your-domain.com/your-service -> local server
// http://www.local.your-domain.com/other-service -> https://www.your-domain.com/other-service
// http://www.local.your-domain.com/user/user-service -> https://user.your-domain.com/user-service

const host = 'www.local.your-domain.com';

/** @type {import('local-dev-proxy').LocalDevProxyOption} */
module.exports = {
  rule: {
    key: 'complex-app',
    priority: 1,
    host,
  },
  subRules: [
    {
      key: 'remote-user',
      priority: 2,
      host,
      path: /^\/user/,
      pathRewrite: {
        '^/user': '',
      },
      target: `https://user.your-domain.com`,
    },
    {
      key: 'remote-default',
      priority: 3,
      host,
      target: `https://www.your-domain.com`,
    },
  ],
};
