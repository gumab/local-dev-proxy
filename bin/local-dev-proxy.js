#!/usr/bin/env node
const path = require('path');
const {register, deregister} = require('..');
const {wrapSpawn, execAsync, spawnAsync} = require('../src/utils');
const findNewPort = require('../src/utils/findNewPort');

function getConfig() {
  try {
    return require(path.join(process.cwd(), '.ldprxrc.js'));
  } catch (e) {
    throw new Error('[local-dev-proxy] .ldprxrc.js 파일이 필요합니다');
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

async function main() {
  /** @type {LocalDevProxyOption} */
  const config = getConfig();
  const command = process.argv.slice(2);
  const currentPorts = await getCurrentPort();

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
      reject(new Error('Process kill timeout'));
    }, timeout || 10000);
    process.on('exit', (...args) => {
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
  process.on(signal, function() {
    void shutdown(signal, signals[signal]);
  });
});

main();
