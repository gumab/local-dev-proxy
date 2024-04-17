import prompts from 'prompts';
import { ChildProcess, execSync } from 'child_process';
import opn from 'better-opn';
import { execAsync, wrapSpawn } from './utils';
import { findNewPort, getCurrentPort } from './utils/port-finder';
import { deregister, register } from './index';
import { LocalDevProxyOption, LocalDevProxyRule, LocalDevProxySubRule, RouteRuleRequest } from './types';
import { waitForDockerRunning } from './docker-helper';
import { logger } from './utils/logger';
import { LdprxError } from './libs/LdprxError';
import { installCertificate, parseCertificateFile } from './utils/certificate-helper';

function validateRule(rule: LocalDevProxyRule | LocalDevProxySubRule, https?: boolean, isSubRule?: boolean) {
  if (rule.key && rule.host && (!isSubRule || (rule as LocalDevProxySubRule).target)) {
    return rule.host;
  } else {
    throw new LdprxError(`.ldprxrc.js 설정이 유효하지 않습니다.`);
  }
}

function validateConfig(config: LocalDevProxyOption): string {
  config.subRules?.forEach((subRule) => validateRule(subRule, config.https, true));

  if (config.rule instanceof Array) {
    return validateRule(config.rule[0], config.https);
  } else {
    return validateRule(config.rule, config.https);
  }
}

async function checkHostDns(host: string) {
  const isRegistered =
    host === '127.0.0.1' ||
    !!(await execAsync(`cat "/etc/hosts"|grep "127\\.0\\.0\\.1\\s*${host}"`)
      .then((x) => x.stdout)
      .catch(() => undefined));
  if (!isRegistered) {
    const { registerHost } = await prompts({
      type: 'confirm',
      name: 'registerHost',
      message: `[local-dev-proxy] Host가 등록되지 않았습니다.\n127.0.0.1\t${host}\n항목을 /etc/hosts 파일에 추가하시겠습니까?`,
      initial: true,
    });
    if (registerHost) {
      const existHost = await execAsync(`cat "/etc/hosts"|grep ${host}`)
        .then((x) => x.stdout)
        .catch(() => undefined);
      if (existHost) {
        throw new LdprxError(
          `${host} 은(는) 이미 다른 IP(${existHost.match(
            /[\d.]+/,
          )?.[0]})로 등록되어있습니다. 확인 후 다시 이용해주세요`,
        );
      }

      process.stdout.write('맥 패스워드를 입력하세요\n');
      execSync(`echo "127.0.0.1\t${host}" | sudo tee -a /etc/hosts`);
      logger.log('/etc/hosts 파일이 변경되었습니다.');
    }
  }
}

async function checkCertificates(host: string) {
  try {
    await execAsync('curl -o temp.pem http://localhost/__setting/download-cert');
    const certInfo = await parseCertificateFile('temp.pem');
    if (!certInfo) {
      logger.warn('인증서 설정이 올바르지 않아 https 서비스가 정상적으로 동작하지 않을 수 있습니다.');
      return;
    }

    if (!certInfo.domainRegexes.some((x) => x.test(host))) {
      logger.warn(`${host}은(는) https 로 사용할 수 없는 도메인입니다`);
    } else if (certInfo.isCertExists) {
      logger.log(`${certInfo.cn} 인증서를 이용하여 https://${host} 가 활성화됩니다.`);
    }

    if (!certInfo.isCertExists) {
      const { trustCert } = await prompts({
        type: 'confirm',
        name: 'trustCert',
        message: `[local-dev-proxy] \n${certInfo.certText}\nHTTPS 사용을 위한 인증서가 설치되지 않았습니다. 정상적인 사용을 위해서는 인증서 설치가 필요합니다.\n위 인증서를 신뢰할 수 있는 인증서에 추가하시겠습니까?`,
        initial: true,
      });
      if (trustCert) {
        await installCertificate('temp.pem');
      }
    }
  } catch (e) {
    if (e instanceof Error) logger.error(e);
  } finally {
    await execAsync('rm -f temp.pem');
  }
}

async function kill(
  cp: ChildProcess,
  signal: number,
  timeout?: number,
): Promise<{
  code: number | null;
  signal: NodeJS.Signals | null;
}> {
  let isResolved = false;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      isResolved = true;
      reject(new Error('Process kill timeout'));
    }, timeout || 10000);
    cp.once('exit', (code, signal) => {
      if (isResolved) {
        return;
      }
      clearTimeout(timer);
      resolve({
        code,
        signal,
      });
    });
    cp.kill(signal);
  });
}

export default class ProcessRunner {
  private cp?: ChildProcess;

  private registeredRules: RouteRuleRequest[] = [];

  private isRunning: boolean = false;

  async run(command: string[], config: LocalDevProxyOption) {
    this.isRunning = true;
    const currentPorts = await getCurrentPort();
    const host = validateConfig(config);
    if (!host) {
      throw new LdprxError(`.ldprxrc.js 설정이 유효하지 않습니다.`);
    }
    await checkHostDns(host);
    await waitForDockerRunning();
    if (config.https) {
      await checkCertificates(host);
    }

    this.cp = wrapSpawn(command[0], command.slice(1), { stdio: 'inherit' });
    this.cp.on('exit', async (code) => {
      this.cp = undefined;
      await this.kill(code || 0);
    });
    this.registeredRules = await register(await findNewPort(currentPorts), config);

    const { https = false, homePath = '', openOnStart = true } = config;
    if (openOnStart) {
      opn(`${https ? 'https' : 'http'}://${host}${homePath}`);
    }
  }

  async kill(code: number) {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;

    if (this.cp) {
      await kill(this.cp, code).catch(logger.error);
      this.cp = undefined;
    }

    if (this.registeredRules.length > 0) {
      await deregister(this.registeredRules.map((x) => ({ key: x.key, target: x.target })));
      this.registeredRules = [];
    }
  }
}
