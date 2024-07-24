import fetch from 'node-fetch';
import { execAsync, spawnAsync } from './utils';
import { logger } from './utils/logger';
import { LdprxError } from './libs/LdprxError';
import { t } from './i18n';

async function run() {
  const ps = await execAsync('docker ps|grep "0.0.0.0:80->"')
    .then(({ stdout }) => /^\w+/.exec(stdout)?.[0])
    .catch(() => undefined);

  if (ps) {
    logger.warn(t('Stopping the container currently occupying port 80 ({{ps}})', { ps }));
    await spawnAsync(`docker stop ${ps}`);
  }
  await spawnAsync('docker rm -f local-dev-proxy').catch(() => {
    throw new LdprxError(t('Docker Daemon not found. Please install or start it before proceeding.'));
  });

  logger.log(t('Starting proxy Docker container'));

  await spawnAsync('docker pull docker.io/gumab/local-dev-proxy:latest').catch(() => {
    // 경고만 하고 스킵
    logger.error(t('Failed to fetch Docker image. Please check your network connection for the first run or updates.'));
  });

  await spawnAsync(
    'docker run -d --name local-dev-proxy -p 80:8080 -p 443:8443 -p 8090:8090 docker.io/gumab/local-dev-proxy:latest',
  ).catch(() => {
    throw new LdprxError(t('Failed to start Docker. Please check if ports 80/443 are occupied and try again.'));
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
      throw new LdprxError(t('Please check the status of the Docker server.'));
    })();
  }
}
