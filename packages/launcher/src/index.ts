import fetch from 'node-fetch';
import { RouteRuleRequest } from 'shared/@types';
import { run } from './docker-helper';
import { LocalDevProxyOption, LocalDevProxySubRule } from './types';

export type { LocalDevProxyOption };

function packRequest(input: LocalDevProxySubRule): RouteRuleRequest {
  return {
    ...input,
    path: input.path && typeof input.path === 'string' ? input.path : null,
    pathRegex: input.path && typeof input.path !== 'string' ? input.path.toString() : null,
    referrerRegex: input.referrer ? input.referrer.toString() : null,
  };
}

async function healthCheck() {
  return fetch('http://localhost/__setting/rules')
    .then((x) => x.status === 200)
    .catch(() => {});
}

export async function register(port: number, { rule, subRules = [] }: LocalDevProxyOption) {
  if (!(await healthCheck())) {
    await run();
    await (async function () {
      let count = 0;
      while (count++ < 20) {
        // eslint-disable-next-line no-await-in-loop
        if (await healthCheck()) {
          return;
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error('[local-dev-proxy] 도커 서버의 상태를 확인해주세요');
    })();
    // throw new Error('proxy server is not running');
  }

  const target = `http://localhost:${port}`;

  /**
   * @type {RouteRuleRequest[]}
   */
  const request: RouteRuleRequest[] = [
    ...(rule instanceof Array
      ? rule.map((x) => ({
          ...x,
          target,
        }))
      : [{ ...rule, target }]),
    ...subRules,
  ].map(packRequest);

  const res = await fetch('http://localhost/__setting/register', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (res.status === 200) {
    const first = rule instanceof Array ? rule[0] : rule;
    console.log(`[local-dev-proxy] 등록 완료 [${first.host} >> ${target}]`);
  } else {
    throw new Error(`[local-dev-proxy] 등록 실패 (${res.statusText})`);
  }
  return request;
}

export async function deregister(rules: { key: string; target: string }[]) {
  if (!(await healthCheck())) {
    return;
  }
  const res = await fetch('http://localhost/__setting/deregister', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rules),
  });

  if (res.status === 200) {
    console.log(`[local-dev-proxy] 등록 해제 완료 (${rules.map((x) => x.key).toString()})`);
  } else {
    throw new Error(`[local-dev-proxy] 등록 해제 실패 (${res.statusText})`);
  }
}