import { execSync } from 'child_process';
import * as fs from 'fs';
import prompts from 'prompts';
import { isValidCertKeyPair, isValidCertToDomain } from 'ssl-validator';
import { execAsync } from './index';
import { logger } from './logger';
import { checkSudo } from './sudo-helper';

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
    // message: `[local-dev-proxy] HTTPS 사용을 위한 인증서가 설치되지 않았습니다. 정상적인 사용을 위해서는 인증서 설치가 필요합니다.\n${cn} 인증서를 신뢰할 수 있는 인증서에 추가하시겠습니까?`,
    message: `[local-dev-proxy] Certificate for HTTPS usage is not installed. For proper usage, certificate installation is required.\nWould you like to add the "${cn}" certificate to the trusted certificates?`,
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
    // logger.log('인증서 설치가 완료되었습니다.');
    logger.log('Certificate installation is complete.');
  } else {
    // throw new Error('사용자 취소');
    throw new Error('User canceled');
  }
}

export async function checkCertificates(host: string) {
  const tempKeyPath = 'temp-key.pem';
  const tempCertPath = `${host}.pem`;
  try {
    await execAsync(`curl -o ${tempKeyPath} http://localhost/__setting/download-key`);
    await setCertificateFile(tempKeyPath, tempCertPath, host);
    await execAsync(`curl -F 'data=@${tempCertPath}' http://localhost/__setting/register-cert`);
    // logger.log(`${tempCertPath} 인증서를 이용하여 https://${host} 가 활성화됩니다.`);
    logger.log(`"https://${host}" will be activated using the certificate at "${tempCertPath}".`);
  } catch (e) {
    // logger.warn(
    //   `인증서 설정이 올바르게 되지 않아 https 서비스가 정상적으로 동작하지 않을 수 있습니다.${
    //     e instanceof Error ? `\n${e.message}` : ''
    //   }`,
    // );
    logger.warn(
      `Certificate configuration is incorrect, which may cause the HTTPS service to not function properly.${
        e instanceof Error ? `\n${e.message}` : ''
      }`,
    );
  } finally {
    await execAsync(`rm -f ${tempKeyPath}`);
    await execAsync(`rm -f ${tempCertPath}`);
  }
}
