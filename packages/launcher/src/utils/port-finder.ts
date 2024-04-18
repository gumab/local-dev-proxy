import { execAsync } from './index';
import { LdprxError } from '../libs/LdprxError';

export async function getCurrentProcesses(): Promise<{ pname: string; pid: number; port: number }[]> {
  const stdout = await execAsync('lsof -i -n -P')
    .then((x) => x.stdout)
    .catch(() => undefined);
  if (stdout) {
    return stdout.split('\n').flatMap((line) => {
      const match = line.match(/^(\S+)\s+(\d+)\s.+TCP (?:127\.0\.0\.1|\*):(\d+).+LISTEN/);
      if (match) {
        return {
          pname: match[1],
          pid: Number(match[2]),
          port: Number(match[3]),
        };
      }
      return [];
    });
  }
  return [];
}

async function getRelatedPids(pid: number): Promise<number[]> {
  const result = [pid];
  const stdout = await execAsync(`pgrep -P ${pid}`)
    .then((x) => x.stdout)
    .catch(() => undefined);
  if (stdout) {
    const processes = stdout
      .split('\n')
      .map(Number)
      .filter((x) => !!x);
    return result.concat(await Promise.all(processes.map(getRelatedPids)).then((y) => y.flatMap((z) => z)));
  }

  return result;
}

export async function findNewPort(pid: number, timeout?: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(async () => {
      const currentProcess = await getCurrentProcesses();
      const pids = await getRelatedPids(pid);
      const processes = currentProcess.filter((x) => pids.includes(x.pid));
      if (processes.length > 1) {
        reject(
          new LdprxError(
            `두 개 이상의 웹서버(${processes
              .map((x) => `:${x.port}`)
              .join(',')})가 실행되었습니다. .ldprxrc.js 파일에서 localServerPort 를 지정해주세요.`,
          ),
        );
        clearInterval(interval);
        return;
      }
      if (processes.length === 1) {
        resolve(processes[0].port);
        clearInterval(interval);
        return;
      }

      if (timeout && Date.now() - startTime > timeout) {
        reject(new Error('서버가 실행된 포트를 찾을 수 없습니다.'));
        clearInterval(interval);
      }
    }, 1000);
  });
}
