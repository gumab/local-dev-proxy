const getProcessForPort = require('./getProcessForPort');
const { execAsync } = require('./index');

async function getCurrentPort() {
  const stdout = await execAsync('lsof -i -n -P|grep "node.*LISTEN"')
    .then((x) => x.stdout)
    .catch(() => undefined);
  if (stdout) {
    return stdout.match(/TCP \*:(\d+)/g).map((x) => Number(x.replace(/[^\d]/g, '')));
  }
  return [];
}

/**
 * @param initialCurrentPorts {number[]}
 * @param [timeout] {number}
 * @return {Promise<number>}
 */
async function findNewPort(initialCurrentPorts, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let currentPorts = initialCurrentPorts;
    const interval = setInterval(async () => {
      const newPorts = await getCurrentPort();

      const added = newPorts.filter((x) => !currentPorts.includes(x));
      currentPorts = newPorts;

      if (added.length > 0) {
        /** @type {number} */
        const appPort = added.reduce((result, port) => {
          if (result) {
            return result;
          }
          const { directory } = getProcessForPort(port);
          if (!directory) {
            // 오류케이스
            return port;
          }
          if (directory && directory.startsWith(process.cwd())) {
            return port;
          }
          return undefined;
        }, undefined);
        if (appPort) {
          resolve(appPort);
          clearInterval(interval);
          return;
        }
      }

      if (timeout && Date.now() - startTime > timeout) {
        reject(new Error('[local-dev-proxy] 서버가 실행된 포트를 찾을 수 없습니다.'));
      }
    }, 1000);
  });
}

module.exports = findNewPort;
