#!/usr/bin/env node
const path = require('path');
const {register, deregister} = require('..');
const {wrapSpawn, execAsync, spawnAsync} = require('../src/utils');
const findNewPort = require('../src/utils/findNewPort');
const prompts = require('prompts');

function getConfig() {
  try {
    return require(path.join(process.cwd(), '.ldprxrc.js'));
  } catch (e) {
    throw new Error('[local-dev-proxy] .ldprxrc.js 파일이 필요합니다');
  }
}

/**
 * @param rule {LocalDevProxyRule|LocalDevProxySubRule}
 * @param [isSubRule] {boolean}
 * @return {string|false}
 */
function validateRule(rule, isSubRule) {
  if (rule.key && rule.host && (!isSubRule || rule.target)) {
    return rule.host;
  } else {
    return false;
  }
}

/**
 * @param config {LocalDevProxyOption}
 * @return {string|false}
 */
function validateConfig(config) {
  if (config.subRules) {
    if (!config.subRules.every(subRule => validateRule(subRule, true))) {
      return false;
    }
  }
  if (config.rule instanceof Array) {
    return validateRule(config.rule[0]);
  } else {
    return validateRule(config.rule);
  }
}

/**
 * @type {RouteRuleRequest[]}
 */
let registeredRules = [];
let childProcess;

async function getCurrentPort() {
  const stdout = await execAsync('lsof -i -n -P|grep "node.*LISTEN"').
      then(x => x.stdout).
      catch(() => undefined);
  if (stdout) {
    return stdout.match(/TCP \*:(\d+)/g).
        map(x => Number(x.replace(/[^\d]/g, '')));
  }
  return [];
}

async function checkHostDns(host) {
  const isRegistered = !!(await execAsync(
      `cat "/etc/hosts"|grep "127\.0\.0\.1\\s*${host}"`).
      catch(() => undefined));
  if (!isRegistered) {
    const {registerHost} = await prompts({
      type: 'confirm',
      name: 'registerHost',
      message: `[local-dev-proxy] Host가 등록되지 않았습니다.\n127.0.0.1\t${host}\n항목을 /etc/hosts 파일에 추가하시겠습니까?`,
      initial: true,
    });
    if (registerHost) {

      const existHost = await execAsync(`cat "/etc/hosts"|grep ${host}`).
          then(x => x.stdout).
          catch(() => undefined);
      if (existHost) {
        throw new Error(`${host} 은(는) 이미 다른 IP(${existHost.match(
            /[\d.]+/)[0]})로 등록되어있습니다. 확인 후 다시 이용해주세요`);
      }

      process.stdout.write('맥 패스워드를 입력하세요\n');
      await execAsync(`echo "127.0.0.1\t${host}" | sudo tee -a /etc/hosts`);
      console.log('/etc/hosts 파일이 변경되었습니다.');
    }
  }
}

async function main() {
  /** @type {LocalDevProxyOption} */
  const config = getConfig();
  const command = process.argv.slice(2);
  const currentPorts = await getCurrentPort();

  const host = validateConfig(config);
  if (!host) {
    throw new Error(`[local-dev-proxy] .ldprxrc.js 설정이 유효하지 않습니다.`);
  }
  await checkHostDns(host);

  childProcess = wrapSpawn(command[0], command.slice(1), {stdio: 'inherit'});
  registeredRules = await register(await findNewPort(currentPorts), config);
}

const signals = {
  'SIGINT': 2, 'SIGTERM': 15,
};

let exited = false;

async function kill(process, signal, timeout) {
  let isResolved = false;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      isResolved = true;
      reject(new Error('Process kill timeout'));
    }, timeout || 10000);
    process.once('exit', (...args) => {
      if (isResolved) {
        return;
      }
      clearTimeout(timer);
      resolve(...args);
    });
    process.kill(signal);
  });
}

async function shutdown(signal, value) {
  if (exited) {
    return;
  }
  exited = true;
  console.log('[local-dev-proxy] stopped by ' + signal);

  if (childProcess) {
    await kill(childProcess, signal).catch(console.error);
  }

  if (registeredRules.length > 0) {
    await deregister(
        registeredRules.map(x => ({key: x.key, target: x.target})));
  }
  process.exit(128 + value);
}

Object.keys(signals).forEach(function(signal) {
  process.once(signal, function() {
    void shutdown(signal, signals[signal]);
  });
});

main();
