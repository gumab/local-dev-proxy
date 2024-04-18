import fetch from 'node-fetch';
import { healthCheck, waitForDockerRunning } from './docker-helper';
import { LocalDevProxyOption, LocalDevProxyRule, LocalDevProxySubRule, RouteRuleRequest } from './types';
import { logger } from './utils/logger';
import { LdprxError } from './libs/LdprxError';

export type { LocalDevProxyOption };

function packRequest(
  { host, targetOrigin, https, path, referrer, ...input }: LocalDevProxySubRule,
  mainRule: LocalDevProxyRule,
): RouteRuleRequest {
  return {
    ...input,
    target: targetOrigin,
    host: host || mainRule.host,
    https: https ?? false,
    path: path && typeof path === 'string' ? path : null,
    pathRegex: path && typeof path !== 'string' ? path.toString() : null,
    referrerRegex: referrer ? referrer.toString() : null,
  };
}

export async function register(port: number, mainRules: LocalDevProxyRule[], subRules: LocalDevProxySubRule[]) {
  await waitForDockerRunning();

  const mainRule = mainRules[0];

  const targetOrigin = `http://localhost:${port}`;

  /**
   * @type {RouteRuleRequest[]}
   */
  const request: RouteRuleRequest[] = [
    ...mainRules.map((x) => ({
      ...x,
      targetOrigin,
    })),
    ...subRules,
  ].map((x) => packRequest(x, mainRule));

  const res = await fetch('http://localhost/__setting/register', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (res.status === 200) {
    if (mainRule.https) {
      logger.log(`등록 완료 [https://${mainRule.host}, http://${mainRule.host} >> ${targetOrigin}]`);
    } else {
      logger.log(`등록 완료 [http://${mainRule.host} >> ${targetOrigin}]`);
    }
  } else {
    throw new LdprxError(`등록 실패 (${res.statusText})`);
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
    logger.log(`등록 해제 완료 (${rules.map((x) => x.key).toString()})`);
  } else {
    throw new LdprxError(`등록 해제 실패 (${res.statusText})`);
  }
}
