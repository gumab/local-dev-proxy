const {spawnAsync, execAsync} = require('./utils');

async function run() {
  const ps = await execAsync('docker ps|grep "0.0.0.0:80->"').
      then(({stdout}) => /^\w+/.exec(stdout)?.[0]).
      catch(() => undefined);

  if (ps) {
    console.log(`[local-dev-proxy] 현재 80포트를 점유중인 컨테이너를 중지합니다 (${ps})`);
    await spawnAsync(`docker stop ${ps}`);
  }
  await spawnAsync('docker rm -f local-dev-proxy').catch(() => {
    throw new Error('[local-dev-proxy] Docker Daemon 을 찾을 수 없습니다. 설치 혹은 실행 후 이용해주세요.');
  });

  console.log(`[local-dev-proxy] 도커 이미지를 실행합니다`);

  await spawnAsync(
      'docker run -d --name local-dev-proxy -p 80:8080 -p 443:8443 registry.dev.kurlycorp.kr/local-dev-proxy/local-dev-proxy:latest').
      catch(() => {
        throw new Error(
            '[local-dev-proxy] 도커 실행에 실패하였습니다. 80/443 포트 점유 확인 후 다시 이용해주세요.');
      });
}

module.exports.run = run;
