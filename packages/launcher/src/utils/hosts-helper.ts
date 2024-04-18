import prompts from 'prompts';
import { execSync } from 'child_process';
import { logger } from './logger';
import { LdprxError } from '../libs/LdprxError';
import { execAsync } from './index';
import { checkSudo } from './sudo-helper';

async function checkHostRegistered(host: string) {
  return (
    host === '127.0.0.1' ||
    !!(await execAsync(`cat "/etc/hosts"|grep "127\\.0\\.0\\.1\\s*${host}"`)
      .then((x) => x.stdout)
      .catch(() => undefined))
  );
}

async function checkHostRegisteredAsOther(host: string) {
  const existHost = await execAsync(`cat "/etc/hosts"|grep ${host}`)
    .then((x) => x.stdout)
    .catch(() => undefined);
  if (existHost) {
    throw new LdprxError(
      `${host} 은(는) 이미 다른 IP(${existHost.match(/[\d.]+/)?.[0]})로 등록되어있습니다. 확인 후 다시 이용해주세요`,
    );
  }
}

export async function checkHostDns(hosts: string[]) {
  const uniqueHosts = Array.from(new Set(hosts));

  const unregisteredHosts = await Promise.all(
    uniqueHosts.map(async (host) => ({
      host,
      isRegistered: await checkHostRegistered(host),
    })),
  ).then((result) => result.filter((x) => !x.isRegistered).map((x) => x.host));

  if (unregisteredHosts.length > 0) {
    const newLines = unregisteredHosts.map((host) => `127.0.0.1\t${host}`).join('\n');

    const { registerHost } = await prompts({
      type: 'confirm',
      name: 'registerHost',
      message: `[local-dev-proxy] Host가 등록되지 않았습니다.\n${newLines}\n항목(들)을 /etc/hosts 파일에 추가하시겠습니까?`,
      initial: true,
    });
    if (registerHost) {
      await Promise.all(unregisteredHosts.map(checkHostRegisteredAsOther));

      await checkSudo();
      execSync(`echo "${newLines}" | sudo tee -a /etc/hosts`);
      logger.log('/etc/hosts 파일이 변경되었습니다.');
    }
  }
}
