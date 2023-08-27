const host = 'lacms2.local.kurlycorp.kr';

/** @type {import('@thefarmersfront/local-dev-proxy').LocalDevProxyOption} */
module.exports = {
  rule: [
    {
      key: 'lego',
      priority: 1,
      host,
      path: /^\/(?:lego)/,
    }, {
      key: 'lego',
      priority: 1,
      host,
      referrer: new RegExp(host + '/lego'),
    }],
  subRules: [
    {
      key: 'lacms2',
      priority: 2,
      host,
      target: `https://lacms2.dev.kurly.com`,
    },
  ],
};
