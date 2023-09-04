import { execAsync } from './index';
import { getProcessForPort } from './getProcessForPort';

export async function getCurrentPort(): Promise<number[]> {
  const stdout = await execAsync('lsof -i -n -P|grep "node.*LISTEN"')
    .then((x) => x.stdout)
    .catch(() => undefined);
  if (stdout) {
    const match = stdout.match(/TCP \*:(\d+)/g);
    if (match) {
      return match.map((x) => Number(x.replace(/[^\d]/g, '')));
    }
  }
  return [];
}

export async function findNewPort(initialCurrentPorts: number[], timeout?: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let currentPorts = initialCurrentPorts;
    const interval = setInterval(async () => {
      const newPorts = await getCurrentPort();

      const added = newPorts.filter((x) => !currentPorts.includes(x));
      currentPorts = newPorts;

      if (added.length > 0) {
        /** @type {number} */
        const appPort = added.reduce<number | undefined>((result: number | undefined, port: number) => {
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
        reject(new Error('서버가 실행된 포트를 찾을 수 없습니다.'));
      }
    }, 1000);
  });
}
