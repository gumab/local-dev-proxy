import { execSync } from 'child_process';
import { execAsync } from './index';
import { logger } from './logger';

export async function parseCertificateFile(path: string): Promise<
  | {
      certText: string;
      cn: string;
      isCertExists: boolean;
      domains: string[];
      domainRegexes: RegExp[];
    }
  | undefined
> {
  const certText = await execAsync(`openssl x509 -in ${path} -noout -text`).then((x) => x.stdout);
  const cn = certText.match(/CN=([.\w*-]+)/)?.[1];
  if (!cn) {
    return;
  }

  const domains = certText.match(/DNS:([.\w*-]+)/g)?.map((x) => x.replace('DNS:', '')) || [];
  const domainRegexes = domains.map((x) => new RegExp(`^${x.replace(/\./, '.').replace('*', '[\\w-]+')}$`));

  const isCertExists = await execAsync(
    `echo "$(security find-certificate -c ${cn} -a)" | grep "$(openssl x509 -in temp.pem -noout -serial | sed "s/serial=//")"`,
  )
    .then((x) => !!x.stdout)
    .catch(() => false);
  return {
    certText,
    cn,
    isCertExists,
    domains,
    domainRegexes,
  };
}

export async function installCertificate(path: string) {
  process.stdout.write('맥 패스워드를 입력하세요\n');
  execSync(`sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${path}`);
  logger.log('인증서 설치가 완료되었습니다.');
}
