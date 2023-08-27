const {run} = require('./docker-helper');
const fetch = require('node-fetch')

/**
 * @param input {LocalDevProxySubRule}
 * @return {RouteRuleRequest}
 */
function packRequest(input) {
  return {
    ...input,
    path: input.path && typeof input.path === 'string' ? input.path : null,
    pathRegex: input.path && typeof input.path !== 'string' ?
        input.path.toString() :
        null,
    host: input.host && typeof input.host === 'string' ? input.host : null,
    hostRegex: input.host && typeof input.host !== 'string' ?
        input.host.toString() :
        null,
  };
}

async function healthCheck() {
  return await fetch('http://localhost/__setting/rules').
      then((x) => x.status === 200).
      catch(() => {
      });
}

/**
 * @param port {number}
 * @param options {LocalDevProxyOption}
 */
async function register(port, {rule, subRules = []}) {
  if (!await healthCheck()) {
    await run();
    await (async function() {
      let count = 0;
      while (count++ < 10) {
        if (await healthCheck()) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error('서버를 확인해주세요');
    })();
    // throw new Error('proxy server is not running');
  }

  const target = `http://localhost:${port}`;
  const res = await fetch('http://localhost/__setting/register', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        target,
        ...rule,
      }, ...subRules].map(packRequest)),
  });
  if (res.status === 200) {
    console.log(`등록 완료 [${rule.host} >> ${target}]`);
  } else {
    throw new Error(`등록 실패`);
  }
}

module.exports.register = register;