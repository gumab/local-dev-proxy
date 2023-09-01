#!/usr/bin/env node
import path from 'path';
import prompts from 'prompts';
import { LocalDevProxyOption, LocalDevProxyRule, LocalDevProxySubRule } from '../types';
import { execAsync, wrapSpawn } from '../utils';
import { ChildProcess } from 'child_process';
import { RouteRuleRequest } from '@shared/types';
import { findNewPort, getCurrentPort } from '../utils/port-finder';
import { deregister, register } from '../index';

function getConfig(fileName?: string) {
  try {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    return require(path.join(process.cwd(), fileName || '.ldprxrc.js'));
  } catch (e) {
    throw new Error('[local-dev-proxy] .ldprxrc.js 파일이 필요합니다');
  }
}

function validateRule(rule: LocalDevProxyRule | LocalDevProxySubRule, isSubRule?: boolean) {
  if (rule.key && rule.host && (!isSubRule || (rule as LocalDevProxySubRule).target)) {
    return rule.host;
  } else {
    return false;
  }
}

function validateConfig(config: LocalDevProxyOption): string | false {
  if (config.subRules) {
    if (!config.subRules.every((subRule) => validateRule(subRule, true))) {
      return false;
    }
  }
  if (config.rule instanceof Array) {
    return validateRule(config.rule[0]);
  } else {
    return validateRule(config.rule);
  }
}

let registeredRules: RouteRuleRequest[] = [];
let childProcess: ChildProcess | undefined;

async function checkHostDns(host: string) {
  const isRegistered = !!(await execAsync(`cat "/etc/hosts"|grep "127\\.0\\.0\\.1\\s*${host}"`).catch(() => undefined));
  if (!isRegistered) {
    const { registerHost } = await prompts({
      type: 'confirm',
      name: 'registerHost',
      message: `[local-dev-proxy] Host가 등록되지 않았습니다.\n127.0.0.1\t${host}\n항목을 /etc/hosts 파일에 추가하시겠습니까?`,
      initial: true,
    });
    if (registerHost) {
      const existHost = await execAsync(`cat "/etc/hosts"|grep ${host}`)
        .then((x) => x.stdout)
        .catch(() => undefined);
      if (existHost) {
        throw new Error(
          `${host} 은(는) 이미 다른 IP(${existHost.match(
            /[\d.]+/,
          )?.[0]})로 등록되어있습니다. 확인 후 다시 이용해주세요`,
        );
      }

      process.stdout.write('맥 패스워드를 입력하세요\n');
      await execAsync(`echo "127.0.0.1\t${host}" | sudo tee -a /etc/hosts`);
      console.log('/etc/hosts 파일이 변경되었습니다.');
    }
  }
}

/**
 * @return {{config: LocalDevProxyOption, command: string[]}}
 */
function parseArgv() {
  const argv = process.argv.slice(2);

  if (/\.ldprxrc.*\.js$/.test(argv[0])) {
    return {
      config: getConfig(argv[0]),
      command: argv.slice(1),
    };
  }

  return {
    config: getConfig(),
    command: argv,
  };
}

async function main() {
  const { command, config } = parseArgv();
  const currentPorts = await getCurrentPort();

  const host = validateConfig(config);
  if (!host) {
    throw new Error(`[local-dev-proxy] .ldprxrc.js 설정이 유효하지 않습니다.`);
  }
  await checkHostDns(host);

  childProcess = wrapSpawn(command[0], command.slice(1), { stdio: 'inherit' });
  registeredRules = await register(await findNewPort(currentPorts), config);
}

const signals: { [key: string]: number } = {
  SIGINT: 2,
  SIGTERM: 15,
};

let exited = false;

async function kill(
  process: ChildProcess,
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
    process.once('exit', (code, signal) => {
      if (isResolved) {
        return;
      }
      clearTimeout(timer);
      resolve({
        code,
        signal,
      });
    });
    process.kill(signal);
  });
}

async function shutdown(signal: string, value: number) {
  if (exited) {
    return;
  }
  exited = true;
  console.log(`[local-dev-proxy] stopped by ${signal}`);

  if (childProcess) {
    await kill(childProcess, value).catch(console.error);
  }

  if (registeredRules.length > 0) {
    await deregister(registeredRules.map((x) => ({ key: x.key, target: x.target })));
  }
  process.exit(128 + value);
}

Object.keys(signals).forEach((signal) => {
  process.once(signal, () => {
    void shutdown(signal, signals[signal]);
  });
});

main();
