import i18n from 'i18next';

const orgMessages = [
  'Check the file format. (CommonJS: .js, ESModule: .cjs)',
  '{{path}} file is required',
  'is only available on Apple Silicon Mac.',
  'Changes detected in config file. Restarting process',
  'process stopped by {{signal}}',
  '/etc/hosts file has been modified.',
  '[local-dev-proxy] Host is not registered.\n{{newLines}}\nWould you like to add the item(s) to the /etc/hosts file?',
  'Stopping the container currently occupying port 80 ({{ps}})',
  'Docker Daemon not found. Please install or start it before proceeding.',
  'Starting proxy Docker container',
  'Failed to fetch Docker image. Please check your network connection for the first run or updates.',
  'Failed to start Docker. Please check if ports 80/443 are occupied and try again.',
  'Please check the status of the Docker server.',
  'Certificate installation is complete.',
  'User canceled',
  'Certificate configuration is incorrect, which may cause the HTTPS service to not function properly.{{errorMessage}}',
  '"https://{{host}}" will be activated using the certificate at "{{tempCertPath}}".',
  'Certificate for HTTPS usage is not installed. For proper usage, certificate installation is required.\nWould you like to add the "{{cn}}" certificate to the trusted certificates?',
  'Unregistration complete ({{keys}})',
  'Unregistration failed ({{statusText}})',
  '"{{host}}" is already registered with another IP ({{existHost}}). Please check and try again.',
  '.ldprxrc.js configuration is invalid.\n{{message}}',
  'Missing "key" value',
  'Missing "key" value for some sub-rule',
  'Missing "host" value for "{{key}}"',
  'Missing "targetOrigin" value for "{{key}}"',
  'Invalid "targetOrigin" value for "{{key}}". Please use the format http[s]://sample.my-domain.com',
  'At least one rule must be set',
  'Unknown error occurred (could not find child process PID)',
  'Registration complete {{info}}',
] as const;
type Message = (typeof orgMessages)[number];

const en: Record<Message, string> = orgMessages.reduce(
  (acc, cur) => {
    acc[cur] = cur;
    return acc;
  },
  {} as Record<Message, string>,
);

const ko: Record<Message, string> = {
  'Check the file format. (CommonJS: .js, ESModule: .cjs)': '파일 형식을 확인하세요. (CommonJS: .js, ESModule: .cjs)',
  '{{path}} file is required': '{{path}} 파일이 필요합니다',
  'is only available on Apple Silicon Mac.': '는 Apple Silicon Mac 에서만 사용 가능합니다.',
  'Changes detected in config file. Restarting process':
    'config 파일에 변경이 감지되었습니다. 프로세스를 다시 시작합니다',
  'process stopped by {{signal}}': '프로세스가 중지되었습니다 ({{signal}})',
  '/etc/hosts file has been modified.': '/etc/hosts 파일이 변경되었습니다.',
  '[local-dev-proxy] Host is not registered.\n{{newLines}}\nWould you like to add the item(s) to the /etc/hosts file?':
    '[local-dev-proxy] Host가 등록되지 않았습니다.\n{{newLines}}\n항목(들)을 /etc/hosts 파일에 추가하시겠습니까?',
  'Stopping the container currently occupying port 80 ({{ps}})':
    '현재 80포트를 점유중인 컨테이너를 중지합니다 ({{ps}})',
  'Docker Daemon not found. Please install or start it before proceeding.':
    'Docker Daemon 을 찾을 수 없습니다. 설치 혹은 실행 후 이용해주세요.',
  'Starting proxy Docker container': '프록시 도커 컨테이너를 실행합니다',
  'Failed to fetch Docker image. Please check your network connection for the first run or updates.':
    'Docker 이미지를 가져오는데 실패했습니다. 최초 실행 혹은 업데이트를 하려면 네트워크를 확인해주세요',
  'Failed to start Docker. Please check if ports 80/443 are occupied and try again.':
    'Docker 실행에 실패하였습니다. 80/443 포트 점유 확인 후 다시 이용해주세요.',
  'Please check the status of the Docker server.': '도커 서버의 상태를 확인해주세요',
  'Certificate installation is complete.': '인증서 설치가 완료되었습니다.',
  'User canceled': '사용자 취소',
  'Certificate configuration is incorrect, which may cause the HTTPS service to not function properly.{{errorMessage}}':
    '인증서 설정이 올바르게 되지 않아 HTTPS 서비스가 정상적으로 동작하지 않을 수 있습니다.{{errorMessage}}',
  '"https://{{host}}" will be activated using the certificate at "{{tempCertPath}}".':
    '{{tempCertPath}} 인증서를 이용하여 https://{{host}} 가 활성화됩니다.',
  'Certificate for HTTPS usage is not installed. For proper usage, certificate installation is required.\nWould you like to add the "{{cn}}" certificate to the trusted certificates?':
    'HTTPS 사용을 위한 인증서가 설치되지 않았습니다. 정상적인 사용을 위해서는 인증서 설치가 필요합니다.\n{{cn}} 인증서를 신뢰할 수 있는 인증서에 추가하시겠습니까?',
  'Unregistration complete ({{keys}})': '등록 해제 완료 ({{keys}})',
  'Unregistration failed ({{statusText}})': '등록 해제 실패 ({{statusText}})',
  '"{{host}}" is already registered with another IP ({{existHost}}). Please check and try again.':
    '"{{host}}"은(는) 이미 다른 IP({{existHost}})로 등록되어있습니다. 확인 후 다시 이용해주세요',
  '.ldprxrc.js configuration is invalid.\n{{message}}': '.ldprxrc.js 설정이 올바르지 않습니다.\n{{message}}',
  'Missing "key" value': 'key 값이 없습니다',
  'Missing "key" value for some sub-rule': '일부 sub rule 에 key 값이 없습니다',
  'Missing "host" value for "{{key}}"': '{{key}} 의 host 값이 없습니다',
  'Missing "targetOrigin" value for "{{key}}"': '{{key}} 의 targetOrigin 값이 없습니다',
  'Invalid "targetOrigin" value for "{{key}}". Please use the format http[s]://sample.my-domain.com':
    '{{key}}의 targetOrigin 값이 유효하지 않습니다. http[s]://sample.my-domain.com 형식으로 넣어주세요',
  'At least one rule must be set': 'rule 설정이 하나 이상 있어야 합니다',
  'Unknown error occurred (could not find child process PID)':
    '알 수 없는 오류 발생 (child process 의 PID를 찾을 수 없음)',
  'Registration complete {{info}}': '등록 완료 {{info}}',
};

i18n.init(
  {
    // debug: true,
    fallbackLng: 'en',
    resources: {
      en: {
        common: en,
      },
      ko: {
        common: ko,
      },
    },
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  },
  () => {},
);

export function t(message: Message, values?: Record<string, string>): string {
  return i18n.t(message, values);
}

export default i18n;
