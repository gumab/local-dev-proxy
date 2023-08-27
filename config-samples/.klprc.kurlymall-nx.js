const host = 'www.local.kurly.com';

/** @type {import('kurly-local-proxy').KurlyLocalProxyOption} */
module.exports = {
  rule: {
    key: 'kurlymall-nx',
    priority: 1,
    host,
    path: /^\/(?:mock|nx|__?next|introduce|order|address|gift|policy|mypage|webview|main|cart|goods|member|event|user-terms|user-guide|category|market-benefit|goods-list|beauty-benefit|beauty-event|search|board|collections|categories|collection-groups|m\/|images\/|manifest\.json|service-worker\.js|sitemap|naver|partners|popup|events|\.well-known|apple-app-site-association|devtools|games|redirect|kurlypay|open)/,
  },
  subRules: [
    {
      key: 'campaign',
      priority: 2,
      host,
      path: /^\/campaign/,
      pathRewrite: {
        '^/campaign': '',
      },
      target: `https://campaign.dev.kurly.com`,
    },
    {
      key: 'www-v2',
      priority: 3,
      host,
      target: `https://www.dev.kurly.com`,
    },
  ],
};
