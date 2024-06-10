// http://by-referrer.local.your-domain.com/your-service -> local server
// request on http://by-referrer.local.your-domain.com/your-service (by referrer) -> local server
// http://by-referrer.local.your-domain.com/other-service -> remote server

const host = 'by-referrer.local.your-domain.com';

/** @type {import('local-dev-proxy').LocalDevProxyOption} */
module.exports = {
  rule: [
    {
      key: 'sample-key-local',
      priority: 1,
      host,
      path: /^\/your-service\//,
    }, {
      key: 'sample-key-local',
      priority: 1,
      host,
      referrer: new RegExp(host + '/your-service'),
    }],
  subRules: [
    {
      key: 'sample-key-remote',
      priority: 2,
      host,
      target: `https://remote.your-domain.com`,
    },
  ],
};
