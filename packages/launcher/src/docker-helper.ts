import fetch from 'node-fetch';
import { execAsync, spawnAsync } from './utils';
import { logger } from './utils/logger';

async function run() {
  const ps = await execAsync('docker ps|grep "0.0.0.0:80->"')
    .then(({ stdout }) => /^\w+/.exec(stdout)?.[0])
    .catch(() => undefined);

  if (ps) {
    logger.warn(`현재 80포트를 점유중인 컨테이너를 중지합니다 (${ps})`);
    await spawnAsync(`docker stop ${ps}`);
  }
  await spawnAsync('docker rm -f local-dev-proxy').catch(() => {
    throw new Error('Docker Daemon 을 찾을 수 없습니다. 설치 혹은 실행 후 이용해주세요.');
  });

  logger.log(`프록시 도커 컨테이너를 실행합니다`);

  await spawnAsync('docker pull registry.dev.kurlycorp.kr/local-dev-proxy/local-dev-proxy:latest').catch(() => {
    throw new Error('도커 이미지를 가져오는데 실패했습니다. 네트워크를 확인해주세요');
  });

  await spawnAsync(
    'docker run -d --name local-dev-proxy -p 80:8080 -p 443:8443 -p 8090:8090 registry.dev.kurlycorp.kr/local-dev-proxy/local-dev-proxy:latest',
  ).catch(() => {
    throw new Error('도커 실행에 실패하였습니다. 80/443 포트 점유 확인 후 다시 이용해주세요.');
  });
}

export async function healthCheck() {
  return fetch('http://localhost/__setting/rules')
    .then((x) => x.status === 200)
    .catch(() => {});
}

export async function waitForDockerRunning() {
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
      throw new Error('도커 서버의 상태를 확인해주세요');
    })();
  }
}
