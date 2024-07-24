import { ChildProcess } from 'child_process';
import opn from 'better-opn';
import { wrapSpawn } from './utils';
import { findNewPort } from './utils/port-finder';
import { deregister, register } from './index';
import { LocalDevProxyOption, LocalDevProxyRule, LocalDevProxySubRule, RouteRuleRequest } from './types';
import { waitForDockerRunning } from './docker-helper';
import { logger } from './utils/logger';
import { LdprxError } from './libs/LdprxError';
import { checkCertificates } from './utils/certificate-helper';
import { checkHostDns } from './utils/hosts-helper';
import { callPromiseSequentially } from './utils/promise-helper';
import { t } from './i18n';

function makeConfigError(message: string) {
  return new LdprxError(t('.ldprxrc.js configuration is invalid.\n{{message}}', { message }));
}

function validateRule(rule: LocalDevProxyRule) {
  if (!rule.key) {
    throw makeConfigError(t('Missing "key" value'));
  } else if (!rule.host) {
    throw makeConfigError(t('Missing "host" value for "{{key}}"', { key: rule.key }));
  }

  return rule.host;
}

function validateSubRule(rule: LocalDevProxySubRule) {
  if (!rule.key) {
    throw makeConfigError(t('Missing "key" value for some sub-rule'));
  } else if (!rule.targetOrigin) {
    throw makeConfigError(t('Missing "targetOrigin" value for "{{key}}"', { key: rule.key }));
  } else if (!/^https?:\/\/[^/]+$/.test(rule.targetOrigin)) {
    throw makeConfigError(
      t('Invalid "targetOrigin" value for "{{key}}". Please use the format http[s]://sample.my-domain.com', {
        key: rule.key,
      }),
    );
  }
}

function validateConfig(config: LocalDevProxyOption) {
  const mainRules = config.rule instanceof Array ? config.rule : [config.rule];

  config.subRules?.forEach((subRule) => validateSubRule(subRule));

  if (config.rule && mainRules.length > 0) {
    mainRules.forEach(validateRule);
  } else {
    throw makeConfigError(t('At least one rule must be set'));
  }

  return { mainRules, subRules: config.subRules || [] };
}

async function kill(
  cp: ChildProcess,
  signal: number,
  timeout?: number,
): Promise<{
  code: number | null;
  signal: NodeJS.Signals | null;
}> {
  let isResolved = false;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      isResolved = true;
      reject(new Error('Process kill timeout'));
    }, timeout || 10000);
    cp.once('exit', (code, signal) => {
      if (isResolved) {
        return;
      }
      clearTimeout(timer);
      resolve({
        code,
        signal,
      });
    });
    cp.kill(signal);
  });
}

function getHosts(mainRules: LocalDevProxyRule[], subRules: LocalDevProxySubRule[]) {
  const ruleList: (LocalDevProxyRule | LocalDevProxySubRule)[] = mainRules;

  return ruleList.concat(subRules).reduce<{ host: string; https: boolean }[]>((result, { host, https = false }) => {
    if (host && !result.some((x) => x.host === host && x.https === https)) {
      return result.concat({ host, https });
    }
    return result;
  }, []);
}

export default class ProcessRunner {
  private cp?: ChildProcess;

  private registeredRules: RouteRuleRequest[] = [];

  private isRunning: boolean = false;

  async run(command: string[], config: LocalDevProxyOption) {
    this.isRunning = true;
    const localServerPort = typeof config.localServerPort === 'number' ? config.localServerPort : undefined;
    const { mainRules, subRules } = validateConfig(config);
    const hosts = getHosts(mainRules, subRules);

    await checkHostDns(hosts.map((x) => x.host));
    await waitForDockerRunning();
    await callPromiseSequentially(
      hosts
        .filter((x) => x.https)
        .map((x) => x.host)
        .map((x) => () => checkCertificates(x)),
    );

    this.cp = wrapSpawn(command[0], command.slice(1), { stdio: 'inherit' });
    this.cp.on('exit', async (code) => {
      this.cp = undefined;
      await this.kill(code || 0);
    });
    if (!this.cp.pid) {
      throw new LdprxError(t('Unknown error occurred (could not find child process PID)'));
    }
    this.registeredRules = await register(localServerPort || (await findNewPort(this.cp.pid)), mainRules, subRules);

    const { homePath = '', openOnStart = true } = config;
    if (openOnStart) {
      if (/^https?:\/\//.test(homePath)) {
        opn(homePath);
      } else {
        opn(`${hosts[0].https ? 'https' : 'http'}://${hosts[0].host}${homePath}`);
      }
    }
  }

  async kill(code: number) {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;

    if (this.cp) {
      await kill(this.cp, code).catch(logger.error);
      this.cp = undefined;
    }

    if (this.registeredRules.length > 0) {
      await deregister(this.registeredRules.map((x) => ({ key: x.key, target: x.target })));
      this.registeredRules = [];
    }
  }
}
