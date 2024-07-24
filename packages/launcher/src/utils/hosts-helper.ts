import prompts from 'prompts';
import { execSync } from 'child_process';
import { logger } from './logger';
import { LdprxError } from '../libs/LdprxError';
import { execAsync } from './index';
import { checkSudo } from './sudo-helper';
import { t } from '../i18n';

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
      t('"{{host}}" is already registered with another IP ({{existHost}}). Please check and try again.', {
        host,
        existHost: existHost.match(/[\d.]+/)?.[0] || '',
      }),
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
      message: t(
        '[local-dev-proxy] Host is not registered.\n{{newLines}}\nWould you like to add the item(s) to the /etc/hosts file?',
        { newLines },
      ),
      initial: true,
    });
    if (registerHost) {
      await Promise.all(unregisteredHosts.map(checkHostRegisteredAsOther));

      await checkSudo();
      execSync(`echo "${newLines}" | sudo tee -a /etc/hosts`);
      logger.log(t('/etc/hosts file has been modified.'));
    }
  }
}
