import { execSync } from 'child_process';
import * as fs from 'fs';
import prompts from 'prompts';
import { isValidCertKeyPair, isValidCertToDomain } from 'ssl-validator';
import { execAsync } from './index';
import { logger } from './logger';
import { checkSudo } from './sudo-helper';
import { t } from '../i18n';

const EMAIL_ADDRESS = 'launcher@ldprx.dev';

async function getExistingCertificates(keyFilePath: string, cn: string) {
  if (
    await execAsync(`security find-certificate -c ${cn} -a | grep '"${cn}"'`)
      .then((x) => !!x.stdout)
      .catch(() => false)
  ) {
    const key = fs.readFileSync(keyFilePath).toString();
    const certs = await execAsync(`security find-certificate -c ${cn} -ampZ`).then((x) =>
      x.stdout
        .split(/(?=SHA-256 hash)/)
        .filter((x) => x.includes(EMAIL_ADDRESS))
        .map((splited) => ({
          org: splited,
          cert: splited.slice(splited.indexOf('---')),
          sha256: splited
            .slice(0, splited.indexOf('SHA-1'))
            .replace(/^.+:\s*/, '')
            .trim(),
          sha1: splited
            .slice(splited.indexOf('SHA-1'), splited.indexOf('---'))
            .replace(/^.+:\s*/, '')
            .trim(),
        })),
    );

    return Promise.all(
      certs.map(async (cert) => ({
        ...cert,
        isValid: await isValidCertKeyPair(cert.cert, key),
        isValidDomain: await isValidCertToDomain(cert.cert, cn),
      })),
    ).then((x) => x.filter((x) => x.isValidDomain));
  }
  return [];
}

export async function setCertificateFile(keyFilePath: string, certFilePath: string, cn: string): Promise<void> {
  const certs = await getExistingCertificates(keyFilePath, cn);

  if (certs.some((x) => x.isValid)) {
    fs.writeFileSync(certFilePath, certs.find((x) => x.isValid)?.cert || '');
    return;
  }

  const { trustCert } = await prompts({
    type: 'confirm',
    name: 'trustCert',
    message: `[local-dev-proxy] ${t(
      'Certificate for HTTPS usage is not installed. For proper usage, certificate installation is required.\nWould you like to add the "{{cn}}" certificate to the trusted certificates?',
      { cn },
    )}`,
    initial: true,
  });
  if (trustCert) {
    await execAsync(
      `openssl req -x509 -new -nodes -key ${keyFilePath} -sha256 -days 36524 -out ${certFilePath} -subj "/emailAddress=${EMAIL_ADDRESS}/CN=${cn}" -extensions san -config <(printf "[req]\\ndistinguished_name=req\\n[san]\\nsubjectAltName=DNS:${cn}")`,
      {
        shell: '/bin/bash',
      },
    );

    await checkSudo();
    execSync(
      certs
        .filter((x) => !x.isValid)
        .map((cert) => `sudo security delete-certificate -c ${cn} -Z ${cert.sha1}`)
        .concat(`sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${certFilePath}`)
        .join(' && '),
    );
    logger.log(t('Certificate installation is complete.'));
  } else {
    throw new Error(t('User canceled'));
  }
}

export async function checkCertificates(host: string) {
  const tempKeyPath = 'temp-key.pem';
  const tempCertPath = `${host}.pem`;
  try {
    await execAsync(`curl -o ${tempKeyPath} http://localhost/__setting/download-key`);
    await setCertificateFile(tempKeyPath, tempCertPath, host);
    await execAsync(`curl -F 'data=@${tempCertPath}' http://localhost/__setting/register-cert`);
    logger.log(
      t('"https://{{host}}" will be activated using the certificate at "{{tempCertPath}}".', {
        host,
        tempCertPath,
      }),
    );
  } catch (e) {
    logger.warn(
      t(
        'Certificate configuration is incorrect, which may cause the HTTPS service to not function properly.{{errorMessage}}',
        { errorMessage: e instanceof Error ? `\n${e.message}` : '' },
      ),
    );
  } finally {
    await execAsync(`rm -f ${tempKeyPath}`);
    await execAsync(`rm -f ${tempCertPath}`);
  }
}
