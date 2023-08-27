/**
 * @param input {KurlyLocalProxySubRule}
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

/**
 * @param port {number}
 * @param options {KurlyLocalProxyOption}
 */
async function register(port, {rule, subRules}) {
  console.log(rule, subRules);
  try {
    const checkResult = await fetch('http://localhost/__setting/rules').
        then((x) => x.status === 200).
        catch(() => {
        });
    if (!checkResult) {
      console.log('proxy server is not running');
      return;
    }

    const res = await fetch('http://localhost/__setting/register', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          target: `http://localhost:${port}`,
          ...rule,
        }, ...subRules].map(packRequest)),
    });
    if (res.status === 200) {
      console.log('registered');
    } else {
      console.error(res.statusText);
    }
  } catch (e) {
    console.error(e);
  }
}

module.exports.register = register;